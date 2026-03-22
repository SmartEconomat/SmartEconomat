import { Injectable, Logger, Inject } from '@nestjs/common';
import {
  ThrottlerGuard,
  ThrottlerException,
  ThrottlerStorage,
} from '@nestjs/throttler';
import type {
  ThrottlerModuleOptions,
  ThrottlerRequest,
} from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';

@Injectable()
export class SmartAuthThrottlerGuard extends ThrottlerGuard {
  private readonly smartLogger = new Logger(SmartAuthThrottlerGuard.name);

  constructor(
    @Inject('THROTTLER:MODULE_OPTIONS')
    options: ThrottlerModuleOptions,
    @Inject(ThrottlerStorage) storageService: ThrottlerStorage,
    reflector: Reflector
  ) {
    super(options, storageService, reflector);
    this.smartLogger.log('SmartAuthThrottlerGuard successfully initialized');
  }

  /**
   * Identifica unívocamente al cliente, priorizando su identidad lógica (email)
   * sobre su IP física para no penalizar a usuarios bajo la misma red (NAT).
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    await Promise.resolve();
    if (req.user?.id) {
      return `auth_user_${req.user.id}`;
    }

    const body = req.body;
    if (body?.email)
      return `login_email_${String(body.email).toLowerCase().trim()}`;
    if (body?.username)
      return `login_user_${String(body.username).toLowerCase().trim()}`;
    if (body?.token) return `reset_token_${String(body.token)}`;

    return req.ips?.length
      ? String(req.ips[0])
      : String(req.ip || 'unknown_ip');
  }

  protected async handleRequest(
    requestProps: ThrottlerRequest
  ): Promise<boolean> {
    if (process.env.NODE_ENV === 'test') return true;
    const { context, throttler } = requestProps;
    const req = context.switchToHttp().getRequest<Record<string, any>>();
    const method = req.method as string;
    const url = req.url as string;
    const isAuthPath = url.includes('/auth/');

    if (throttler.name === 'auth' && !isAuthPath) return true;
    if (throttler.name === 'write' && (method === 'GET' || isAuthPath))
      return true;
    if (throttler.name === 'read' && (method !== 'GET' || isAuthPath))
      return true;

    const tracker = await this.getTracker(req);
    const throttlerName = throttler.name ?? 'default';
    const key = this.generateKey(context, tracker, throttlerName);
    const { limit: resolvedLimit, ttl: resolvedTtl } = requestProps;

    const { totalHits } = await this.storageService.increment(
      key,
      resolvedTtl,
      resolvedLimit,
      0,
      throttlerName
    );

    let softLimit = 5;
    let hardLimit = 15;

    if (throttler.name === 'write') {
      softLimit = 30;
      hardLimit = 60;
    } else if (throttler.name === 'read') {
      softLimit = 150;
      hardLimit = 300;
    }

    const isAuthenticated = !!req.user?.id;
    if (isAuthenticated) {
      softLimit *= 2;
      hardLimit *= 2;
    }

    this.smartLogger.log(
      `[HITS] ${throttlerName} | ${tracker} | Hits: ${totalHits} (Target Soft: ${softLimit}, Hard: ${hardLimit})`
    );

    if (totalHits > hardLimit) {
      this.smartLogger.error(
        `[BLOCK] ${tracker} bloqueado en ${throttlerName} tras ${totalHits} peticiones.`
      );
      throw new ThrottlerException(
        'Demasiadas solicitudes. Por favor, espere un momento.'
      );
    }

    if (totalHits > softLimit) {
      const overLimit = totalHits - softLimit;
      const delayMultiplier = isAuthenticated ? 200 : 800;
      const delayMs = Math.min(overLimit * delayMultiplier, 10000);

      this.smartLogger.warn(
        `[SOFT LIMIT] ${tracker} en ${throttlerName}. Aplicando delay de ${delayMs}ms (Hit ${totalHits})`
      );
      await this.delay(delayMs);
    }

    return true;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
