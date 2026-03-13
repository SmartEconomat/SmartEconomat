import { getTestApp } from './test-app.helper';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

describe('ProductoController (e2e)', () => {
  jest.setTimeout(30000);

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

  async function createProducto(nombre = `Nuevo Producto ${Date.now()}`) {
    const res = await request(app.getHttpServer() as string)
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre,
        tipo: 'lacteo',
        unidad: 'L',
        contenido: 1,
      });
    return res.body.data;
  }

  describe('EAN-13 y Creación', () => {
    it('E2E-PRO-26-EAN-GEN: Generar un código EAN-13 único', async () => {
      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/productos/generar-ean13')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.codigo_barras).toHaveLength(13);
    });

    it('E2E-PRO-01-CRE: Crear producto con generación automática de EAN-13', async () => {
      const nombre = `Producto EAN Auto ${Date.now()}`;
      const response = await request(app.getHttpServer() as string)
        .post('/api/v1/productos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre,
          tipo: 'lacteo',
          unidad: 'L',
          contenido: 1,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.codigoBarras).toHaveLength(13);
    });

    it('E2E-PRO-05-CRE-ERR: Error 400 por código de barras duplicado', async () => {
      const ean = '1234567890128';
      await request(app.getHttpServer() as string)
        .post('/api/v1/productos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: `Prod 1 ${Date.now()}`,
          tipo: 'lacteo',
          unidad: 'L',
          contenido: 1,
          codigoBarras: ean,
        });

      const response = await request(app.getHttpServer() as string)
        .post('/api/v1/productos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: `Prod 2 ${Date.now()}`,
          tipo: 'lacteo',
          unidad: 'L',
          contenido: 1,
          codigoBarras: ean,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Listado y Filtros', () => {
    it('E2E-PRO-10-GET-SRCH: Búsqueda por searchTerm', async () => {
      await createProducto('EAN Search Target');
      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/productos')
        .query({ searchTerm: 'Search Target' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.data.length).toBeGreaterThan(0);
    });
  });

  describe('Edición y Eliminación', () => {
    it('E2E-PRO-17-UPD-BAS: Actualizar campos básicos', async () => {
      const producto = await createProducto();
      const response = await request(app.getHttpServer() as string)
        .patch(`/api/v1/productos/${producto.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Nombre Actualizado' });

      expect(response.status).toBe(200);
      expect(response.body.data.nombre).toBe('Nombre Actualizado');
    });

    it('E2E-PRO-22-DEL: Eliminar producto', async () => {
      const producto = await createProducto();
      await request(app.getHttpServer() as string)
        .delete(`/api/v1/productos/${producto.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      await request(app.getHttpServer() as string)
        .get(`/api/v1/productos/${producto.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
