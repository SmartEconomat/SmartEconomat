import { getTestApp } from '../setup/test-app';
import { INestApplication } from '@nestjs/common';

import request from 'supertest';

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

    const adminResponse = await request(app.getHttpServer() as string)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@smarteconomat.com',
        password: 'SmartEconomat2026!',
      });
    adminToken = (adminResponse.body as { data: { access_token: string } }).data
      .access_token;

    const profileResponse = await request(app.getHttpServer() as string)
      .get('/api/v1/usuarios/perfil')
      .set('Authorization', `Bearer ${adminToken}`);
    adminUserId = (profileResponse.body as { data: { id: string } }).data.id;

    const profesorResponse = await request(app.getHttpServer() as string)
      .post('/api/v1/auth/login')
      .send({
        email: 'profesor1@smarteconomat.com',
        password: 'SmartEconomat2026!',
      });

    profesorToken = (
      profesorResponse.body as { data: { access_token: string } }
    ).data.access_token;
  });

  beforeEach(async () => {
    const provRes = await request(app.getHttpServer() as string)
      .post('/api/v1/proveedor')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: `Proveedor Incidencia E2E ${Date.now()}`,
      });
    expect(provRes.status).toBe(201);
    const proveedorId = provRes.body.data?.id;

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
    expect(prodRes.status).toBe(201);
    const productoId = prodRes.body.data?.id;

    let productoProveedorId: string | undefined;
    if (productoId) {
      const prodDetail = await request(app.getHttpServer() as string)
        .get(`/api/v1/productos/${productoId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(prodDetail.status).toBe(200);
      const proveedores =
        prodDetail.body.data?.productoProveedores ||
        prodDetail.body.data?.proveedores ||
        [];
      productoProveedorId = proveedores[0]?.id;
    }

    if (productoProveedorId && proveedorId) {
      const pedidoRes = await request(app.getHttpServer() as string)
        .post('/api/v1/pedidos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          proveedorId,
          observaciones: 'Pedido incidencia e2e',
          lineas: [
            {
              productoProveedorId,
              cantidad: 10,
            },
          ],
        });
      expect(pedidoRes.status).toBe(201);
      const pedidoId = pedidoRes.body.data?.id;

      let pedidoProductoId: string | undefined;
      if (pedidoId) {
        const pedidoDetail = await request(app.getHttpServer() as string)
          .get(`/api/v1/pedidos/${pedidoId}`)
          .set('Authorization', `Bearer ${adminToken}`);
        expect(pedidoDetail.status).toBe(200);
        const pedidoProductos =
          pedidoDetail.body.data?.pedidoProductos ||
          pedidoDetail.body.data?.productos ||
          [];
        pedidoProductoId = pedidoProductos[0]?.id;

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
        expect(recepRes.status).toBe(201);
        recepcionId =
          recepRes.body.data?.id || recepRes.body.data?.[0]?.id || '';
      }
    }

    if (recepcionId) {
      const incRes = await request(app.getHttpServer() as string)
        .post('/api/v1/incidencias')
        .set('Authorization', `Bearer ${profesorToken}`)
        .send({
          recepcionId: recepcionId,
          observacionesRecepcion: 'Incidencia Base E2E',
        });
      expect(incRes.status).toBe(201);
      testIncidenciaId = incRes.body.data?.id;
    }
  });

  afterAll(() => {
    /* app compartida, no cerrar */
  });

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
      if (response.status !== 201) {
        throw new Error(
          `Failed to create Incidencia. Status: ${response.status}. Body: ${JSON.stringify(response.body, null, 2)}`
        );
      }
      expect(response.status).toBe(201);
      const resBody = response.body.data;
      expect(resBody).toHaveProperty('id');
      testIncidenciaId = resBody.id;
    });

    it('GET /incidencias - Debe listar las incidencias (200)', async () => {
      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/incidencias')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const resBody = response.body.data;
      expect(Array.isArray(resBody.data)).toBe(true);
      expect(resBody.data.length).toBeGreaterThan(0);
      expect(typeof resBody.total).toBe('number');
      expect(typeof resBody.page).toBe('number');
      expect(typeof resBody.limit).toBe('number');
    });

    it('GET /incidencias/:id - Debe obtener una incidencia por ID (200)', async () => {
      const response = await request(app.getHttpServer() as string)
        .get(`/api/v1/incidencias/${testIncidenciaId}`)
        .set('Authorization', `Bearer ${profesorToken}`);

      expect(response.status).toBe(200);
      const resBody = response.body.data;
      expect(resBody.id).toBe(testIncidenciaId);
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
      const resBody = response.body.data;
      expect(resBody.observacionesRecepcion).toContain('caja 2 y 3');
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

      const resBody = createRes.body.data;
      const idToDelete = resBody.id;

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
