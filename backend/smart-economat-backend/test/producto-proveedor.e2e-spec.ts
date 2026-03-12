import { getTestApp } from './test-app.helper';
import { INestApplication } from '@nestjs/common';

import request from 'supertest';

/**
 * @file producto-proveedor.e2e-spec.ts
 * @description Pruebas de integración para el controlador de relación entre Producto y Proveedor.
 * Verifica la actualización de precios e histórico.
 */
describe('ProductoProveedorController (e2e)', () => {
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

  describe('Precios e Historial', () => {
    /**
     * @test Debe fallar al intentar actualizar el precio de una vinculación inexistente.
     */
    it('PATCH /api/v1/producto-proveedor/:id/precio - Debe devolver 404 para ID inexistente', async () => {
      await request(app.getHttpServer() as string)
        .patch(
          '/api/v1/producto-proveedor/0191c30c-1e55-7000-8000-000000000000/precio'
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nuevoPrecio: 10.5 })
        .expect(404);
    });

    /**
     * @test Debe fallar al intentar obtener el historial de una vinculación inexistente.
     */
    it('GET /api/v1/producto-proveedor/:id/historial - Debe devolver 404 para ID inexistente', async () => {
      await request(app.getHttpServer() as string)
        .get(
          '/api/v1/producto-proveedor/0191c30c-1e55-7000-8000-000000000000/historial'
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
