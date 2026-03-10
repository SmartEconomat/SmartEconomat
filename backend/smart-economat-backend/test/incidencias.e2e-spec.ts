import { getTestApp } from './test-app.helper';
import {
  INestApplication,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from './../src/app.module';

/**
 * Interface simple para tipar respuestas del API en tests.
 */
interface TestApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * @file incidencias.e2e-spec.ts
 * @description Pruebas de integración E2E para el controlador de Incidencias.
 */
describe('IncidenciaController (e2e)', () => {
  jest.setTimeout(20000);

  let app: INestApplication;
  let adminToken: string;
  let profesorToken: string;
  let adminUserId: string;
  let testIncidenciaId: string;
  let recepcionId: string;

  beforeAll(async () => {
    app = await getTestApp();

    // Login admin
    const adminResponse = await request(app.getHttpServer() as string)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@smarteconomat.com',
        password: 'SmartEconomat2026!',
      });
    adminToken = (
      adminResponse.body as TestApiResponse<{ access_token: string }>
    ).data.access_token;

    const profileResponse = await request(app.getHttpServer() as string)
      .get('/api/v1/usuarios/perfil')
      .set('Authorization', `Bearer ${adminToken}`);
    adminUserId = (profileResponse.body as TestApiResponse<{ id: string }>).data
      .id;

    // Login profesor
    const profesorResponse = await request(app.getHttpServer() as string)
      .post('/api/v1/auth/login')
      .send({
        email: 'profesor1@smarteconomat.com',
        password: 'SmartEconomat2026!',
      });
    profesorToken = (
      profesorResponse.body as TestApiResponse<{ access_token: string }>
    ).data.access_token;

    // Crear datos propios: proveedor → producto (con vínculo) → pedido → recepción
    const provRes = await request(app.getHttpServer() as string)
      .post('/api/v1/proveedor')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: `Proveedor Incidencia E2E ${Date.now()}`,
      });
    if (!provRes.body.data) console.error('Proveedor creation failed:', JSON.stringify(provRes.body));
    const proveedorId = provRes.body.data?.id;

    // Crear producto CON proveedor vinculado en un solo paso
    const prodRes = await request(app.getHttpServer() as string)
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: `Producto Incidencia E2E ${Date.now()}`,
        unidad: 'KG',
        tipo: 'verdura',
        contenido: 500,
        proveedores: [{ proveedorId, precioUnitario: 3.5 }],
      });
    if (!prodRes.body.data) console.error('Producto creation failed:', JSON.stringify(prodRes.body));
    const productoId = prodRes.body.data?.id;

    // Obtener productoProveedorId
    let productoProveedorId: string | undefined;
    if (productoId) {
      const prodDetail = await request(app.getHttpServer() as string)
        .get(`/api/v1/productos/${productoId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      const proveedores = prodDetail.body.data?.productoProveedores || prodDetail.body.data?.proveedores || [];
      productoProveedorId = proveedores[0]?.id;
    }

    // Crear pedido
    if (productoProveedorId && proveedorId) {
      const pedidoRes = await request(app.getHttpServer() as string)
        .post('/api/v1/pedidos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          proveedorId,
          productos: [{ idProductoProveedor: productoProveedorId, cantidad: 10, precioUnitario: 3.5 }],
        });
      if (!pedidoRes.body.data) console.error('Pedido creation failed:', JSON.stringify(pedidoRes.body));
      const pedidoId = pedidoRes.body.data?.id;

      // Obtener pedidoProductoId
      let pedidoProductoId: string | undefined;
      if (pedidoId) {
        const pedidoDetail = await request(app.getHttpServer() as string)
          .get(`/api/v1/pedidos/${pedidoId}`)
          .set('Authorization', `Bearer ${adminToken}`);
        const pedidoProductos = pedidoDetail.body.data?.pedidoProductos || pedidoDetail.body.data?.productos || [];
        pedidoProductoId = pedidoProductos[0]?.id;

        // Crear recepción
        const recepRes = await request(app.getHttpServer() as string)
          .post('/api/v1/recepcion')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            pedidoIds: [pedidoId],
            productos: pedidoProductoId
              ? [{ pedidoProductoId, cantidadRecibida: 10 }]
              : [],
            observaciones: 'Recepción para test incidencias',
          });
        if (!recepRes.body.data) console.error('Recepcion creation failed:', JSON.stringify(recepRes.body));
        recepcionId = recepRes.body.data?.id || recepRes.body.data?.[0]?.id || '';
      }
    }

    if (!recepcionId) {
      const recepList = await request(app.getHttpServer() as string)
        .get('/api/v1/recepcion')
        .set('Authorization', `Bearer ${adminToken}`);
      const recepData = recepList.body.data;
      if (recepData?.data?.length > 0) {
        recepcionId = recepData.data[recepData.data.length - 1].id;
      } else if (Array.isArray(recepData) && recepData.length > 0) {
        recepcionId = recepData[recepData.length - 1].id;
      }
    }
  });

  afterAll(() => { /* app compartida, no cerrar */ });

  describe('Flujo CRUD de Incidencias', () => {
    it('POST /incidencias - Debe crear una incidencia (201)', async () => {
      const response = await request(app.getHttpServer() as string)
        .post('/api/v1/incidencias')
        .set('Authorization', `Bearer ${profesorToken}`)
        .send({
          recepcionId: recepcionId,
          observacionesRecepcion: 'Falta un bulto en la caja 2',
        });

      if (response.status !== 201) {
        console.error(
          'create Response Body:',
          JSON.stringify(response.body, null, 2)
        );
      }
      expect(response.status).toBe(201);
      const resBody = response.body as TestApiResponse<{ id: string }>;
      expect(resBody.data).toHaveProperty('id');
      testIncidenciaId = resBody.data.id;
    });

    it('GET /incidencias - Debe listar las incidencias (200)', async () => {
      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/incidencias')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const resBody = response.body as TestApiResponse<any[]>;
      expect(Array.isArray(resBody.data)).toBe(true);
      expect(resBody.data.length).toBeGreaterThan(0);
    });

    it('GET /incidencias/:id - Debe obtener una incidencia por ID (200)', async () => {
      const response = await request(app.getHttpServer() as string)
        .get(`/api/v1/incidencias/${testIncidenciaId}`)
        .set('Authorization', `Bearer ${profesorToken}`);

      expect(response.status).toBe(200);
      const resBody = response.body as TestApiResponse<{ id: string }>;
      expect(resBody.data.id).toBe(testIncidenciaId);
    });

    it('PATCH /incidencias/:id - Debe actualizar una incidencia (200)', async () => {
      const response = await request(app.getHttpServer() as string)
        .patch(`/api/v1/incidencias/${testIncidenciaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          observacionesRecepcion:
            'Actualización: Falta un bulto en la caja 2 y 3',
        });

      expect(response.status).toBe(200);
      const resBody = response.body as TestApiResponse<{
        observacionesRecepcion: string;
      }>;
      expect(resBody.data.observacionesRecepcion).toContain('caja 2 y 3');
    });

    it('PATCH /incidencias/:id/resolver - Debe resolver una incidencia (200)', async () => {
      const response = await request(app.getHttpServer() as string)
        .patch(`/api/v1/incidencias/${testIncidenciaId}/resolver`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          usuarioId: adminUserId,
          observacionesResolucion:
            'Se ha contactado con el proveedor y enviarán el bulto faltante',
        });

      if (response.status !== 200) {
        console.error(
          'resolver Response Body:',
          JSON.stringify(response.body, null, 2)
        );
      }
      expect(response.status).toBe(200);
    });

    it('DELETE /incidencias/:id - Solo administrador puede eliminar (204)', async () => {
      const createRes = await request(app.getHttpServer() as string)
        .post('/api/v1/incidencias')
        .set('Authorization', `Bearer ${profesorToken}`)
        .send({
          recepcionId: recepcionId,
          observacionesRecepcion: 'Incidencia para borrar',
        });

      const resBody = createRes.body as TestApiResponse<{ id: string }>;
      const idToDelete = resBody.data.id;

      const response = await request(app.getHttpServer() as string)
        .delete(`/api/v1/incidencias/${idToDelete}`)
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status !== 204) {
        console.error(
          'delete Response Body:',
          JSON.stringify(response.body, null, 2)
        );
      }
      expect(response.status).toBe(204);

      const getRes = await request(app.getHttpServer() as string)
        .get(`/api/v1/incidencias/${idToDelete}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(getRes.status).toBe(404);
    });
  });

  describe('Validaciones y Errores', () => {
    it('POST /incidencias - Debe fallar sin recepcionId (400)', async () => {
      const response = await request(app.getHttpServer() as string)
        .post('/api/v1/incidencias')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          observacionesRecepcion: 'Sin ID',
        });

      expect(response.status).toBe(400);
    });

    it('GET /incidencias/:id - Debe fallar con UUID v7 inválido (400)', async () => {
      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/incidencias/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });
  });
});
