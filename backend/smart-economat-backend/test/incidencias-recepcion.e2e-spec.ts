import { getTestApp } from './test-app.helper';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  TipoIncidencia,
  TipoResolucion,
} from '../src/modules/incidencia/enums/incidencia.enums';
import { TipoMovimiento } from '../src/modules/movimiento/enums/movimiento.enums';

interface TestApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

describe('Incidencias en Recepción (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let recepcionId: string;

  beforeAll(async () => {
    app = await getTestApp();

    const adminResponse = await request(app.getHttpServer() as string)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@smarteconomat.com',
        password: 'SmartEconomat2026!',
      });
    adminToken = (
      adminResponse.body as TestApiResponse<{ access_token: string }>
    ).data.access_token;

    const recepList = await request(app.getHttpServer() as string)
      .get('/api/v1/recepcion')
      .set('Authorization', `Bearer ${adminToken}`);

    if (recepList.body.data?.data?.length > 0) {
      recepcionId = recepList.body.data.data[0].id;
    } else {
      const proveedorRes = await request(app.getHttpServer() as string)
        .post('/api/v1/proveedor')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: `Prov Inc Recepcion ${Date.now()}`,
          nif: `B${Math.floor(Math.random() * 100000000)}`,
          email: `prov-inc-recep-${Date.now()}@example.com`,
        });

      const proveedorId = proveedorRes.body.data.id as string;

      const productoRes = await request(app.getHttpServer() as string)
        .post('/api/v1/productos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: `Producto Inc Recepcion ${Date.now()}`,
          unidad: 'KG',
          tipo: 'verdura',
          contenido: 1,
          proveedores: [{ proveedorId, precioUnitario: 1.5 }],
        });

      const productoDetail = await request(app.getHttpServer() as string)
        .get(`/api/v1/productos/${productoRes.body.data.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const productoProveedorId = (productoDetail.body.data
        .productoProveedores ||
        productoDetail.body.data.proveedores ||
        [])[0].id as string;

      const pedidoRes = await request(app.getHttpServer() as string)
        .post('/api/v1/pedidos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          proveedorId,
          observaciones: 'Pedido fallback incidencias recepción',
          lineas: [{ productoProveedorId, cantidad: 1 }],
        });

      const pedidoDetail = await request(app.getHttpServer() as string)
        .get(`/api/v1/pedidos/${pedidoRes.body.data.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const pedidoProductoId = (pedidoDetail.body.data.pedidoProductos ||
        pedidoDetail.body.data.productos ||
        [])[0].id as string;

      const recepRes = await request(app.getHttpServer() as string)
        .post('/api/v1/recepcion')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          pedidoIds: [pedidoRes.body.data?.id],
          productos: [{ pedidoProductoId, cantidadRecibida: 1 }],
          observaciones: 'Recepción para test E2E',
        });
      recepcionId = recepRes.body.data?.id || recepRes.body.data?.[0]?.id;
    }
  });

  it('Flujo completo: Reportar -> Verificar Flag -> Resolver con Movimiento', async () => {
    const reportRes = await request(app.getHttpServer() as string)
      .post('/api/v1/incidencias/reportar')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        recepcionId,
        tipo: TipoIncidencia.ROTURA,
      });

    expect(reportRes.status).toBe(201);
    const incidenciaId = reportRes.body.data.id;

    const recepCheck = await request(app.getHttpServer() as string)
      .get(`/api/v1/recepcion/${recepcionId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(recepCheck.body.data.incidencia).toBe(true);

    const resolveRes = await request(app.getHttpServer() as string)
      .post(`/api/v1/incidencias/${incidenciaId}/resolver`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        accion: TipoResolucion.DEVOLUCION,
        observaciones: 'Devolución por rotura en recepción test',
      });

    expect(resolveRes.status).toBe(201);
    expect(resolveRes.body.data.fechaResolucion).toBeDefined();

    const movRes = await request(app.getHttpServer() as string)
      .get('/api/v1/movimientos')
      .set('Authorization', `Bearer ${adminToken}`);

    const movimientos = (movRes.body as TestApiResponse<any>).data.data;
    const movAjuste = (movimientos as any[]).find(
      (m) =>
        m.tipo === TipoMovimiento.SALIDA_AJUSTE && m.entidadId === incidenciaId
    );

    expect(movAjuste).toBeDefined();
    expect(movAjuste.descripcion).toContain(
      'Ajuste por resolución de incidencia'
    );
  });
});
