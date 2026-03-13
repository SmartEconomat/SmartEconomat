import { getTestApp } from '../setup/test-app';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

describe('InventarioController (e2e)', () => {
  jest.setTimeout(30000);

  let app: INestApplication;
  let adminToken: string;
  let productoProveedorId: string;
  let ubicacionId: string;

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

  beforeEach(async () => {
    const ubiRes = await request(app.getHttpServer() as string)
      .post('/api/v1/ubicacion')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: `Ubi Inv ${Date.now()}` });
    ubicacionId = ubiRes.body.data.id;

    const provRes = await request(app.getHttpServer() as string)
      .post('/api/v1/proveedor')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: `Prov Inv ${Date.now()}`,
        nif: `B${Math.floor(Math.random() * 100000000)}`,
        email: `prov_inv_${Date.now()}@example.com`,
      });
    const provId = provRes.body.data.id;

    const prodRes = await request(app.getHttpServer() as string)
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: `Prod Inv ${Date.now()}`,
        tipo: 'lacteo',
        unidad: 'L',
        contenido: 1,
        proveedores: [{ proveedorId: provId, precioUnitario: 5 }],
      });

    const prodDetail = await request(app.getHttpServer() as string)
      .get(`/api/v1/productos/${prodRes.body.data.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const relations =
      prodDetail.body.data.productoProveedores ||
      prodDetail.body.data.proveedores ||
      [];
    productoProveedorId = relations[0].id;
  });

  describe('CRUD de Inventario', () => {
    async function createInventario() {
      const res = await request(app.getHttpServer() as string)
        .post('/api/v1/inventario')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productoProveedorId,
          ubicacionId,
          cantidadActual: 100,
          cantidadMinima: 10,
          cantidadMaxima: 200,
        });
      return res.body.data;
    }

    it('E2E-INV-01-CRE: Crear item de inventario', async () => {
      const response = await request(app.getHttpServer() as string)
        .post('/api/v1/inventario')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productoProveedorId,
          ubicacionId,
          cantidadActual: 100,
          cantidadMinima: 10,
          cantidadMaxima: 200,
        });

      expect(response.status).toBe(201);
      expect(Number(response.body.data.cantidadActual)).toBe(100);
    });

    it('E2E-INV-06-GET: Listar inventario', async () => {
      await createInventario();
      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/inventario')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('E2E-INV-10-UPD-ADJ: Ajustar cantidad', async () => {
      const item = await createInventario();
      const response = await request(app.getHttpServer() as string)
        .patch(`/api/v1/inventario/${item.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cantidadActual: 150 });

      expect(response.status).toBe(200);
      expect(Number(response.body.data.cantidadActual)).toBe(150);
    });

    it('E2E-INV-15-DEL-OK: Eliminar item de inventario', async () => {
      const item = await createInventario();
      await request(app.getHttpServer() as string)
        .delete(`/api/v1/inventario/${item.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });
  });

  describe('Alertas', () => {
    it('GET /api/v1/alertas/caducidad - Debe listar alertas de caducidad', async () => {
      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/alertas/caducidad')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
    });

    it('GET /api/v1/alertas/stock - Debe listar alertas de stock', async () => {
      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/alertas/stock')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
    });
  });
});
