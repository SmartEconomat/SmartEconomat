/**
 * @module TransformInterceptor
 * Global NestJS interceptor that wraps every successful controller response in the
 * standard {@link ApiResponse} envelope defined in `api-response.interface.ts`.
 *
 * Responsibilities:
 * - Attaches a `x-request-id` response header (echoed from the request header or
 *   auto-generated as a UUID v4).
 * - Bypasses wrapping for already-formatted responses (those containing `data` + `meta`)
 *   and for streaming responses (`application/pdf`, `spreadsheet`).
 * - Extracts and normalises the `message` field when the controller returns an object
 *   with a `message` property.
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Response } from 'express';
import { randomUUID } from 'node:crypto';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';
import { APP_VERSION } from '../helpers/app-version.helper';

/**
 * Interceptor that wraps controller return values in the standard `ApiResponse<T>` envelope.
 *
 * Applied globally in `main.ts` via `app.useGlobalInterceptors(new TransformInterceptor())`.
 *
 * @implements {NestInterceptor<T, ApiResponse<T>>}
 * @template T - The type of the original controller return value.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  /**
   * Intercepts the request/response lifecycle, injects the `x-request-id` header,
   * and wraps the response data in an `ApiResponse<T>` envelope.
   *
   * @param {ExecutionContext} context - NestJS execution context providing access to
   *   the underlying HTTP request and response objects.
   * @param {CallHandler} next        - The next handler in the interceptor chain.
   * @returns {Observable<any>} An observable that emits the transformed response.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    const requestHeaders = request.headers as Record<
      string,
      string | string[] | undefined
    >;
    const xRequestId = requestHeaders['x-request-id'];

    let requestId: string;
    if (typeof xRequestId === 'string') {
      requestId = xRequestId;
    } else if (Array.isArray(xRequestId) && xRequestId.length > 0) {
      requestId = xRequestId[0];
    } else {
      requestId = randomUUID();
    }

    const response = context.switchToHttp().getResponse<Response>();
    response.setHeader('x-request-id', requestId);

    return next.handle().pipe(
      map((data: unknown) => {
        if (
          response.headersSent ||
          response.get('Content-Type')?.includes('application/pdf') ||
          response.get('Content-Type')?.includes('spreadsheet')
        ) {
          return data;
        }

        let message = 'Operación exitosa';
        let responseData: T | null = data as T;

        if (
          data &&
          typeof data === 'object' &&
          'data' in data &&
          'meta' in data
        ) {
          return data as ApiResponse<T>;
        }

        if (
          data &&
          typeof data === 'object' &&
          'message' in data &&
          'data' in data
        ) {
          const dataObj = data as { message: string; data: T };
          message = dataObj.message;
          responseData = dataObj.data;
        } else if (data && typeof data === 'object' && 'message' in data) {
          const dataObj = data as {
            message: string;
            [key: string]: unknown;
          };
          message = dataObj.message;

          const { message: _msg, ...rest } = dataObj;
          void _msg;

          if (Object.keys(rest).length > 0) {
            responseData = rest as T;
          } else {
            responseData = null;
          }
        }

        return {
          success: true,
          message: message,
          data: responseData,
          meta: {
            app: 'SmartEconomat',
            version: APP_VERSION,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            requestId: requestId,
          },
        };
      })
    );
  }
}
