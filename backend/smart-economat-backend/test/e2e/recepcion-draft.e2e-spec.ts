import { getTestApp } from '../setup/test-app';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { loginAndGetToken } from '../utils/test-helpers';

describe('RecepcionDraftController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    app = await getTestApp();
    adminToken = await loginAndGetToken(app);
  });

  it('debería guardar y recuperar un borrador de recepción sin ser interceptado por el controlador de recepciones', async () => {
    const payload = {
      observaciones: 'Draft Recep E2E',
      paso: 'SELECCION_PEDIDOS',
      pedidosSeleccionados: [],
    };

    const saveRes = await request(app.getHttpServer())
      .post('/api/v1/recepcion/draft')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ payload });

    expect(saveRes.status).toBe(200);
    expect(saveRes.body.data.version).toBe(1);

    const getRes = await request(app.getHttpServer())
      .get('/api/v1/recepcion/draft')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.payload.observaciones).toBe('Draft Recep E2E');
  });

  it('debería eliminar el borrador', async () => {
    await request(app.getHttpServer())
      .delete('/api/v1/recepcion/draft')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);

    const getRes = await request(app.getHttpServer())
      .get('/api/v1/recepcion/draft')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(getRes.body.data).toBeNull();
  });
});
