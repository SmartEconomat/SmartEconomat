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
 * - **Ubicación de archivos:** `src/i18n/`.
 * - **Resolvers:**
 *   1. Query param: `?lang=en`
 *   2. Header estándar: `Accept-Language`
 *   3. Header personalizado: `x-custom-lang`
 *
 * @module I18nConfigModule
 */
@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'es',
      loaderOptions: {
        path: path.join(__dirname, '../i18n/'),
        watch: true,
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
