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

type PgDriverErrorShape = {
  code?: string;
  constraint?: string;
  detail?: string;
  table?: string;
};

/**
 * Traduce violaciones 23505 conocidas a mensajes de negocio (evita el genérico DUPLICATE_ENTRY).
 */
function translateUniqueViolation(exception: QueryFailedError): string | null {
  const msg = (exception.message || '').toLowerCase();
  const driver = (
    exception as QueryFailedError & { driverError?: PgDriverErrorShape }
  ).driverError;
  const detail = (driver?.detail || '').toLowerCase();
  const constraint = (driver?.constraint || '').toLowerCase();
  const haystack = `${msg} ${detail} ${constraint}`;

  if (
    haystack.includes('uq_producto_nombre_activo_ci') ||
    haystack.includes('(lower(trim(both from nombre)))')
  ) {
    return I18nHelper.getError('PRODUCT_NAME_DUPLICATE');
  }

  if (
    haystack.includes('(codigo_barras)=') ||
    (haystack.includes('codigo_barras') && haystack.includes('already exists'))
  ) {
    return I18nHelper.getError('BARCODE_ALREADY_REGISTERED');
  }

  if (haystack.includes('uq_3a28eddb5ae19f969fcd368bc1b')) {
    return I18nHelper.getError('DUPLICATE_SUPPLIER');
  }

  return null;
}

/**
 * Mapeo de códigos de error de PostgreSQL a claves de traducción.
 * Permite mostrar mensajes amigables al usuario para errores comunes de base de datos.
 */
const PG_ERROR_KEYS: Record<string, string> = {
  /** Error de violación de clave foránea (la entidad tiene relaciones activas). */
  '23503': 'errors.ENTITY_HAS_RELATIONS',
  /** Error de duplicidad de registro (violación de restricción única). */
  '23505': 'errors.DUPLICATE_ENTRY',
};

/**
 * Filtro global de excepciones de la aplicación.
 * Captura todos los errores no manejados, los registra y devuelve una respuesta ApiResponse estandarizada.
 * Incluye integración con Sentry para reporte de errores.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  /**
   * Método principal para capturar y procesar excepciones.
   * @param exception La excepción lanzada.
   * @param host Contexto de la petición (ArgumentsHost).
   */
  /**
   * Expone "catch" en smart-economat-backend (Nest).
   * @undefined {unknown} exception - Entrada efectiva esperada por el contrato.
   * @undefined {ArgumentsHost} host - Entrada efectiva esperada por el contrato.
   * @undefined {void} Datos efectivos después de ejecutar la operación.
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

      if (pgCode === '23505') {
        const specific = translateUniqueViolation(
          exception as QueryFailedError<Error>
        );
        if (specific) {
          this.logger.warn(
            `DB unique violation [${pgCode}] (mapped): ${exception.message}`
          );
          return this.sendResponse(
            response,
            HttpStatus.CONFLICT,
            specific,
            null,
            requestId
          );
        }
      }

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
   * Intenta traducir un valor si es una clave de i18n, de lo contrario devuelve el string original.
   * Maneja diversos tipos de entrada y normaliza la salida a string.
   * @param value El valor a procesar/traducir.
   * @returns El string traducido o procesado.
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
        return I18nHelper.translate(v);
      }

      return v;
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : String(err);
      this.logger.warn(`i18n.translate failed for key "${v}": ${errMessage}`);
      return v;
    }
  }

  /**
   * Envía la respuesta estandarizada al cliente.
   * @param response Objeto de respuesta Express.
   * @param status Código de estado HTTP.
   * @param message Mensaje descriptivo para el usuario.
   * @param error Detalles técnicos del error (opcional).
   * @param requestId Identificador único de la petición.
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
