import { getTestApp } from './test-app.helper';
import {
  INestApplication,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from './../src/app.module';

/**
 * @file productos.e2e-spec.ts
 * @description Pruebas de integración para el controlador de Productos.
 * Cubre el ciclo de vida completo (CRUD) de un producto.
 */
describe('ProductoController (e2e)', () => {
  jest.setTimeout(30000);

  let app: INestApplication;
  let adminToken: string;
  let productoId: string;

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

  afterAll(() => { /* app compartida, no cerrar */ });

  describe('CRUD de Productos', () => {
    /**
     * @test Debe crear un nuevo producto con datos válidos.
     */
    it('POST /productos - Debe crear un producto (201)', async () => {
      const res = await request(app.getHttpServer() as string)
        .post('/api/v1/productos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: `Producto E2E ${Date.now()}`,
          tipo: 'lacteo',
          unidad: 'L',
          contenido: 1,
        });

      if (res.status !== 201) {
        console.error(
          'SERVER ERROR DURING TEST:',
          JSON.stringify(res.body, null, 2)
        );
      }
      expect(res.status).toBe(201);

      expect(res.body.success).toBe(true);
      productoId = res.body.data.id;
    });

    /**
     * @test Debe listar todos los productos registrados.
     */
    it('GET /productos - Debe listar productos (200)', () => {
      return request(app.getHttpServer() as string)
        .get('/api/v1/productos')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data.data)).toBe(true);
        });
    });

    /**
     * @test Debe obtener los detalles de un producto por su ID.
     */
    it('GET /productos/:id - Debe obtener un producto (200)', () => {
      return request(app.getHttpServer() as string)
        .get(`/api/v1/productos/${productoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    /**
     * @test Debe actualizar el nombre u otros campos de un producto.
     */
    it('PATCH /productos/:id - Debe actualizar producto (200)', () => {
      return request(app.getHttpServer() as string)
        .patch(`/api/v1/productos/${productoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Producto Modificado' })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.nombre).toBe('Producto Modificado');
        });
    });

    /**
     * @test Debe eliminar un producto del sistema.
     */
    it('DELETE /productos/:id - Debe eliminar producto (204)', () => {
      return request(app.getHttpServer() as string)
        .delete(`/api/v1/productos/${productoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });

    /**
     * @test No debe encontrar un producto que ha sido eliminado.
     */
    it('GET /productos/:id - Debe dar 404 para producto eliminado', () => {
      return request(app.getHttpServer() as string)
        .get(`/api/v1/productos/${productoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
