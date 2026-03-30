import {
  ExceptionFilter,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { SentryExceptionCaptured } from '@sentry/nestjs';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { QueryFailedError } from 'typeorm';
import { ApiResponse } from '../interfaces/api-response.interface';
import { APP_VERSION } from '../helpers/app-version.helper';
import { I18nContext } from 'nestjs-i18n';
import { I18nHelper } from '../helpers/i18n.helper';

/**
 * Keys used to fetch readable messages for database errors.
 * Instead of static mapping, we use dynamic i18n translations.
 */
const PG_ERROR_KEYS: Record<string, string> = {
  /** Foreign key violation: el registro está referenciado en otra tabla. */
  '23503': 'errors.ENTITY_HAS_RELATIONS',
  /** Unique constraint violation: el valor ya existe. */
  '23505': 'errors.DUPLICATE_ENTRY',
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  @SentryExceptionCaptured()
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId =
      (request.headers['x-request-id'] as string) || randomUUID();
    response.setHeader('x-request-id', requestId);

    if (exception instanceof QueryFailedError) {
      const pgCode = (exception as QueryFailedError & { code?: string }).code;
      const errorKey = pgCode ? PG_ERROR_KEYS[pgCode] : undefined;

      if (errorKey) {
        this.logger.warn(
          `DB constraint violation [${pgCode}]: ${exception.message}`
        );
        const translatedMessage = I18nHelper.translate(
          `translation.${errorKey}`
        );

        return this.sendResponse(
          response,
          HttpStatus.CONFLICT,
          translatedMessage,
          null,
          requestId
        );
      }

      this.logger.error(exception);
      const translatedInternalError = I18nHelper.getError(
        'INTERNAL_SERVER_ERROR'
      );
      return this.sendResponse(
        response,
        HttpStatus.INTERNAL_SERVER_ERROR,
        translatedInternalError,
        null,
        requestId
      );
    }

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message = I18nHelper.getError('INTERNAL_SERVER_ERROR');
    let errorDetails: unknown = null;

    const translateIfNeeded = (val: unknown) => this.translateIfNeeded(val);

    if (exception instanceof HttpException) {
      if (typeof exceptionResponse === 'string') {
        message = translateIfNeeded(exceptionResponse);
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const resp = exceptionResponse as Record<string, unknown>;
        if (Array.isArray(resp.message)) {
          message = (resp.message as string[])
            .map((m) => translateIfNeeded(m))
            .join(', ');
        } else {
          const candidate =
            (resp.message as string) || (resp.error as string) || message;
          message = translateIfNeeded(candidate);
        }
        errorDetails = resp;
      }
    } else {
      this.logger.error(exception);

      if (process.env.NODE_ENV !== 'production') {
        if (exception instanceof Error) {
          message = translateIfNeeded(exception.message);
          errorDetails = { name: exception.name, stack: exception.stack };
        } else {
          errorDetails = exception;
        }
      }
    }

    return this.sendResponse(
      response,
      status,
      message,
      errorDetails,
      requestId
    );
  }

  private translateIfNeeded(value: unknown): string {
    if (!value) return '';
    if (typeof value !== 'string') {
      return typeof value === 'object' && value !== null
        ? JSON.stringify(value)
        : String(value);
    }

    const v = value.trim();

    if (/\s/.test(v)) return v;

    try {
      if (v.startsWith('translation.')) {
        return I18nHelper.translate(v);
      }

      if (v.startsWith('errors.')) {
        return I18nHelper.translate(`translation.${v}`);
      }

      if (/^[A-Z0-9_]+$/.test(v)) {
        return I18nHelper.getError(v);
      }

      if (v.includes('.')) {
        return I18nHelper.translate(v);
      }

      return v;
    } catch (err) {
      this.logger.warn(`i18n.translate failed for key "${v}": ${err}`);
      return v;
    }
  }

  private sendResponse(
    response: Response,
    status: number,
    message: string,
    error: unknown,
    requestId: string
  ) {
    const body: ApiResponse<null> = {
      success: false,
      message,
      data: null,
      error,
      meta: {
        app: 'SmartEconomat',
        version: APP_VERSION,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        requestId,
      },
    };
    response.status(status).json(body);
  }
}
