'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'GlobalExceptionFilter', {
  enumerable: true,
  get: function () {
    return GlobalExceptionFilter;
  },
});
const _common = require('@nestjs/common');
const _nestjs = require('@sentry/nestjs');
const _nodecrypto = require('node:crypto');
const _typeorm = require('typeorm');
const _appversionhelper = require('../helpers/app-version.helper');
const _nestjsi18n = require('nestjs-i18n');
function _ts_decorate(decorators, target, key, desc) {
  var c = arguments.length,
    r =
      c < 3
        ? target
        : desc === null
          ? (desc = Object.getOwnPropertyDescriptor(target, key))
          : desc,
    d;
  if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
    r = Reflect.decorate(decorators, target, key, desc);
  else
    for (var i = decorators.length - 1; i >= 0; i--)
      if ((d = decorators[i]))
        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return (c > 3 && r && Object.defineProperty(target, key, r), r);
}
function _ts_metadata(k, v) {
  if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
    return Reflect.metadata(k, v);
}
/**
 * Keys used to fetch readable messages for database errors.
 * Instead of static mapping, we use dynamic i18n translations.
 */ const PG_ERROR_KEYS = {
  /** Foreign key violation: el registro está referenciado en otra tabla. */ 23503:
    'errors.ENTITY_HAS_RELATIONS',
  /** Unique constraint violation: el valor ya existe. */ 23505:
    'errors.DUPLICATE_ENTRY',
};
let GlobalExceptionFilter = class GlobalExceptionFilter {
  catch(exception, host) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const requestId =
      request.headers['x-request-id'] || (0, _nodecrypto.randomUUID)();
    response.setHeader('x-request-id', requestId);
    const i18n = _nestjsi18n.I18nContext.current(host);
    if (exception instanceof _typeorm.QueryFailedError) {
      const pgCode = exception.code;
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
          _common.HttpStatus.CONFLICT,
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
        _common.HttpStatus.INTERNAL_SERVER_ERROR,
        translatedInternalError,
        null,
        requestId
      );
    }
    const status =
      exception instanceof _common.HttpException
        ? exception.getStatus()
        : _common.HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse =
      exception instanceof _common.HttpException
        ? exception.getResponse()
        : null;
    let message = i18n
      ? i18n.translate('translation.errors.INTERNAL_SERVER_ERROR')
      : 'translation.errors.INTERNAL_SERVER_ERROR';
    let errorDetails = null;
    if (exception instanceof _common.HttpException) {
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const resp = exceptionResponse;
        if (Array.isArray(resp.message)) {
          message = resp.message.join(', ');
        } else {
          message = resp.message || resp.error || message;
        }
        errorDetails = resp;
      }
    } else {
      this.logger.error(exception);
      if (process.env.NODE_ENV !== 'production') {
        if (exception instanceof Error) {
          message = exception.message;
          errorDetails = {
            name: exception.name,
            stack: exception.stack,
          };
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
  sendResponse(response, status, message, error, requestId) {
    const body = {
      success: false,
      message,
      data: null,
      error,
      meta: {
        app: 'SmartEconomat',
        version: _appversionhelper.APP_VERSION,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        requestId,
      },
    };
    response.status(status).json(body);
  }
  constructor() {
    this.logger = new _common.Logger(GlobalExceptionFilter.name);
  }
};
_ts_decorate(
  [
    (0, _nestjs.SentryExceptionCaptured)(),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      Object,
      typeof ArgumentsHost === 'undefined' ? Object : ArgumentsHost,
    ]),
    _ts_metadata('design:returntype', void 0),
  ],
  GlobalExceptionFilter.prototype,
  'catch',
  null
);
GlobalExceptionFilter = _ts_decorate(
  [(0, _common.Catch)()],
  GlobalExceptionFilter
);
