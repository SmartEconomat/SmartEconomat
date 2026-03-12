import { getTestApp } from './test-app.helper';
import { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from './../src/app.module';

/**
 * @file dashboard.e2e-spec.ts
 * @description Pruebas de integración para el controlador de Dashboard.
 * Verifica la obtención de estadísticas y KPIs.
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
     * @test Debe obtener las estadísticas generales del dashboard.
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
     * @test Debe denegar el acceso a las estadísticas si no hay token.
     */
    it('GET /api/v1/dashboard/stats - Debe fallar sin token (401)', () => {
      return request(app.getHttpServer() as string)
        .get('/api/v1/dashboard/stats')
        .expect(401);
    });
  });
});
