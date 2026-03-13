import { getTestApp } from './test-app.helper';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

describe('AlbaranController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    app = await getTestApp();

    const adminResponse = await request(app.getHttpServer() as string)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@smarteconomat.com',
        password: 'SmartEconomat2026!',
      });
    adminToken = adminResponse.body.data.access_token;
  });

  describe('CRUD de Albaranes (api/v1/albaranes)', () => {
    async function createAlbaran() {
      const nAlbaran = `ALB-TEST-${Date.now()}`;
      const response = await request(app.getHttpServer() as string)
        .post('/api/v1/albaranes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nAlbaran,
          concordancia: true,
          fecha: new Date(),
        });
      return response.body.data;
    }

    it('E2E-ALB-08-CRE: Crear un albarán', async () => {
      const nAlbaran = `ALB-TEST-${Date.now()}`;
      const response = await request(app.getHttpServer() as string)
        .post('/api/v1/albaranes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nAlbaran,
          concordancia: true,
          fecha: new Date(),
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.nAlbaran).toBe(nAlbaran);
    });

    it('E2E-ALB-09-LST: Listado de albaranes', async () => {
      await createAlbaran();
      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/albaranes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('E2E-ALB-10-GET-ID: Obtener el detalle de un albarán', async () => {
      const albaran = await createAlbaran();
      const response = await request(app.getHttpServer() as string)
        .get(`/api/v1/albaranes/${albaran.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(albaran.id);
    });

    it('E2E-ALB-11-UPD: Actualizar el número de documento', async () => {
      const albaran = await createAlbaran();
      const newNAlbaran = `ALB-UPD-${Date.now()}`;
      const response = await request(app.getHttpServer() as string)
        .patch(`/api/v1/albaranes/${albaran.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nAlbaran: newNAlbaran,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.nAlbaran).toBe(newNAlbaran);
    });

    it('E2E-ALB-12-DEL: Eliminar un albarán', async () => {
      const albaran = await createAlbaran();
      const response = await request(app.getHttpServer() as string)
        .delete(`/api/v1/albaranes/${albaran.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(204);

      const getRes = await request(app.getHttpServer() as string)
        .get(`/api/v1/albaranes/${albaran.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(getRes.status).toBe(404);
    });
  });
});
