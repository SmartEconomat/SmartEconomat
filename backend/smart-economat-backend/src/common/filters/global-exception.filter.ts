import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { QueryFailedError } from 'typeorm';
import { ValidationError } from 'class-validator';
import { I18nService } from 'nestjs-i18n';
import { ApiResponse } from '../interfaces/api-response.interface';
import { APP_VERSION } from '../helpers/app-version.helper';

/**
 * Mapeo de códigos de error de Base de Datos a claves de traducción.
 */
const PG_ERROR_KEY_MAP: Record<string, string> = {
  /** Foreign key violation: el registro está referenciado en otra tabla. */
  '23503': 'ENTITY_HAS_RELATIONS',
  /** Unique constraint violation: el valor ya existe. */
  '23505': 'DUPLICATE_ENTRY',
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(private readonly i18n: I18nService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId =
      (request.headers['x-request-id'] as string) || randomUUID();
    response.setHeader('x-request-id', requestId);

    // Obtener el idioma desde el request (detectado por nestjs-i18n)
    const lang = request.headers['accept-language']?.split(',')[0] || 'es';

    if (exception instanceof QueryFailedError) {
      const pgCode = (exception as QueryFailedError & { code?: string }).code;
      const errorKey = pgCode ? PG_ERROR_KEY_MAP[pgCode] : null;

      if (errorKey) {
        this.logger.warn(
          `DB constraint violation [${pgCode}]: ${exception.message}`
        );

        const translatedMessage = this.i18n.translate(
          `translation.errors.${errorKey}`,
          { lang }
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
      const internalErrorMessage = this.i18n.translate(
        'translation.errors.INTERNAL_SERVER_ERROR',
        { lang }
      );

      return this.sendResponse(
        response,
        HttpStatus.INTERNAL_SERVER_ERROR,
        internalErrorMessage,
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

    let message = this.i18n.translate('translation.errors.INTERNAL_SERVER_ERROR', {
      lang,
    });
    let errorDetails: unknown = null;

    const validationErrors = this.extractValidationErrors(exception);
    if (validationErrors) {
      const translatedMessages = this.translateValidationErrors(
        validationErrors,
        lang
      );
      if (translatedMessages.length) {
        message = translatedMessages.join(', ');
      }
      errorDetails = validationErrors;
    } else if (exception instanceof HttpException) {
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

  private extractValidationErrors(exception: unknown): ValidationError[] | null {
    if (
      exception instanceof HttpException &&
      exception.constructor?.name === 'I18nValidationException'
    ) {
      const maybe = exception as HttpException & { errors?: unknown };
      if (Array.isArray(maybe.errors)) {
        return maybe.errors as ValidationError[];
      }
    }
    return null;
  }

  private translateValidationErrors(
    errors: ValidationError[],
    lang: string
  ): string[] {
    const messages: string[] = [];
    for (const error of errors) {
      this.collectValidationMessages(error, lang, messages);
    }
    return messages;
  }

  private collectValidationMessages(
    error: ValidationError,
    lang: string,
    accumulator: string[]
  ) {
    if (error.constraints) {
      for (const constraint of Object.values(error.constraints)) {
        accumulator.push(this.translateConstraint(constraint, lang));
      }
    }
    if (error.children && error.children.length) {
      for (const child of error.children) {
        this.collectValidationMessages(child, lang, accumulator);
      }
    }
  }

  private translateConstraint(constraint: string, lang: string): string {
    const [translationKey, argsPayload] = constraint.split('|', 2);
    const args = argsPayload ? this.safeParseArgs(argsPayload) : undefined;
    return this.i18n.translate(translationKey, {
      lang,
      args: args ?? {},
    });
  }

  private safeParseArgs(payload: string): Record<string, unknown> {
    try {
      return JSON.parse(payload) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
}
