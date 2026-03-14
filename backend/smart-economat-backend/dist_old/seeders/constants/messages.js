/**
 * @file messages.ts
 * @deprecated Este archivo está deprecado desde la versión 2.0. Favor de usar {@link SeederI18nHelper} en su lugar.
 * @see {@link SeederI18nHelper} en `src/common/helpers/seeder-i18n.helper.ts` para la implementación actual.
 *
 * @module SeederMessages
 * @description
 * Colección legacy de mensajes de error **hardcodeados en español** para uso exclusivo en seeders.
 *
 * ## ⚠️ AVISO DE DEPRECACIÓN
 *
 * Este archivo se mantiene únicamente para compatibilidad hacia atrás y será eliminado en futuras versiones.
 * **NO** se deben agregar nuevos mensajes a este archivo.
 *
 * ### Razones de la deprecación:
 * 1. **Falta de internacionalización**: Los mensajes están hardcodeados en español
 * 2. **No escalable**: Agregar nuevos idiomas requiere duplicar la estructura
 * 3. **Inconsistencia**: No sigue el patrón i18n del resto de la aplicación
 * 4. **Difícil mantenimiento**: Los mensajes están dispersos y duplicados
 *
 * ### Migración recomendada:
 *
 * #### ❌ Forma antigua (deprecada):
 * ```typescript
 * import { SEEDER_MESSAGES } from './constants/messages';
 *
 * if (!users.length) {
 *   throw new Error(SEEDER_MESSAGES.errors.NO_USUARIOS);
 * }
 * console.log('Seeder ejecutado correctamente');
 * ```
 *
 * #### ✅ Forma nueva (recomendada):
 * ```typescript
 * import { SeederI18nHelper } from '../common/helpers/seeder-i18n.helper';
 *
 * if (!users.length) {
 *   throw new Error(SeederI18nHelper.getError('NO_USUARIOS'));
 * }
 * console.log(SeederI18nHelper.getSeederSuccess('usuarios'));
 * ```
 *
 * ### Beneficios de usar SeederI18nHelper:
 * - ✅ Soporte multi-idioma (ES/EN) mediante variable de entorno
 * - ✅ Centralización de traducciones en archivos JSON
 * - ✅ Interpolación de argumentos en mensajes
 * - ✅ Documentación completa con ejemplos
 * - ✅ Consistencia con el resto de la aplicación
 *
 * @remarks
 * **Contexto técnico:**
 * Los seeders se ejecutan fuera del contexto de inyección de dependencias de NestJS
 * y del ciclo de vida de peticiones HTTP, por lo que no tienen acceso al `I18nContext`
 * de `nestjs-i18n`. Originalmente se creó este archivo como solución temporal, pero
 * ahora ha sido reemplazado por el helper estático {@link SeederI18nHelper}.
 *
 * @example
 * // ⚠️ EJEMPLO DE USO DEPRECADO - NO USAR EN CÓDIGO NUEVO:
 * if (!proveedores.length) {
 *   console.error(SEEDER_MESSAGES.errors.NO_PROVEEDORES);
 *   throw new Error(SEEDER_MESSAGES.errors.NO_PROVEEDORES);
 * }
 *
 * @constant
 * @type {Readonly<{ errors: Record<string, string> }>}
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SEEDER_MESSAGES", {
    enumerable: true,
    get: function() {
        return SEEDER_MESSAGES;
    }
});
const SEEDER_MESSAGES = {
    /**
   * Catálogo de mensajes de error hardcodeados en español.
   *
   * @property {string} NO_PROVEEDORES - Error cuando no existen proveedores en la base de datos
   * @property {string} NO_USUARIOS - Error cuando no existen usuarios en la base de datos
   * @property {string} NO_PRODUCTOS_PROVEEDOR - Error cuando no existen productos con proveedor asignado
   * @property {string} NO_RECEPCIONES - Error cuando no existen recepciones creadas
   * @property {string} NO_PEDIDOS - Error cuando no existen pedidos en la base de datos
   * @property {string} NO_RECEPCIONES_PRODUCTOS - Error cuando no hay recepciones de productos disponibles
   * @property {string} SEEDER_NOT_FOUND - Error cuando el archivo de seeder no se encuentra
   * @property {string} RUN_SEEDER_NOT_FOUND - Error cuando la función runSeeder no existe en el archivo
   * @property {string} NO_PRODUCTOS - Error cuando no hay productos disponibles en la base de datos
   *
   * @deprecated Usar {@link SeederI18nHelper.getError} en su lugar
   */ errors: {
        NO_PROVEEDORES: 'No hay proveedores. Ejecuta proveedor.seeder.ts primero.',
        NO_USUARIOS: 'No hay usuarios en la base de datos',
        NO_PRODUCTOS_PROVEEDOR: 'No hay productos con proveedor',
        NO_RECEPCIONES: 'No se han creado recepciones',
        NO_PEDIDOS: 'Faltan pedidos. Ejecuta su seeder primero.',
        NO_RECEPCIONES_PRODUCTOS: 'No hay recepciones de productos disponibles',
        SEEDER_NOT_FOUND: 'Seeder no encontrado',
        RUN_SEEDER_NOT_FOUND: 'No se encontró runSeeder en el archivo',
        NO_PRODUCTOS: 'No hay productos disponibles.'
    }
};

//# sourceMappingURL=messages.js.map