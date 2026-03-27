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
import { I18nContext, I18nValidationException } from 'nestjs-i18n';

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

    const i18n = I18nContext.current(host);

    if (exception instanceof QueryFailedError) {
      const pgCode = (exception as QueryFailedError & { code?: string }).code;
      const errorKey = pgCode ? PG_ERROR_KEYS[pgCode] : undefined;

      if (errorKey) {
        this.logger.warn(
          `DB constraint violation [${pgCode}]: ${exception.message}`
        );
        const translatedMessage = i18n
          ? i18n.translate(`translation.${errorKey}`)
          : errorKey;

        return this.sendResponse(
          response,
          HttpStatus.CONFLICT,
          translatedMessage,
          null,
          requestId
        );
      }

      this.logger.error(exception);
      const translatedInternalError = i18n
        ? i18n.translate('translation.errors.INTERNAL_SERVER_ERROR')
        : 'translation.errors.INTERNAL_SERVER_ERROR';
      return this.sendResponse(
        response,
        HttpStatus.INTERNAL_SERVER_ERROR,
        translatedInternalError,
        null,
        requestId
      );
    }

    if (exception instanceof I18nValidationException) {
      const messages = this.flattenValidationErrors(exception.errors ?? []);
      const fallback = i18n
        ? i18n.translate('translation.errors.INTERNAL_SERVER_ERROR')
        : 'translation.errors.INTERNAL_SERVER_ERROR';
      return this.sendResponse(
        response,
        HttpStatus.BAD_REQUEST,
        messages.length > 0 ? messages.join(', ') : fallback,
        { errors: exception.errors },
        requestId
      );
    }

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let message = i18n
      ? i18n.translate('translation.errors.INTERNAL_SERVER_ERROR')
      : 'translation.errors.INTERNAL_SERVER_ERROR';
    let errorDetails: unknown = null;

    if (exception instanceof HttpException) {
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const resp = exceptionResponse as Record<string, unknown>;
        if (Array.isArray(resp.message)) {
          message = (resp.message as string[]).join(', ');
        } else {
          message =
            (resp.message as string) || (resp.error as string) || message;
        }
        errorDetails = resp;
      }
    } else {
      this.logger.error(exception);

      if (process.env.NODE_ENV !== 'production') {
        if (exception instanceof Error) {
          message = exception.message;
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

  private flattenValidationErrors(
    errors: { constraints?: Record<string, string>; children?: unknown[] }[]
  ): string[] {
    const messages: string[] = [];
    for (const error of errors) {
      if (error.constraints) {
        messages.push(...Object.values(error.constraints));
      }
      if (Array.isArray(error.children) && error.children.length > 0) {
        messages.push(
          ...this.flattenValidationErrors(
            error.children as {
              constraints?: Record<string, string>;
              children?: unknown[];
            }[]
          )
        );
      }
    }
    return messages;
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
