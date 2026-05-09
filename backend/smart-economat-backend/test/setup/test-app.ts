import { INestApplication, ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { I18nValidationPipe } from 'nestjs-i18n';
import { AppModule } from '../../src/app.module';
import { TransformInterceptor } from '../../src/common/interceptors/transform.interceptor';
import { GlobalExceptionFilter } from '../../src/common/filters/global-exception.filter';
import { useContainer } from 'class-validator';
import { runTestSeeders } from './seed-test-database';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */

const g = global as any;

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export async function getTestApp(
  options: { silent?: boolean } = {}
): Promise<INestApplication> {
  if (g.__TEST_APP__) {
    return g.__TEST_APP__ as INestApplication;
  }

  await runTestSeeders();

  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  if (options.silent) {
    app.useLogger(false);
  } else {
    app.useLogger(['error', 'warn']);
  }

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector),
    new TransformInterceptor()
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.init();

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  g.__TEST_APP__ = app;

  return app;
}

/**
 * Ejecuta la lógica de close test app dentro del flujo de la aplicación.
 * @returns Valor resultante de la operación.
 */
export async function closeTestApp(): Promise<void> {
  if (!g.__TEST_APP__) {
    return;
  }

  console.log('🔄 Cerrando aplicación NestJS...');

  try {
    const app = g.__TEST_APP__ as INestApplication;

    await app.close();

    g.__TEST_APP__ = null;

    await new Promise((resolve) => setTimeout(resolve, 100));

    console.log('✅ Aplicación NestJS cerrada');
  } catch (error) {
    console.error('❌ Error al cerrar aplicación NestJS:', error);
  }
}

/**
 * Determina si test app initialized.
 * @returns Valor resultante de la operación.
 */
export function isTestAppInitialized(): boolean {
  return !!g.__TEST_APP__;
}

/**
 * Obtiene test server.
 */
export function getTestServer() {
  if (!g.__TEST_APP__) {
    throw new Error(
      'Aplicación no inicializada. Llama a getTestApp() primero.'
    );
  }
  return g.__TEST_APP__.getHttpServer();
}
