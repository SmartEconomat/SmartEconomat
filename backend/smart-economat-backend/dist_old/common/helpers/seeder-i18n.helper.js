'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'SeederI18nHelper', {
  enumerable: true,
  get: function () {
    return SeederI18nHelper;
  },
});
const _fs = /*#__PURE__*/ _interop_require_wildcard(require('fs'));
const _path = /*#__PURE__*/ _interop_require_wildcard(require('path'));
function _getRequireWildcardCache(nodeInterop) {
  if (typeof WeakMap !== 'function') return null;
  var cacheBabelInterop = new WeakMap();
  var cacheNodeInterop = new WeakMap();
  return (_getRequireWildcardCache = function (nodeInterop) {
    return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
  })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
  if (!nodeInterop && obj && obj.__esModule) {
    return obj;
  }
  if (obj === null || (typeof obj !== 'object' && typeof obj !== 'function')) {
    return {
      default: obj,
    };
  }
  var cache = _getRequireWildcardCache(nodeInterop);
  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }
  var newObj = {
    __proto__: null,
  };
  var hasPropertyDescriptor =
    Object.defineProperty && Object.getOwnPropertyDescriptor;
  for (var key in obj) {
    if (key !== 'default' && Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor
        ? Object.getOwnPropertyDescriptor(obj, key)
        : null;
      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc);
      } else {
        newObj[key] = obj[key];
      }
    }
  }
  newObj.default = obj;
  if (cache) {
    cache.set(obj, newObj);
  }
  return newObj;
}
let SeederI18nHelper = class SeederI18nHelper {
  /**
   * Carga las traducciones desde los archivos JSON de forma lazy (solo una vez).
   *
   * Los archivos se leen desde `src/i18n/{lang}/translation.json` para cada idioma soportado.
   * Si los archivos no existen o no son válidos, lanzará un error.
   *
   * @private
   * @throws {Error} Si los archivos de traducción no se pueden leer o parsear
   * @returns {void}
   */ static loadTranslations() {
    if (this.translations) return;
    const i18nPath = _path.join(__dirname, '../../i18n');
    const esPath = _path.join(i18nPath, 'es/translation.json');
    const enPath = _path.join(i18nPath, 'en/translation.json');
    try {
      this.translations = {
        es: JSON.parse(_fs.readFileSync(esPath, 'utf-8')),
        en: JSON.parse(_fs.readFileSync(enPath, 'utf-8')),
      };
    } catch (error) {
      throw new Error(
        `Error loading translation files: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  /**
   * Obtiene el idioma configurado para seeders desde la variable de entorno `SEEDER_LANG`
   * o devuelve el idioma predeterminado ('es').
   *
   * @private
   * @returns {string} El código del idioma ('es' o 'en')
   *
   * @example
   * ```typescript
   * // En bash:
   * // SEEDER_LANG=en npm run seed
   * const lang = SeederI18nHelper.getLang(); // 'en'
   * ```
   */ static getLang() {
    const lang = process.env.SEEDER_LANG || this.defaultLang;
    return lang === 'en' ? 'en' : 'es';
  }
  /**
   * Obtiene un mensaje traducido desde una ruta específica usando notación de punto (dot notation).
   *
   * Soporta interpolación de argumentos mediante placeholders `{key}` en los mensajes.
   *
   * @private
   * @param {string} path - Ruta en formato dot notation (ej: 'errors.NO_USUARIOS', 'seeders.running')
   * @param {Record<string, any>} [args] - Argumentos opcionales para interpolación en el mensaje
   * @returns {string} El mensaje traducido con argumentos interpolados, o la ruta si no se encuentra
   *
   * @example
   * ```typescript
   * // Traducción en JSON: "running": "Ejecutando seeder {file}..."
   * const msg = SeederI18nHelper.getMessage('seeders.running', { file: 'users.seeder.ts' });
   * // Output: "Ejecutando seeder users.seeder.ts..."
   * ```
   */ static getMessage(path, args) {
    this.loadTranslations();
    const lang = this.getLang();
    const keys = path.split('.');
    let value = this.translations[lang];
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) {
        return path;
      }
    }
    let message = String(value);

    if (args) {
      Object.entries(args).forEach(([key, val]) => {
        message = message.replace(`{${key}}`, String(val));
      });
    }
    return message;
  }
  /**
   * Obtiene un mensaje de error traducido desde la sección "errors" del archivo de traducción.
   *
   * @static
   * @param {string} key - La clave del mensaje de error sin el prefijo 'errors.' (ej: 'NO_USUARIOS', 'NOT_FOUND')
   * @param {Record<string, any>} [args] - Argumentos opcionales para interpolación
   * @returns {string} El mensaje de error traducido
   *
   * @example
   * ```typescript
   * // En translation.json: { "errors": { "NO_USUARIOS": "No hay usuarios en la base de datos" } }
   * throw new Error(SeederI18nHelper.getError('NO_USUARIOS'));
   * // Error: "No hay usuarios en la base de datos"
   *
   * // Con interpolación:
   * // En translation.json: { "errors": { "NOT_FOUND": "Usuario {id} no encontrado" } }
   * throw new Error(SeederI18nHelper.getError('NOT_FOUND', { id: 123 }));
   * // Error: "Usuario 123 no encontrado"
   * ```
   */ static getError(key, args) {
    return this.getMessage(`errors.${key}`, args);
  }
  /**
   * Obtiene un mensaje de éxito de seeder traducido desde la sección "seeders.success" del archivo de traducción.
   *
   * @static
   * @param {string} key - La clave del mensaje de éxito (ej: 'proveedores', 'productos', 'usuarios')
   * @param {Record<string, any>} [args] - Argumentos opcionales para interpolación
   * @returns {string} El mensaje de éxito traducido
   *
   * @example
   * ```typescript
   * // En translation.json: { "seeders": { "success": { "proveedores": "Seeder de proveedores ejecutado correctamente." } } }
   * console.log(SeederI18nHelper.getSeederSuccess('proveedores'));
   * // Output: "Seeder de proveedores ejecutado correctamente."
   *
   * // Con interpolación:
   * // En translation.json: { "seeders": { "success": { "incidencias": "Seeder: {count} incidencias creadas" } } }
   * console.log(SeederI18nHelper.getSeederSuccess('incidencias', { count: 5 }));
   * // Output: "Seeder: 5 incidencias creadas"
   * ```
   */ static getSeederSuccess(key, args) {
    return this.getMessage(`seeders.success.${key}`, args);
  }
  /**
   * Obtiene un mensaje general de seeders traducido desde la sección "seeders" del archivo de traducción.
   *
   * @static
   * @param {string} key - La clave del mensaje (ej: 'running', 'completed', 'error_running', 'production_error')
   * @param {Record<string, any>} [args] - Argumentos opcionales para interpolación
   * @returns {string} El mensaje traducido
   *
   * @example
   * ```typescript
   * // En translation.json: { "seeders": { "running": "Ejecutando seeder {file}..." } }
   * console.log(SeederI18nHelper.getSeederMessage('running', { file: 'usuarios.seeder.ts' }));
   * // Output: "Ejecutando seeder usuarios.seeder.ts..."
   *
   * // En translation.json: { "seeders": { "completed": "Seeders ejecutados correctamente" } }
   * console.log(SeederI18nHelper.getSeederMessage('completed'));
   * // Output: "Seeders ejecutados correctamente"
   * ```
   */ static getSeederMessage(key, args) {
    return this.getMessage(`seeders.${key}`, args);
  }
  /**
   * Obtiene el nombre traducido de una entidad desde la sección "entities" del archivo de traducción.
   *
   * Útil para generar mensajes dinámicos que incluyan nombres de entidades específicas.
   *
   * @static
   * @param {string} key - La clave de la entidad (ej: 'usuario', 'producto', 'pedido')
   * @returns {string} El nombre de la entidad traducido
   *
   * @example
   * ```typescript
   * // En translation.json (es): { "entities": { "usuario": "Usuario" } }
   * // En translation.json (en): { "entities": { "usuario": "User" } }
   *
   * const entityName = SeederI18nHelper.getEntity('usuario');
   * console.log(`${entityName} creado`);
   * // Output (es): "Usuario creado"
   * // Output (en): "User created"
   * ```
   */ static getEntity(key) {
    return this.getMessage(`entities.${key}`);
  }
};
/**
 * Almacena las traducciones cargadas desde los archivos JSON.
 * Se carga de forma lazy (solo cuando se necesita).
 * @private
 */ SeederI18nHelper.translations = null;
/**
 * Idioma predeterminado cuando no se especifica `SEEDER_LANG`.
 * @private
 * @readonly
 */ SeederI18nHelper.defaultLang = 'es';
