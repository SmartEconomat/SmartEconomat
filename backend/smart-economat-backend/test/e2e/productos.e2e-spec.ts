import { getTestApp } from '../setup/test-app';
import {
  loginAndGetToken,
  generateUniqueName,
  expectStandardResponse,
} from '../utils/test-helpers';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

describe('ProductoController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    app = await getTestApp();

    adminToken = await loginAndGetToken(app);
  });

  /**
   * Helper: Crear producto de test
   * Usa nombre único para evitar colisiones en tests paralelos
   */
  async function createProducto(nombre?: string) {
    const productoNombre = nombre || generateUniqueName('Producto');

    const res = await request(app.getHttpServer())
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: productoNombre,
        tipo: 'lacteo',
        unidad: 'L',
        contenido: 1,
      });

    return res.body.data;
  }

  describe('EAN-13 y Creación', () => {
    it('E2E-PRO-26-EAN-GEN: Generar un código EAN-13 único', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/productos/generar-ean13')
        .set('Authorization', `Bearer ${adminToken}`);

      expectStandardResponse(response, 200);
      expect(response.body.data.codigo_barras).toHaveLength(13);
    });

    it('E2E-PRO-01-CRE: Crear producto con generación automática de EAN-13', async () => {
      const nombre = generateUniqueName('Producto EAN Auto');

      const response = await request(app.getHttpServer())
        .post('/api/v1/productos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre,
          tipo: 'lacteo',
          unidad: 'L',
          contenido: 1,
        });

      expectStandardResponse(response, 201);
      expect(response.body.data.codigoBarras).toHaveLength(13);
    });

    it('E2E-PRO-05-CRE-ERR: Error 400 por código de barras duplicado', async () => {
      const ean = `1234567890${Date.now().toString().slice(-3)}`;

      await request(app.getHttpServer())
        .post('/api/v1/productos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: generateUniqueName('Prod 1'),
          tipo: 'lacteo',
          unidad: 'L',
          contenido: 1,
          codigoBarras: ean,
        });

      const response = await request(app.getHttpServer())
        .post('/api/v1/productos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: generateUniqueName('Prod 2'),
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
      const uniqueTerm = `SearchTarget${Date.now()}`;
      await createProducto(`EAN ${uniqueTerm}`);

      const response = await request(app.getHttpServer())
        .get('/api/v1/productos')
        .query({ searchTerm: uniqueTerm })
        .set('Authorization', `Bearer ${adminToken}`);

      expectStandardResponse(response, 200);
      expect(response.body.data.data.length).toBeGreaterThan(0);
    });
  });

  describe('Edición y Eliminación', () => {
    it('E2E-PRO-17-UPD-BAS: Actualizar campos básicos', async () => {
      const producto = await createProducto();

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/productos/${producto.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Nombre Actualizado' });

      expectStandardResponse(response, 200);
      expect(response.body.data.nombre).toBe('Nombre Actualizado');
    });

    it('E2E-PRO-22-DEL: Eliminar producto', async () => {
      const producto = await createProducto();

      await request(app.getHttpServer())
        .delete(`/api/v1/productos/${producto.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      await request(app.getHttpServer())
        .get(`/api/v1/productos/${producto.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
