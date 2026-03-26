import { Module } from '@nestjs/common';
import {
  I18nModule,
  AcceptLanguageResolver,
  QueryResolver,
  HeaderResolver,
} from 'nestjs-i18n';
import * as path from 'path';

/**
 * Módulo de configuración para la internacionalización (i18n) de la aplicación.
 * Configura `nestjs-i18n` para manejar múltiples idiomas, resolvers y archivos de traducción.
 *
 * Configuración principal:
 * - **Idioma por defecto:** Español ('es').
 * - **Ubicación de archivos:** `src/i18n/` (dev) o `dist/i18n/` (prod).
 * - **Resolvers:**
 *   1. Query param: `?lang=en`
 *   2. Header estándar: `Accept-Language`
 *   3. Header personalizado: `x-custom-lang`
 *
 * @module I18nConfigModule
 */

import * as fs from 'fs';

const isProduction = process.env.NODE_ENV === 'production';

let i18nPath = process.env.I18N_PATH;
if (!i18nPath) {
  const pathInDist = path.join(__dirname, '../i18n/');
  const pathInSrc = path.join(process.cwd(), 'src/i18n/');

  if (fs.existsSync(pathInDist)) {
    i18nPath = pathInDist;
  } else if (fs.existsSync(pathInSrc)) {
    i18nPath = pathInSrc;
  } else {
    i18nPath = isProduction ? pathInDist : pathInSrc;
  }
}

console.log(`[i18n] Cargando traducciones desde: ${i18nPath}`);

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'es',
      loaderOptions: {
        path: i18nPath,
        watch: !isProduction && process.env.NODE_ENV !== 'test',
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-custom-lang']),
      ],
    }),
  ],
  exports: [I18nModule],
})
export class I18nConfigModule {}
