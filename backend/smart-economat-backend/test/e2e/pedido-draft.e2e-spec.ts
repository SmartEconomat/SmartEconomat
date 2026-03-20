import { getTestApp } from '../setup/test-app';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { loginAndGetToken } from '../utils/test-helpers';

describe('PedidoDraftController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    app = await getTestApp();
    adminToken = await loginAndGetToken(app);
  });

  it('debería guardar y recuperar un borrador', async () => {
    const payload = {
      observaciones: 'Draft E2E',
      lineas: [{ ppId: '1', qty: 10 }],
    };

    const saveRes = await request(app.getHttpServer())
      .post('/api/v1/pedido/draft')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ payload });

    expect(saveRes.status).toBe(200);
    expect(saveRes.body.data.version).toBe(1);

    const getRes = await request(app.getHttpServer())
      .get('/api/v1/pedido/draft')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.payload.observaciones).toBe('Draft E2E');
  });

  it('debería detectar conflicto de versiones (409)', async () => {
    const basePayload = { x: 100 };
    const setupRes = await request(app.getHttpServer())
      .post('/api/v1/pedido/draft')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ payload: basePayload });

    const currentVersion = setupRes.body.data.version;

    await request(app.getHttpServer())
      .post('/api/v1/pedido/draft')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ payload: { x: 101 }, version: currentVersion });

    const conflictRes = await request(app.getHttpServer())
      .post('/api/v1/pedido/draft')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ payload: { x: 102 }, version: currentVersion });

    expect(conflictRes.status).toBe(409);
    expect(conflictRes.body.message).toContain(
      'actualizado desde otro dispositivo'
    );
  });

  it('debería limpiar el borrador', async () => {
    await request(app.getHttpServer())
      .delete('/api/v1/pedido/draft')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);

    const getRes = await request(app.getHttpServer())
      .get('/api/v1/pedido/draft')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getRes.body.data).toBeNull();
  });
});
