import { getTestApp } from './test-app.helper';
import { INestApplication } from '@nestjs/common';

import request from 'supertest';

/**
 * @file proveedores.e2e-spec.ts
 * @description Pruebas de integración para el controlador de Proveedores.
 * Cubre el ciclo de vida completo (CRUD) de un proveedor.
 */
describe('ProveedorController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let proveedorId: string;

  beforeAll(async () => {
    app = await getTestApp();

    const response = await request(app.getHttpServer() as string)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@smarteconomat.com',
        password: 'SmartEconomat2026!',
      });
    adminToken = (response.body as { data: { access_token: string } }).data
      .access_token;
  });

  afterAll(() => {
    /* app compartida, no cerrar */
  });

  describe('CRUD de Proveedores', () => {
    /**
     * @test Debe crear un nuevo proveedor.
     */
    it('POST /proveedor - Debe crear un proveedor (201)', async () => {
      const res = await request(app.getHttpServer() as string)
        .post('/api/v1/proveedor')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: `Proveedor E2E ${Date.now()}`,
          nif: 'B99999999',
          email: 'e2e@proveedor.com',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      proveedorId = res.body.data.id;
    });

    /**
     * @test No debe permitir crear un proveedor con el mismo nombre.
     */
    it('POST /proveedor - Debe fallar si el nombre ya existe (400)', async () => {
      await request(app.getHttpServer() as string)
        .post('/api/v1/proveedor')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: `Proveedor E2E ${Date.now()}`,
          nif: 'B00000000',
        });

      const nombreFijo = 'Proveedor Unico';
      await request(app.getHttpServer() as string)
        .post('/api/v1/proveedor')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: nombreFijo, nif: 'B11111111' });

      const res = await request(app.getHttpServer() as string)
        .post('/api/v1/proveedor')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: nombreFijo, nif: 'B22222222' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    /**
     * @test No debe permitir crear un proveedor con el mismo NIF.
     */
    it('POST /proveedor - Debe fallar si el NIF ya existe (400)', async () => {
      const nifFijo = 'B33333333';
      await request(app.getHttpServer() as string)
        .post('/api/v1/proveedor')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Proveedor A', nif: nifFijo });

      const res = await request(app.getHttpServer() as string)
        .post('/api/v1/proveedor')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Proveedor B', nif: nifFijo })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    /**
     * @test Debe listar proveedores.
     */
    it('GET /proveedor - Debe listar proveedores (200)', () => {
      return request(app.getHttpServer() as string)
        .get('/api/v1/proveedor')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data.data)).toBe(true);
        });
    });

    /**
     * @test Debe actualizar un proveedor.
     */
    it('PATCH /proveedor/:id - Debe actualizar proveedor (200)', () => {
      return request(app.getHttpServer() as string)
        .patch(`/api/v1/proveedor/${proveedorId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Proveedor Modificado' })
        .expect(200);
    });

    /**
     * @test Debe eliminar un proveedor (admin).
     */
    it('DELETE /proveedor/:id - Debe eliminar proveedor (204)', () => {
      return request(app.getHttpServer() as string)
        .delete(`/api/v1/proveedor/${proveedorId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });

    /**
     * @test No debe permitir eliminar un proveedor con pedidos asociados.
     */
    it('DELETE /proveedor/:id - Debe fallar si tiene pedidos (400)', async () => {
      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/proveedor')
        .set('Authorization', `Bearer ${adminToken}`);

      const responseData = response.body as {
        data: { data: { id: string; pedidos?: any[] }[] };
      };

      const proveedorConRelaciones = responseData.data.data.find(
        (p) => p.pedidos && p.pedidos.length > 0
      );

      if (proveedorConRelaciones) {
        const res = await request(app.getHttpServer() as string)
          .delete(`/api/v1/proveedor/${proveedorConRelaciones.id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(400);

        expect((res.body as { success: boolean }).success).toBe(false);
      }
    });
  });
});
