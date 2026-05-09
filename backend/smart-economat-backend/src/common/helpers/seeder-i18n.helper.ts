import * as fs from 'fs';
import * as path from 'path';

/**
 * Representa seeder i18n helper en el sistema.
 */
export class SeederI18nHelper {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  private static translations: Record<string, any> | null = null;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  private static readonly defaultLang = 'es';

  /**
   * Ejecuta la lógica de load translations dentro del flujo de la aplicación.
   */
  private static loadTranslations(): void {
    if (this.translations) return;

    let i18nPath = process.env.I18N_PATH;
    const triedPaths: string[] = [];
    if (!i18nPath) {
      const pathRelativeToModule = path.resolve(__dirname, '../../i18n');
      const pathInSrc = path.join(process.cwd(), 'src/i18n');
      const pathInDist = path.join(process.cwd(), 'dist/i18n');

      triedPaths.push(pathRelativeToModule, pathInSrc, pathInDist);

      if (fs.existsSync(pathRelativeToModule)) {
        i18nPath = pathRelativeToModule;
      } else if (fs.existsSync(pathInSrc)) {
        i18nPath = pathInSrc;
      } else if (fs.existsSync(pathInDist)) {
        i18nPath = pathInDist;
      }
    }
    if (!i18nPath) {
      throw new Error(
        `No se encontró ningún directorio de i18n válido. Intentados: ${triedPaths.join(', ')}`
      );
    }
    const esPath = path.join(i18nPath, 'es/translation.json');
    const enPath = path.join(i18nPath, 'en/translation.json');
    try {
      this.translations = {
        es: JSON.parse(fs.readFileSync(esPath, 'utf-8')),
        en: JSON.parse(fs.readFileSync(enPath, 'utf-8')),
      };

      console.log(
        `[SeederI18nHelper] Traducciones cargadas desde: ${i18nPath}`
      );
    } catch (error) {
      throw new Error(
        `Error loading translation files: ${error instanceof Error ? error.message : String(error)} | intentado en: ${i18nPath}`
      );
    }
  }

  /**
   * Obtiene lang.
   * @returns Valor resultante de la operación.
   */
  private static getLang(): string {
    const lang = process.env.SEEDER_LANG || this.defaultLang;
    return lang === 'en' ? 'en' : 'es';
  }

  /**
   * Obtiene message.
   *
   * @param path Parámetro de entrada para la operación.
   * @param args Parámetro de entrada para la operación. Opcional.
   * @returns Valor resultante de la operación.
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
   * Obtiene error.
   *
   * @param key Parámetro de entrada para la operación.
   * @param args Parámetro de entrada para la operación. Opcional.
   * @returns Valor resultante de la operación.
   */
  static getError(key: string, args?: Record<string, any>): string {
    return this.getMessage(`errors.${key}`, args);
  }

  /**
   * Obtiene seeder success.
   *
   * @param key Parámetro de entrada para la operación.
   * @param args Parámetro de entrada para la operación. Opcional.
   * @returns Valor resultante de la operación.
   */
  static getSeederSuccess(key: string, args?: Record<string, any>): string {
    return this.getMessage(`seeders.success.${key}`, args);
  }

  /**
   * Obtiene seeder message.
   *
   * @param key Parámetro de entrada para la operación.
   * @param args Parámetro de entrada para la operación. Opcional.
   * @returns Valor resultante de la operación.
   */
  static getSeederMessage(key: string, args?: Record<string, any>): string {
    return this.getMessage(`seeders.${key}`, args);
  }

  /**
   * Obtiene entity.
   *
   * @param key Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  static getEntity(key: string): string {
    return this.getMessage(`entities.${key}`);
  }
}
