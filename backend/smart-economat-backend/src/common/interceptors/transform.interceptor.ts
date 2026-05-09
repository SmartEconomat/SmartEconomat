/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
import { I18nHelper } from '../helpers/i18n.helper';
import { APP_VERSION } from '../helpers/app-version.helper';

/**
 * Representa transform interceptor en el sistema.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  /**
   * Ejecuta la lógica de intercept dentro del flujo de la aplicación.
   *
   * @param context Parámetro de entrada para la operación.
   * @param next Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
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

        let message = I18nHelper.getSuccess('OPERATION_SUCCESSFUL');
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
