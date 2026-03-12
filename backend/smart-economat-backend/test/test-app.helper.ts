import {
  INestApplication,
  ValidationPipe,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';

const g = global as any;

/**
 * Devuelve la instancia compartida de la app NestJS.
 * Se crea una sola vez y se reutiliza en todos los test suites.
 */
export async function getTestApp(): Promise<INestApplication> {
  if (g.__TEST_APP__) return g.__TEST_APP__ as INestApplication;

  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useLogger(['log', 'error', 'warn', 'debug', 'verbose']);
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new TransformInterceptor()
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  await app.init();

  g.__TEST_APP__ = app;
  return app;
}

/**
 * Cierra la instancia compartida y limpia TypeORM globalmente.
 */
export async function closeTestApp(): Promise<void> {
  if (g.__TEST_APP__) {
    try {
      const dataSource = g.__TEST_APP__.get(DataSource);
      if (dataSource && dataSource.isInitialized) {
        await dataSource.destroy();
      }
    } catch {
      // Ignorar si DataSource no está o ya se destruyó
    }

    await g.__TEST_APP__.close();
    g.__TEST_APP__ = undefined;

    // Delay to let TypeORM Postgres pooling resolve promises before Jest node env destroy
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}
