import { Module } from '@nestjs/common';
import {
  I18nModule,
  AcceptLanguageResolver,
  QueryResolver,
  HeaderResolver,
} from 'nestjs-i18n';
import * as path from 'path';

/**
 * @description NestJS module that configures internationalisation (i18n) for the application
 * using `nestjs-i18n`. Supports multiple languages through JSON translation files located
 * under `src/i18n/` (development) or `dist/i18n/` (production).
 *
 * Configuration summary:
 * - **Default language:** Spanish (`es`).
 * - **Translation file location:** resolved automatically from `dist/i18n/` (if it exists),
 *   then `src/i18n/`, with a fallback to the environment-appropriate path.
 * - **Language resolvers (in priority order):**
 *   1. Query parameter: `?lang=es`
 *   2. `Accept-Language` HTTP header (standard browser header).
 *   3. `x-lang` custom HTTP header.
 * - File watching is enabled in non-production, non-test environments for hot-reload of translations.
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

/**
 * @description Configures and exports the `nestjs-i18n` `I18nModule` with Spanish as
 * the fallback language and three language resolvers (query param, Accept-Language header,
 * and custom `x-lang` header). Import this module in `AppModule` to enable i18n globally.
 */
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
        new HeaderResolver(['x-lang']),
      ],
    }),
  ],
  exports: [I18nModule],
})
export class I18nConfigModule {}
