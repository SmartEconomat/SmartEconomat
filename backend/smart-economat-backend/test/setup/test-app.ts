import {
  INestApplication,
  ValidationPipe,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { TransformInterceptor } from '../../src/common/interceptors/transform.interceptor';
import { GlobalExceptionFilter } from '../../src/common/filters/global-exception.filter';
import { useContainer } from 'class-validator';

/**
 * @file test-app.ts
 * @description Aplicación NestJS singleton para tests.
 *
 * Estrategia:
 * - La aplicación NestJS se crea UNA SOLA VEZ por worker de Jest
 * - Se reutiliza en todos los tests del worker
 * - Esto evita el costoso bootstrap de NestJS en cada test
 *
 * Reducción de tiempo: de ~2-5s por test a ~0ms
 *
 * @author SmartEconomat Team
 */

const g = global as any;

/**
 * Obtiene o crea la instancia singleton de la aplicación NestJS para tests.
 *
 * La aplicación se configura con:
 * - Validación global con whitelist y transform
 * - Interceptores de serialización y transformación
 * - Filtro global de excepciones
 * - Prefijo de API /api/v1
 * - Logger configurado (puede ser deshabilitado para tests silenciosos)
 *
 * @param options Opciones de configuración
 * @param options.silent Si es true, deshabilita los logs de NestJS
 * @returns Instancia de INestApplication configurada
 */
export async function getTestApp(
  options: { silent?: boolean } = {}
): Promise<INestApplication> {
  // Si ya existe, retornar la instancia existente
  if (g.__TEST_APP__) {
    return g.__TEST_APP__ as INestApplication;
  }

  // Crear módulo de testing
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  // Crear aplicación
  const app = moduleFixture.createNestApplication();

  // Configurar logger
  if (options.silent) {
    app.useLogger(false);
  } else {
    // En tests, solo mostramos errores y warnings por defecto
    app.useLogger(['error', 'warn']);
  }

  // Configurar prefijo global de API
  app.setGlobalPrefix('api/v1');

  // Configurar pipes globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no definidas en el DTO
      transform: true, // Transforma payloads al tipo esperado
      forbidNonWhitelisted: false, // No lanza error por propiedades extra
      transformOptions: {
        enableImplicitConversion: false, // Deshabilitado para mayor control
      },
    })
  );

  // Configurar interceptores globales
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector),
    new TransformInterceptor()
  );

  // Configurar filtros globales
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Inicializar aplicación
  await app.init();

  // Configurar class-validator para usar el contenedor DI de NestJS
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  // Guardar en global para reutilización
  g.__TEST_APP__ = app;

  return app;
}

/**
 * Cierra la aplicación NestJS y limpia recursos.
 * Debe ser llamado en globalTeardown.
 */
export async function closeTestApp(): Promise<void> {
  if (!g.__TEST_APP__) {
    return;
  }

  console.log('🔄 Cerrando aplicación NestJS...');

  try {
    const app = g.__TEST_APP__ as INestApplication;

    // Cerrar la aplicación
    await app.close();

    // Limpiar referencia global
    g.__TEST_APP__ = null;

    // Pequeño delay para asegurar limpieza completa
    await new Promise((resolve) => setTimeout(resolve, 100));

    console.log('✅ Aplicación NestJS cerrada');
  } catch (error) {
    console.error('❌ Error al cerrar aplicación NestJS:', error);
    // No lanzar el error, solo loggearlo
  }
}

/**
 * Verifica si la aplicación de test está inicializada
 * @returns true si la aplicación está inicializada
 */
export function isTestAppInitialized(): boolean {
  return !!g.__TEST_APP__;
}

/**
 * Obtiene el servidor HTTP de la aplicación para tests con supertest
 * @returns Servidor HTTP
 */
export function getTestServer() {
  if (!g.__TEST_APP__) {
    throw new Error(
      'Aplicación no inicializada. Llama a getTestApp() primero.'
    );
  }
  return g.__TEST_APP__.getHttpServer();
}
