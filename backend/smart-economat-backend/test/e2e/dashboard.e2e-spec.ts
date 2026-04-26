import { getTestApp } from '../setup/test-app';
import { INestApplication } from '@nestjs/common';

import request from 'supertest';

/**
 * Documentación en español.
 */
describe('DashboardController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    app = await getTestApp();

    const response = await request(app.getHttpServer() as string)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@smarteconomat.com',
        password: 'SmartEconomat2026!',
      });
    adminToken = response.body.data.access_token;
  });

  afterAll(() => {
    /* app compartida, no cerrar */
  });

  describe('Estadísticas', () => {
                /**
         * Documentación en español.
         */
    it('GET /api/v1/dashboard/stats - Debe retornar estadísticas (200)', () => {
      return request(app.getHttpServer() as string)
        .get('/api/v1/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty('inventario');
          expect(res.body.data).toHaveProperty('pedidos');
          expect(res.body.data).toHaveProperty('alertas');
        });
    });

                /**
         * Documentación en español.
         */
    it('GET /api/v1/dashboard/stats - Debe fallar sin token (401)', () => {
      return request(app.getHttpServer() as string)
        .get('/api/v1/dashboard/stats')
        .expect(401);
    });
  });
});
