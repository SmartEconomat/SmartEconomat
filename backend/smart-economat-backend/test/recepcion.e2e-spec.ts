import { getTestApp } from './test-app.helper';
import { INestApplication } from '@nestjs/common';

import request from 'supertest';

/**
 * @file recepcion.e2e-spec.ts
 * @description Pruebas de integración E2E para el controlador unificado de Recepción.
 */
describe('RecepcionController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let adminUserId: string;

  beforeAll(async () => {
    app = await getTestApp();

    const response = await request(app.getHttpServer() as string)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@smarteconomat.com',
        password: 'SmartEconomat2026!',
      });
    adminToken = response.body.data.access_token;

    const profileResponse = await request(app.getHttpServer() as string)
      .get('/api/v1/usuarios/perfil')
      .set('Authorization', `Bearer ${adminToken}`);
    adminUserId = profileResponse.body.data.id;
  });

  afterAll(() => {
    /* app compartida, no cerrar */
  });

  describe('Procesar Recepción (Batch ACID)', () => {
    it('POST /recepcion - Debe fallar con body vacío (400) por DTO multipedido', async () => {
      await request(app.getHttpServer() as string)
        .post('/api/v1/recepcion')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);
    });

    it('POST /recepcion - Debe fallar si el pedidoId no existe (404)', async () => {
      await request(app.getHttpServer() as string)
        .post('/api/v1/recepcion')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          pedidoIds: ['0191c30c-1e55-7000-8000-000000000000'],
          usuarioId: adminUserId,
          productos: [],
        })
        .expect(404);
    });
  });
});
