import { getTestApp } from './test-app.helper';
import {
  INestApplication,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from './../src/app.module';

/**
 * @file pedidos.e2e-spec.ts
 * @description Pruebas de integración para el controlador de Pedidos.
 * Verifica la gestión de estados y fechas de entrega de los pedidos.
 */
describe('PedidoController (e2e)', () => {
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

  afterAll(() => { /* app compartida, no cerrar */ });

  describe('Gestión de Estados', () => {
    /**
     * @test Debe fallar al intentar cancelar un pedido inexistente.
     */
    it('PATCH /api/v1/pedidos/:id/cancelar - Debe dar error (404) para ID ficticio', async () => {
      await request(app.getHttpServer() as string)
        .patch('/api/v1/pedidos/0191c30c-1e55-7000-8000-000000000000/cancelar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ motivoCancelacion: 'Test E2E' })
        .expect(404);
    });

    /**
     * @test Debe fallar al actualizar la fecha de entrega de un pedido inexistente.
     */
    it('PATCH /api/v1/pedidos/:id/fecha-entrega - Debe dar error (404) para ID ficticio', async () => {
      await request(app.getHttpServer() as string)
        .patch(
          '/api/v1/pedidos/0191c30c-1e55-7000-8000-000000000000/fecha-entrega'
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fechaEntrega: new Date().toISOString() })
        .expect(404);
    });
  });
});
