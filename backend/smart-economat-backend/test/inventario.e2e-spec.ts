import { getTestApp } from './test-app.helper';
import { INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from './../src/app.module';

/**
 * @file inventario.e2e-spec.ts
 * @description Pruebas de integración para el controlador de Alertas de Inventario.
 * Verifica la obtención de alertas de caducidad y stock.
 */
describe('InventarioController - Alertas (e2e)', () => {
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

  describe('Alertas', () => {
    /**
     * @test Debe obtener las alertas de caducidad próximas.
     */
    it('GET /alertas/caducidad - Debe listar alertas de caducidad (200)', () => {
      return request(app.getHttpServer() as string)
        .get('/api/v1/alertas/caducidad')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    /**
     * @test Debe obtener las alertas de productos con bajo stock.
     */
    it('GET /alertas/stock - Debe listar alertas de stock (200)', () => {
      return request(app.getHttpServer() as string)
        .get('/api/v1/alertas/stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });
});
