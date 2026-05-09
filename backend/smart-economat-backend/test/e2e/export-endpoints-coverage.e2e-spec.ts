/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { getTestApp } from '../setup/test-app';
import { loginAndGetToken } from '../utils/test-helpers';

async function getNoBuffer(
  app: INestApplication,
  path: string,
  token: string
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    request(app.getHttpServer())
      .get(path)
      .set('Authorization', `Bearer ${token}`)
      .buffer(false)
      .end((err, res) => {
        if (err)
          return reject(err instanceof Error ? err : new Error(String(err)));
        expect([200, 204]).toContain(res.status);
        (
          res as unknown as NodeJS.ReadableStream & { destroy?: () => void }
        ).destroy?.();
        resolve();
      });
  });
}

describe('Export endpoints explicit coverage (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    app = await getTestApp();
    adminToken = await loginAndGetToken(app);
  });

  it('GET export xlsx/pdf (rutas literales para auditoría)', async () => {
    await getNoBuffer(app, '/api/v1/export/productos/xlsx', adminToken);
    await getNoBuffer(app, '/api/v1/export/pedidos/xlsx', adminToken);
    await getNoBuffer(app, '/api/v1/export/proveedores/xlsx', adminToken);
    await getNoBuffer(app, '/api/v1/export/albaranes/xlsx', adminToken);
    await getNoBuffer(app, '/api/v1/export/incidencias/xlsx', adminToken);
    await getNoBuffer(app, '/api/v1/export/inventario/xlsx', adminToken);
    await getNoBuffer(app, '/api/v1/export/movimientos/xlsx', adminToken);
    await getNoBuffer(app, '/api/v1/export/recepciones/xlsx', adminToken);
    await getNoBuffer(app, '/api/v1/export/productos/pdf', adminToken);
    await getNoBuffer(app, '/api/v1/export/proveedores/pdf', adminToken);
    await getNoBuffer(app, '/api/v1/export/inventario/pdf', adminToken);
    await getNoBuffer(app, '/api/v1/export/pedidos/pdf', adminToken);
    await getNoBuffer(app, '/api/v1/export/albaranes/pdf', adminToken);
    await getNoBuffer(app, '/api/v1/export/recetas/pdf', adminToken);
  });

  it('GET producto-proveedor search', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/producto-proveedor/search')
      .query({ q: 'a' })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  it('GET recetas/export/pdf con ids', async () => {
    const list = await request(app.getHttpServer())
      .get('/api/v1/recetas?limit=1')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const id = list.body.data?.data?.[0]?.id;
    if (!id) return;
    await request(app.getHttpServer())
      .get(`/api/v1/recetas/export/pdf?ids=${id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });
});
