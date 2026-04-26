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
import { I18nHelper } from '../helpers/i18n.helper';

/**
 * @description Claves usadas para obtener mensajes legibles para errores de base de datos.
 * En lugar de un mapeo estático, se utilizan traducciones i18n dinámicas.
 */
const PG_ERROR_KEYS: Record<string, string> = {
  /** Foreign key violation: el registro está referenciado en otra tabla. */
  '23503': 'errors.ENTITY_HAS_RELATIONS',
  /** Unique constraint violation: el valor ya existe. */
  '23505': 'errors.DUPLICATE_ENTRY',
};

/**
 * @description Filtro global de excepciones de NestJS que captura todas las excepciones no gestionadas
 * (HTTP, QueryFailedError de TypeORM y errores de ejecución inesperados) y las convierte en
 * un sobre JSON consistente {@link ApiResponse}. Las violaciones de restricciones de PostgreSQL
 * se mapean a mensajes i18n legibles por humanos. Se añade una cabecera única `x-request-id`
 * a cada respuesta de error para el rastreo distribuido. En entornos no productivos,
 * los errores inesperados incluyen una traza de pila en el campo `error`.
 * @example
 *
 * app.useGlobalFilters(new GlobalExceptionFilter());
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  /**
   * @description Manejador principal de excepciones invocado por el pipeline de NestJS para cada
   * excepción no capturada. Determina el código de estado HTTP apropiado y el mensaje i18n,
   * y luego delega en `sendResponse` para escribir el cuerpo JSON.
   * @param exception - La excepción lanzada; puede ser una `HttpException`, un
   *   `QueryFailedError` de TypeORM, un `Error` genérico o cualquier otro valor.
   * @param host - `ArgumentsHost` de NestJS que proporciona acceso al contexto HTTP.
   * @returns La respuesta HTTP escrita en el socket subyacente (mediante `response.json`).
   */
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

  /**
   * @description Convierte un valor arbitrario en una cadena legible por humanos, intentando
   * la traducción i18n cuando el valor parece una clave de traducción. Gestiona cadenas,
   * números, booleanos, símbolos y objetos serializables a JSON. Las claves que coinciden con
   * `translation.*`, `errors.*` o identificadores en mayúsculas (`[A-Z0-9_]+`) se pasan
   * a `I18nHelper` para su traducción.
   * @param value - El valor a traducir o serializar.
   * @returns Una representación en cadena legible por humanos del valor.
   */
  private translateIfNeeded(value: unknown): string {
    if (value === null || value === undefined) return '';

    if (typeof value !== 'string') {
      if (
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        typeof value === 'bigint'
      ) {
        return value.toString();
      }

      if (typeof value === 'symbol') {
        return value.description || value.toString();
      }

      try {
        const serialized = JSON.stringify(value);
        return serialized ?? '[unserializable]';
      } catch {
        return '[unserializable]';
      }
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
        const translated = I18nHelper.translate(v);
        return translated === v ? this.humanize(v) : translated;
      }

      return v;
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : String(err);
      this.logger.warn(`i18n.translate failed for key "${v}": ${errMessage}`);
      return this.humanize(v);
    }
  }

  /**
   * Transforma una key técnica en texto legible por humanos.
   * Ej: 'user.name' -> 'Name' | 'status.PENDIENTE' -> 'Pendiente'
   */
  private humanize(key: string): string {
    if (!key) return '';
    const parts = key.split('.');
    const lastPart = parts[parts.length - 1];
    return lastPart
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/^\w/, (c) => c.toUpperCase());
  }

  /**
   * @description Escribe un cuerpo JSON estándar {@link ApiResponse} con un código de estado HTTP dado.
   * Incluye metadatos de la aplicación (nombre, versión, marca de tiempo, entorno)
   * y el `x-request-id` proporcionado para el rastreo.
   * @param response - El objeto `Response` de Express en el que escribir.
   * @param status - El código de estado HTTP a establecer en la respuesta.
   * @param message - El mensaje de error legible por humanos.
   * @param error - Detalles de error estructurados opcionales (p. ej. errores de validación, traza de pila).
   * @param requestId - El identificador único de la petición añadido a la cabecera `x-request-id`.
   */
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
