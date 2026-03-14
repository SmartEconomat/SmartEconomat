import { getTestApp } from '../setup/test-app';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { EstadoPedido } from '../../src/modules/pedido/enums/estado-pedido.enum';

describe('PedidoController (e2e)', () => {
  jest.setTimeout(30000);

  let app: INestApplication;
  let adminToken: string;
  let proveedorId: string;
  let productoProveedorId: string;

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
    const provRes = await request(app.getHttpServer() as string)
      .post('/api/v1/proveedor')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: `Prov Pedido ${Date.now()}`,
        nif: `B${Math.floor(Math.random() * 100000000)}`,
        email: `prov_${Date.now()}@example.com`,
      });
    proveedorId = provRes.body.data.id;

    const prodRes = await request(app.getHttpServer() as string)
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: `Prod Pedido ${Date.now()}`,
        tipo: 'lacteo',
        unidad: 'L',
        contenido: 1,
        proveedores: [{ proveedorId, precioUnitario: 10.5 }],
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

  describe('Ciclo de Vida del Pedido', () => {
    async function createPedido() {
      const res = await request(app.getHttpServer() as string)
        .post('/api/v1/pedidos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          proveedorId,
          fechaEntrega: new Date(Date.now() + 86400000).toISOString(),
          lineas: [
            {
              productoProveedorId,
              cantidad: 5,
            },
          ],
        });
      return res.body.data;
    }

    async function createPedidoWithDelay(delayMs = 25) {
      const pedido = await createPedido();
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return pedido;
    }

    it('E2E-PED-01-CRE: Crear pedido exitoso', async () => {
      const response = await request(app.getHttpServer() as string)
        .post('/api/v1/pedidos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          proveedorId,
          fechaEntrega: new Date(Date.now() + 86400000).toISOString(),
          lineas: [
            {
              productoProveedorId,
              cantidad: 5,
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.data.estado).toBe(EstadoPedido.PENDIENTE);
      expect(Number(response.body.data.costeTotal)).toBe(52.5);
    });

    it('E2E-PED-09-GET: Listar pedidos', async () => {
      await createPedido();
      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/pedidos')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.data.length).toBeGreaterThan(0);
    });

    it('E2E-PED-10-GET-SORT: Ordena por fechaCreacion DESC y mantiene PaginatedResponseDto', async () => {
      const primerPedido = await createPedidoWithDelay();
      const segundoPedido = await createPedidoWithDelay();

      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/pedidos')
        .query({ sortBy: 'fechaCreacion', order: 'DESC', page: 1, limit: 10 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(10);
      expect(typeof response.body.data.total).toBe('number');
      expect(typeof response.body.data.totalPages).toBe('number');

      const ids = response.body.data.data.map(
        (pedido: { id: string }) => pedido.id
      );
      const primerIndice = ids.indexOf(primerPedido.id);
      const segundoIndice = ids.indexOf(segundoPedido.id);

      expect(primerIndice).toBeGreaterThanOrEqual(0);
      expect(segundoIndice).toBeGreaterThanOrEqual(0);
      expect(segundoIndice).toBeLessThan(primerIndice);
    });

    it('E2E-PED-11-GET-SORT-INVALID: Rechaza campos de ordenación no permitidos', async () => {
      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/pedidos')
        .query({ sortBy: 'password', order: 'DESC', page: 1, limit: 10 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Campo de ordenación inválido');
      expect(response.body.data).toBeNull();
    });

    it('E2E-PED-13-UPD-FENT: Actualizar fecha de entrega', async () => {
      const pedido = await createPedido();
      const newDate = new Date(Date.now() + 172800000).toISOString();
      const response = await request(app.getHttpServer() as string)
        .patch(`/api/v1/pedidos/${pedido.id}/fecha-entrega`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fechaEntrega: newDate });

      expect(response.status).toBe(200);
      expect(new Date(response.body.data.fechaEntrega).getTime()).toBe(
        new Date(newDate).getTime()
      );
    });

    it('E2E-PED-14-CAN-OK: Cancelar pedido', async () => {
      const pedido = await createPedido();
      const response = await request(app.getHttpServer() as string)
        .patch(`/api/v1/pedidos/${pedido.id}/cancelar`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ motivoCancelacion: 'Error en la orden' });

      expect(response.status).toBe(200);
      expect(response.body.data.estado).toBe(EstadoPedido.CANCELADO);
    });

    it('E2E-PED-17-DEL-OK: Eliminar pedido', async () => {
      const pedido = await createPedido();
      await request(app.getHttpServer() as string)
        .delete(`/api/v1/pedidos/${pedido.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });
  });
});
