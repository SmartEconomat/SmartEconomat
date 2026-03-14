'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'TransformInterceptor', {
  enumerable: true,
  get: function () {
    return TransformInterceptor;
  },
});
const _common = require('@nestjs/common');
const _nodecrypto = require('node:crypto');
const _operators = require('rxjs/operators');
const _appversionhelper = require('../helpers/app-version.helper');
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
let TransformInterceptor = class TransformInterceptor {
  intercept(context, next) {
    const request = context.switchToHttp().getRequest();
    const requestHeaders = request.headers;
    const xRequestId = requestHeaders['x-request-id'];
    let requestId;
    if (typeof xRequestId === 'string') {
      requestId = xRequestId;
    } else if (Array.isArray(xRequestId) && xRequestId.length > 0) {
      requestId = xRequestId[0];
    } else {
      requestId = (0, _nodecrypto.randomUUID)();
    }
    const response = context.switchToHttp().getResponse();
    response.setHeader('x-request-id', requestId);
    return next.handle().pipe(
      (0, _operators.map)((data) => {
        let message = 'Operación exitosa';
        let responseData = data;
        if (
          data &&
          typeof data === 'object' &&
          'data' in data &&
          'meta' in data
        ) {
          return data;
        }
        if (
          data &&
          typeof data === 'object' &&
          'message' in data &&
          'data' in data
        ) {
          const dataObj = data;
          message = dataObj.message;
          responseData = dataObj.data;
        } else if (data && typeof data === 'object' && 'message' in data) {
          const dataObj = data;
          message = dataObj.message;
          const { message: _msg, ...rest } = dataObj;
          void _msg;
          if (Object.keys(rest).length > 0) {
            responseData = rest;
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
            version: _appversionhelper.APP_VERSION,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            requestId: requestId,
          },
        };
      })
    );
  }
};
TransformInterceptor = _ts_decorate(
  [(0, _common.Injectable)()],
  TransformInterceptor
);
