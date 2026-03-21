import { getTestApp } from '../setup/test-app';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

describe('Slots Admin Management (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let profesorToken: string;

  beforeAll(async () => {
    app = await getTestApp();

    const adminResponse = await request(app.getHttpServer() as string)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@smarteconomat.com',
        password: 'SmartEconomat2026!',
      });
    adminToken = adminResponse.body.data.access_token;

    const profResponse = await request(app.getHttpServer() as string)
      .post('/api/v1/auth/login')
      .send({
        email: 'profesor1@smarteconomat.com',
        password: 'SmartEconomat2026!',
      });
    profesorToken = profResponse.body.data.access_token;
  });

  describe('Admin Slot Management', () => {
    let testSlotId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer() as string)
        .post('/api/v1/profesores/slots')
        .set('Authorization', `Bearer ${profesorToken}`)
        .send({
          aula: 'Aula Admin Test',
          numeroClase: 99,
          capacidad: 25,
        });
      testSlotId = res.body.data.id;
    });

    it('PATCH /profesores/admin-slots/:id - Admin should be able to update any slot', async () => {
      const response = await request(app.getHttpServer() as string)
        .patch(`/api/v1/profesores/admin-slots/${testSlotId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          aula: 'Aula Admin Test Updated',
          capacidad: 35,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.aula).toBe('Aula Admin Test Updated');
      expect(response.body.data.capacidad).toBe(35);
    });

    it('DELETE /profesores/admin-slots/:id - Admin should be able to delete any slot', async () => {
      const response = await request(app.getHttpServer() as string)
        .delete(`/api/v1/profesores/admin-slots/${testSlotId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      const checkRes = await request(app.getHttpServer() as string)
        .get('/api/v1/profesores/all-slots')
        .set('Authorization', `Bearer ${adminToken}`);

      const deletedSlot = checkRes.body.data.find(
        (s: any) => s.id === testSlotId
      );
      expect(deletedSlot).toBeUndefined();
    });

    it('DELETE /profesores/admin-slots/:id - Should fail if slot does not exist', async () => {
      const response = await request(app.getHttpServer() as string)
        .delete(
          '/api/v1/profesores/admin-slots/00000000-0000-0000-0000-000000000000'
        )
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    it('DELETE /profesores/admin-slots/:id - Should fail for a regular professor', async () => {
      const response = await request(app.getHttpServer() as string)
        .delete(`/api/v1/profesores/admin-slots/${testSlotId}`)
        .set('Authorization', `Bearer ${profesorToken}`);

      expect(response.status).toBe(403);
    });
  });
});
