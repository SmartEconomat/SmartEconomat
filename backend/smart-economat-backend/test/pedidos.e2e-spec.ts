import { getTestApp } from './test-app.helper';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { EstadoPedido } from '../src/modules/pedido/enums/estado-pedido.enum';

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
