import { Module } from '@nestjs/common';
import {
  I18nModule,
  AcceptLanguageResolver,
  QueryResolver,
  HeaderResolver,
} from 'nestjs-i18n';
import * as path from 'path';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */

import * as fs from 'fs';

const isProduction = process.env.NODE_ENV === 'production';

let i18nPath = process.env.I18N_PATH;
if (!i18nPath) {
  const pathInDist = path.join(__dirname, '../i18n/');
  const pathInSrc = path.join(process.cwd(), 'src/i18n/');
  const distExists = fs.existsSync(pathInDist);
  const srcExists = fs.existsSync(pathInSrc);

  /**
   * En desarrollo, `nest start --watch` puede vaciar dist (deleteOutDir) y tardar un ciclo en
   * volver a copiar assets → si priorizamos dist/i18n, la primera resolución i18n falla tras un rebuild.
   * Con código montado desde el host, `src/i18n` es estable.
   */
  if (!isProduction && srcExists) {
    i18nPath = pathInSrc;
  } else if (distExists) {
    i18nPath = pathInDist;
  } else if (srcExists) {
    i18nPath = pathInSrc;
  } else {
    i18nPath = isProduction ? pathInDist : pathInSrc;
  }
}

console.log(`[i18n] Cargando traducciones desde: ${i18nPath}`);

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
