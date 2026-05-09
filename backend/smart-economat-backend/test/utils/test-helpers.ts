import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { getTestApp } from '../setup/test-app';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
 * Ejecuta la lógica de setup test dentro del flujo de la aplicación.
 */
export async function setupTest() {
  const app = await getTestApp();
  const adminToken = await loginAndGetToken(app);

  return { app, adminToken };
}

/**
 * Ejecuta la lógica de setup test with tokens dentro del flujo de la aplicación.
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
 * Ejecuta la lógica de generate unique name dentro del flujo de la aplicación.
 *
 * @param prefix Parámetro de entrada para la operación. Opcional.
 * @returns Valor resultante de la operación.
 */
export function generateUniqueName(prefix: string = 'Test'): string {
  return `${prefix} ${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Ejecuta la lógica de generate unique email dentro del flujo de la aplicación.
 *
 * @param prefix Parámetro de entrada para la operación. Opcional.
 * @returns Valor resultante de la operación.
 */
export function generateUniqueEmail(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@test.com`;
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
 * Ejecuta la lógica de expect paginated response dentro del flujo de la aplicación.
 *
 * @param response Parámetro de entrada para la operación.
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
 * Ejecuta la lógica de wait dentro del flujo de la aplicación.
 *
 * @param ms Parámetro de entrada para la operación.
 * @returns Valor resultante de la operación.
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
  } catch {
    return;
  }
}
