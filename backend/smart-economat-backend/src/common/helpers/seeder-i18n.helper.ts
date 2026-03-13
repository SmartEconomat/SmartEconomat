import * as fs from 'fs';
import * as path from 'path';

/**
 * Helper estático de internacionalización (i18n) para seeders y contextos sin acceso a NestJS.
 *
 * Este helper permite acceder a traducciones desde archivos JSON sin depender del
 * contexto de inyección de dependencias de NestJS (`I18nContext`), lo cual es especialmente
 * útil en scripts de seeders, migraciones, tareas de CLI y otros contextos ejecutados
 * fuera del ciclo de vida de peticiones HTTP.
 *
 * @remarks
 * **¿Por qué usar este helper?**
 * - Los seeders se ejecutan fuera del contexto de inyección de dependencias de NestJS
 * - No tienen acceso al contexto HTTP de las peticiones
 * - No pueden usar `I18nContext.current()` de `nestjs-i18n`
 * - Necesitan traducciones estáticas determinadas por variables de entorno
 *
 * **Configuración de idioma:**
 * El idioma por defecto es español ('es'). Para cambiar el idioma, establece
 * la variable de entorno `SEEDER_LANG`:
 * ```bash
 * SEEDER_LANG=en npm run seed
 * ```
 *
 * **Estructura de archivos de traducción:**
 * Los archivos JSON deben estar ubicados en `src/i18n/{lang}/translation.json`
 * con la siguiente estructura:
 * ```json
 * {
 *   "errors": { "KEY": "Mensaje de error" },
 *   "success": { "KEY": "Mensaje de éxito" },
 *   "seeders": {
 *     "running": "Mensaje con {interpolación}",
 *     "success": { "KEY": "Mensaje de éxito de seeder" }
 *   },
 *   "permiso.entity": { "usuario": "Usuario" }
 * }
 * ```
 *
 * @example
 * ```typescript
 * import { SeederI18nHelper } from '../common/helpers/seeder-i18n.helper';
 *
 * // Obtener mensaje de error
 * throw new Error(SeederI18nHelper.getError('NO_USUARIOS'));
 *
 * // Obtener mensaje de éxito de seeder
 * console.log(SeederI18nHelper.getSeederSuccess('proveedores'));
 *
 * // Mensaje con interpolación
 * console.log(SeederI18nHelper.getSeederMessage('running', { file: 'proveedor.seeder.ts' }));
 * // Output: "Ejecutando seeder proveedor.seeder.ts..."
 *
 * // Obtener nombre de entidad
 * console.log(SeederI18nHelper.getEntity('usuario'));
 * // Output: "Usuario" (es) o "User" (en)
 * ```
 *
 * @class SeederI18nHelper
 * @static
 * @see {@link https:
 */
export class SeederI18nHelper {
  /**
   * Almacena las traducciones cargadas desde los archivos JSON.
   * Se carga de forma lazy (solo cuando se necesita).
   * @private
   */
  private static translations: Record<string, any> | null = null;

  /**
   * Idioma predeterminado cuando no se especifica `SEEDER_LANG`.
   * @private
   * @readonly
   */
  private static readonly defaultLang = 'es';

  /**
   * Carga las traducciones desde los archivos JSON de forma lazy (solo una vez).
   *
   * Los archivos se leen desde `src/i18n/{lang}/translation.json` para cada idioma soportado.
   * Si los archivos no existen o no son válidos, lanzará un error.
   *
   * @private
   * @throws {Error} Si los archivos de traducción no se pueden leer o parsear
   * @returns {void}
   */
  private static loadTranslations(): void {
    if (this.translations) return;

    const i18nPath = path.join(__dirname, '../../i18n');
    const esPath = path.join(i18nPath, 'es/translation.json');
    const enPath = path.join(i18nPath, 'en/translation.json');

    try {
      this.translations = {
        es: JSON.parse(fs.readFileSync(esPath, 'utf-8')),
        en: JSON.parse(fs.readFileSync(enPath, 'utf-8')),
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
   */
  private static getLang(): string {
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
   */
  private static getMessage(path: string, args?: Record<string, any>): string {
    this.loadTranslations();

    const lang = this.getLang();
    const keys = path.split('.');
    let value: any = this.translations![lang];

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
   */
  static getError(key: string, args?: Record<string, any>): string {
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
   */
  static getSeederSuccess(key: string, args?: Record<string, any>): string {
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
   */
  static getSeederMessage(key: string, args?: Record<string, any>): string {
    return this.getMessage(`seeders.${key}`, args);
  }

  /**
   * Obtiene el nombre traducido de una entidad desde la sección "permiso.entity" del archivo de traducción.
   *
   * Útil para generar mensajes dinámicos que incluyan nombres de entidades específicas.
   *
   * @static
   * @param {string} key - La clave de la entidad (ej: 'usuario', 'producto', 'pedido')
   * @returns {string} El nombre de la entidad traducido
   *
   * @example
   * ```typescript
   * // En translation.json (es): { "permiso.entity": { "usuario": "Usuario" } }
   * // En translation.json (en): { "permiso.entity": { "usuario": "User" } }
   *
   * const entityName = SeederI18nHelper.getEntity('usuario');
   * console.log(`${entityName} creado`);
   * // Output (es): "Usuario creado"
   * // Output (en): "User created"
   * ```
   */
  static getEntity(key: string): string {
    return this.getMessage(`entities.${key}`);
  }
}
