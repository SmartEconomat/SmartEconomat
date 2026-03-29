import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import type { Request } from 'express';

@Injectable()
export class HighTrafficAlertInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HighTrafficAlert');
  private readonly userRequestCount = new Map<
    string,
    { count: number; lastTs: number }
  >();

  private readonly ALERT_THRESHOLD = 100;
  private readonly ALERT_WINDOW_MS = 10000;

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (
      process.env.NODE_ENV === 'test' ||
      typeof process.env.JEST_WORKER_ID !== 'undefined'
    ) {
      return next.handle();
    }

    const req = context
      .switchToHttp()
      .getRequest<Request & { user?: { id?: string } }>();
    const userId = req.user?.id;

    if (userId) {
      this.monitorUser(userId, req.path);
    }

    return next.handle();
  }

  private monitorUser(userId: string, path: string) {
    const now = Date.now();
    const data = this.userRequestCount.get(userId) || { count: 0, lastTs: now };

    if (now - data.lastTs > this.ALERT_WINDOW_MS) {
      data.count = 1;
      data.lastTs = now;
    } else {
      data.count++;
    }

    this.userRequestCount.set(userId, data);

    if (data.count === this.ALERT_THRESHOLD) {
      this.logger.error(
        `🚨 [ALERTA TRAFICO] Usuario ${userId} superó ${this.ALERT_THRESHOLD} peticiones en ${this.ALERT_WINDOW_MS / 1000}s en la ruta: ${path}`
      );
    }
  }
}
