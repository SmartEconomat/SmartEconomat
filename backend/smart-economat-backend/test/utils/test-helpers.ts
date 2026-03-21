import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { getTestApp } from '../setup/test-app';

/**
 * @file test-helpers.ts
 * @description Utilidades comunes para tests E2E.
 *
 * Este archivo proporciona funciones helper que simplifican
 * la escritura de tests y reducen código duplicado.
 *
 * @author SmartEconomat Team
 */

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token?: string;
}

export const DEFAULT_CREDENTIALS = {
  admin: {
    email: 'admin@smarteconomat.com',
    password: 'SmartEconomat2026!',
  },
  user: {
    email: 'user@smarteconomat.com',
    password: 'SmartEconomat2026!',
  },
};

/**
 * Realiza login y obtiene el token de acceso.
 *
 * @param app Aplicación NestJS
 * @param credentials Credenciales de login (por defecto: admin)
 * @returns Token de acceso
 */
export async function loginAndGetToken(
  app: INestApplication,
  credentials: LoginCredentials = DEFAULT_CREDENTIALS.admin
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send(credentials);

  if (response.status !== 200) {
    console.error('LOGIN ERROR RESPONSE:', response.body);
  }

  expect(response.status).toBe(200);

  return response.body.data.access_token;
}

/**
 * Realiza login y obtiene todos los tokens.
 *
 * @param app Aplicación NestJS
 * @param credentials Credenciales de login
 * @returns Objeto con access_token y refresh_token
 */
export async function loginAndGetTokens(
  app: INestApplication,
  credentials: LoginCredentials = DEFAULT_CREDENTIALS.admin
): Promise<AuthTokens> {
  const response = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send(credentials)
    .expect(200);

  return {
    access_token: response.body.data.access_token,
    refresh_token: response.body.data.refresh_token,
  };
}

/**
 * Crea un cliente autenticado de supertest.
 *
 * Uso:
 * ```typescript
 * const client = await createAuthenticatedClient(app);
 * const response = await client.get('/api/v1/productos');
 * ```
 *
 * @param app Aplicación NestJS
 * @param credentials Credenciales de login
 * @returns Función que retorna request con Authorization header
 */
export async function createAuthenticatedClient(
  app: INestApplication,
  credentials: LoginCredentials = DEFAULT_CREDENTIALS.admin
) {
  const token = await loginAndGetToken(app, credentials);

  return {
    get: (url: string) =>
      request(app.getHttpServer())
        .get(url)
        .set('Authorization', `Bearer ${token}`),
    post: (url: string) =>
      request(app.getHttpServer())
        .post(url)
        .set('Authorization', `Bearer ${token}`),
    patch: (url: string) =>
      request(app.getHttpServer())
        .patch(url)
        .set('Authorization', `Bearer ${token}`),
    put: (url: string) =>
      request(app.getHttpServer())
        .put(url)
        .set('Authorization', `Bearer ${token}`),
    delete: (url: string) =>
      request(app.getHttpServer())
        .delete(url)
        .set('Authorization', `Bearer ${token}`),
  };
}

/**
 * Obtiene la aplicación de test y el token de admin.
 * Útil para simplificar el setup de tests.
 *
 * @returns Objeto con app y adminToken
 */
export async function setupTest() {
  const app = await getTestApp();
  const adminToken = await loginAndGetToken(app);

  return { app, adminToken };
}

/**
 * Obtiene la aplicación de test con múltiples tokens.
 *
 * @returns Objeto con app y tokens de diferentes roles
 */
export async function setupTestWithTokens() {
  const app = await getTestApp();
  const adminToken = await loginAndGetToken(app, DEFAULT_CREDENTIALS.admin);

  return {
    app,
    adminToken,
  };
}

/**
 * Genera un nombre único para tests.
 * Útil para evitar colisiones en tests paralelos.
 *
 * @param prefix Prefijo del nombre
 * @returns Nombre único
 */
export function generateUniqueName(prefix: string = 'Test'): string {
  return `${prefix} ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Genera un email único para tests.
 *
 * @param prefix Prefijo del email
 * @returns Email único
 */
export function generateUniqueEmail(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@test.com`;
}

/**
 * Verifica que una respuesta tenga el formato estándar de la API.
 *
 * @param response Respuesta de supertest
 * @param expectedStatus Código de estado HTTP esperado
 */
export function expectStandardResponse(
  response: any,
  expectedStatus: number = 200
) {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('success');
  expect(response.body).toHaveProperty('data');
}

/**
 * Verifica que una respuesta de error tenga el formato esperado.
 *
 * @param response Respuesta de supertest
 * @param expectedStatus Código de estado HTTP esperado
 */
export function expectErrorResponse(
  response: any,
  expectedStatus: number = 400
) {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('success', false);
  expect(response.body).toHaveProperty('message');
}

/**
 * Verifica que una respuesta de paginación tenga el formato esperado.
 *
 * @param response Respuesta de supertest
 */
export function expectPaginatedResponse(response: any) {
  expect(response.status).toBe(200);
  expect(response.body.data).toHaveProperty('data');
  expect(response.body.data).toHaveProperty('meta');
  expect(response.body.data.meta).toHaveProperty('page');
  expect(response.body.data.meta).toHaveProperty('perPage');
  expect(response.body.data.meta).toHaveProperty('total');
  expect(Array.isArray(response.body.data.data)).toBe(true);
}

/**
 * Espera un tiempo determinado.
 * Útil para tests que requieren delays (usar con moderación).
 *
 * @param ms Milisegundos a esperar
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Elimina un recurso de forma segura.
 * No falla si el recurso no existe.
 *
 * @param app Aplicación NestJS
 * @param url URL del recurso a eliminar
 * @param token Token de autenticación
 */
export async function safeDelete(
  app: INestApplication,
  url: string,
  token: string
): Promise<void> {
  try {
    await request(app.getHttpServer())
      .delete(url)
      .set('Authorization', `Bearer ${token}`);
  } catch {}
}
