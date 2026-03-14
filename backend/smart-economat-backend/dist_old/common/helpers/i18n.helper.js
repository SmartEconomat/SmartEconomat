'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'I18nHelper', {
  enumerable: true,
  get: function () {
    return I18nHelper;
  },
});
const _nestjsi18n = require('nestjs-i18n');
let I18nHelper = class I18nHelper {
  /**
   * Obtiene un mensaje de error traducido desde el archivo de traducción (sección "errors").
   *
   * @static
   * @param {string} key - La clave del mensaje de error (ej: 'USER_NOT_FOUND').
   * @param {Record<string, any>} [args] - Argumentos opcionales para interpolar en el mensaje (ej: { id: 1 }).
   * @returns {string} El mensaje de error traducido o la clave si no se encuentra.
   * @memberof I18nHelper
   */ static getError(key, args) {
    const i18n = _nestjsi18n.I18nContext.current();
    return (
      i18n?.translate(`translation.errors.${key}`, {
        args,
      }) || `translation.errors.${key}`
    );
  }
  /**
   * Obtiene un mensaje de éxito traducido desde el archivo de traducción (sección "success").
   *
   * @static
   * @param {string} key - La clave del mensaje de éxito (ej: 'CREATED').
   * @param {Record<string, any>} [args] - Argumentos opcionales para interpolar.
   * @returns {string} El mensaje de éxito traducido.
   * @memberof I18nHelper
   */ static getSuccess(key, args) {
    const i18n = _nestjsi18n.I18nContext.current();
    return (
      i18n?.translate(`translation.success.${key}`, {
        args,
      }) || `translation.success.${key}`
    );
  }
  /**
   * Obtiene un mensaje de validación traducido desde el archivo de traducción (sección "validation").
   *
   * @static
   * @param {string} key - La clave de validación (ej: 'INVALID_EMAIL').
   * @param {Record<string, any>} [args] - Argumentos opcionales.
   * @returns {string} El mensaje de validación traducido.
   * @memberof I18nHelper
   */ static getValidation(key, args) {
    const i18n = _nestjsi18n.I18nContext.current();
    return (
      i18n?.translate(`translation.validation.${key}`, {
        args,
      }) || `translation.validation.${key}`
    );
  }
  /**
   * Obtiene el nombre localizable de una entidad (sección "entities").
   * Útil para generar mensajes dinámicos como "Usuario no encontrado".
   *
   * @static
   * @param {string} key - La clave de la entidad (ej: 'usuario').
   * @returns {string} El nombre de la entidad traducido.
   * @memberof I18nHelper
   */ static getEntity(key) {
    const i18n = _nestjsi18n.I18nContext.current();
    return (
      i18n?.translate(`translation.entities.${key}`) ||
      `translation.entities.${key}`
    );
  }
  /**
   * Método genérico para obtener cualquier traducción dada su ruta completa (dot notation).
   *
   * @static
   * @param {string} key - La ruta completa de la traducción (ej: 'errors.USER_NOT_FOUND').
   * @param {Record<string, any>} [args] - Argumentos opcionales.
   * @returns {string} El texto traducido.
   * @memberof I18nHelper
   */ static translate(key, args) {
    const i18n = _nestjsi18n.I18nContext.current();
    return (
      i18n?.translate(key, {
        args,
      }) || key
    );
  }
};
