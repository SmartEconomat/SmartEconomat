import { getTestApp } from '../setup/test-app';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

/**
 * Documentación en español.
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
     * Documentación en español.
     */
  it('/ (GET)', () => {
    return request(app.getHttpServer() as string)
      .get('/api/v1')
      .expect(200);
  });
});
