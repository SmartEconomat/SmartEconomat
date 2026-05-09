import { I18nContext } from 'nestjs-i18n';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Helper para internacionalización (i18n).
 * Proporciona métodos para traducir textos y obtener nombres de entidades en diferentes idiomas.
 */
export class I18nHelper {
  private static translations: Record<string, Record<string, unknown>> | null =
    null;

  private static readonly defaultLang = 'es';

  private static getFallbackLang(): 'es' | 'en' {
    const configured =
      process.env.I18N_FALLBACK_LANGUAGE ||
      process.env.SEEDER_LANG ||
      I18nHelper.defaultLang;
    return configured.toLowerCase() === 'en' ? 'en' : 'es';
  }

  private static ensureTranslationsLoaded(): void {
    if (I18nHelper.translations !== null) {
      return;
    }

    const configuredPath = process.env.I18N_PATH;
    const candidates = [
      configuredPath,
      path.resolve(__dirname, '../../i18n'),
      path.join(process.cwd(), 'src/i18n'),
      path.join(process.cwd(), 'dist/i18n'),
    ].filter((candidate): candidate is string => !!candidate);

    for (const basePath of candidates) {
      const esPath = path.join(basePath, 'es/translation.json');
      const enPath = path.join(basePath, 'en/translation.json');

      if (!fs.existsSync(esPath) || !fs.existsSync(enPath)) {
        continue;
      }

      try {
        I18nHelper.translations = {
          es: JSON.parse(fs.readFileSync(esPath, 'utf-8')) as Record<
            string,
            unknown
          >,
          en: JSON.parse(fs.readFileSync(enPath, 'utf-8')) as Record<
            string,
            unknown
          >,
        };
        return;
      } catch (err) {
        console.error(
          `[I18nHelper] Failed to parse translation file at ${basePath}: ${err}`
        );
      }
    }

    I18nHelper.translations = {};
  }

  private static interpolate(
    message: string,
    args?: Record<string, any>
  ): string {
    if (!args) {
      return message;
    }

    let output = message;
    for (const [key, value] of Object.entries(args)) {
      output = output.replaceAll(`{${key}}`, String(value));
    }
    return output;
  }

  private static translateFromFiles(
    key: string,
    args?: Record<string, any>
  ): string | null {
    I18nHelper.ensureTranslationsLoaded();

    const lang = I18nHelper.getFallbackLang();
    const translations = I18nHelper.translations?.[lang];
    if (!translations) {
      return null;
    }

    const normalizedKey = key.startsWith('translation.')
      ? key.slice('translation.'.length)
      : key;
    const keyParts = normalizedKey.split('.');

    let current: unknown = translations;
    for (const part of keyParts) {
      if (!current || typeof current !== 'object' || !(part in current)) {
        return null;
      }
      current = (current as Record<string, unknown>)[part];
    }

    if (typeof current !== 'string') {
      return null;
    }

    return I18nHelper.interpolate(current, args);
  }

  private static translateKey(
    key: string,
    args?: Record<string, any>
  ): string | null {
    const i18n = I18nContext.current();
    const translated = i18n?.translate(key, { args });

    if (typeof translated === 'string' && translated !== key) {
      return translated;
    }

    return I18nHelper.translateFromFiles(key, args);
  }

  /**
   * Obtiene un mensaje de error traducido.
   * Busca la clave en translation.errors.
   * @param key Clave del error.
   * @param args Argumentos para interpolación.
   * @returns Texto traducido.
   */
  static getError(key: string, args?: Record<string, any>): string {
    return I18nHelper.translate(`translation.errors.${key}`, args);
  }

  /**
   * Obtiene un mensaje de éxito traducido.
   * Busca la clave en translation.success.
   * @param key Clave del éxito.
   * @param args Argumentos para interpolación.
   * @returns Texto traducido.
   */
  static getSuccess(key: string, args?: Record<string, any>): string {
    return I18nHelper.translate(`translation.success.${key}`, args);
  }

  /**
   * Obtiene un mensaje de validación traducido.
   * Busca la clave en translation.validation.
   * @param key Clave de validación.
   * @param args Argumentos para interpolación.
   * @returns Texto traducido.
   */
  static getValidation(key: string, args?: Record<string, any>): string {
    return I18nHelper.translate(`translation.validation.${key}`, args);
  }

  /**
   * Obtiene el nombre de una entidad traducido.
   * Busca la clave en translation.entities.
   * @param key Clave de la entidad.
   * @returns Nombre traducido.
   */
  static getEntity(key: string): string {
    return I18nHelper.translate(`translation.entities.${key}`);
  }

  /**
   * Traduce una clave.
   * Busca la clave en el contexto actual o en los archivos de traducción.
   * Si no se encuentra, intenta humanizar la clave.
   * @param key Clave a traducir.
   * @param args Argumentos para interpolación.
   * @returns Texto traducido.
   */
  static translate(key: string, args?: Record<string, any>): string {
    const direct = I18nHelper.translateKey(key, args);
    if (direct) {
      return direct;
    }

    if (!key.startsWith('translation.')) {
      const prefixed = I18nHelper.translateKey(`translation.${key}`, args);
      if (prefixed) {
        return prefixed;
      }
    }

    return I18nHelper.humanize(key);
  }

  /**
   * Convierte una clave como 'USER_NOT_FOUND' a 'User Not Found'
   * @param key Clave a convertir.
   * @returns Texto convertido.
   */
  private static humanize(key: string): string {
    const lastPart = key.split('.').pop() || key;
    return lastPart
      .replace(/[_-]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
}
