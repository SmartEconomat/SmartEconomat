import { getTestApp } from '../setup/test-app';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
describe('AppController (e2e)', () => {
  jest.setTimeout(30000);

  let app: INestApplication;

  beforeAll(async () => {
    app = await getTestApp();
  });

  afterAll(() => {
    /* app compartida, no cerrar */
  });

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  it('/ (GET)', () => {
    return request(app.getHttpServer() as string)
      .get('/api/v1')
      .expect(200);
  });
});
