import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import type { Request } from 'express';

/**
 * @description NestJS interceptor that monitors per-user request rates and emits an
 * error-level log alert when a single authenticated user exceeds {@link ALERT_THRESHOLD}
 * requests within the {@link ALERT_WINDOW_MS} sliding window. The interceptor is a
 * no-op in Jest test environments to avoid false positives during testing.
 * @example
 * // Register globally in AppModule providers:
 * { provide: APP_INTERCEPTOR, useClass: HighTrafficAlertInterceptor }
 */
@Injectable()
export class HighTrafficAlertInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HighTrafficAlert');

  /** @description In-memory map tracking hit counts and last-seen timestamps per user ID. */
  private readonly userRequestCount = new Map<
    string,
    { count: number; lastTs: number }
  >();

  /** @description Number of requests within the window that triggers the alert. */
  private readonly ALERT_THRESHOLD = 100;

  /** @description Length of the sliding monitoring window in milliseconds (10 seconds). */
  private readonly ALERT_WINDOW_MS = 10000;

  /**
   * @description Intercepts every incoming request. In test environments the call is
   * passed through immediately. For all other environments, if the request belongs to
   * an authenticated user, the user's per-window hit count is updated via
   * {@link monitorUser} before the downstream handler is invoked.
   * @param context - NestJS execution context used to extract the HTTP request.
   * @param next - The downstream call handler whose `handle()` produces the response stream.
   * @returns The observable response stream returned by the downstream handler.
   */
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

  /**
   * @description Increments the request counter for the given user within the current
   * time window. Resets the counter when the previous window has expired. Logs an
   * error-level alert exactly once — when the count first reaches {@link ALERT_THRESHOLD}.
   * @param userId - The authenticated user's unique identifier.
   * @param path - The URL path of the current request, included in the alert message.
   */
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
