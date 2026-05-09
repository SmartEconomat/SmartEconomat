import { getTestApp } from '../setup/test-app';
import { INestApplication } from '@nestjs/common';

import request from 'supertest';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
     * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
     * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
