import { getTestApp } from '../setup/test-app';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  TipoIncidencia,
  TipoResolucion,
} from '../../src/modules/incidencia/enums/incidencia.enums';

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

    const proveedorRes = await request(app.getHttpServer() as string)
      .post('/api/v1/proveedor')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: `Prov Inc E2E ${Date.now()}`,
        nif: `B${Math.floor(Math.random() * 100000000)}`,
        email: `prov-inc-e2e-${Date.now()}@example.com`,
      });

    const proveedorId = proveedorRes.body.data.id;

    const productoRes = await request(app.getHttpServer() as string)
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: `Prod Inc E2E ${Date.now()}`,
        unidad: 'KG',
        tipo: 'verdura',
        contenido: 1,
        proveedores: [{ proveedorId, precioUnitario: 10 }],
      });

    const productoId = productoRes.body.data.id;

    const productoDetail = await request(app.getHttpServer() as string)
      .get(`/api/v1/productos/${productoId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const data = productoDetail.body.data;
    const pp = (data.productoProveedores || data.proveedores || [])[0];
    if (!pp) {
      console.error('Data producto:', JSON.stringify(data, null, 2));
      throw new Error('No se encontró producto-proveedor');
    }
    const productoProveedorId = pp.id;

    const pedidoRes = await request(app.getHttpServer() as string)
      .post('/api/v1/pedidos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        proveedorId,
        lineas: [{ productoProveedorId, cantidad: 5 }],
      });

    const pedidoId = pedidoRes.body.data.id;

    await request(app.getHttpServer() as string)
      .patch(`/api/v1/pedidos/${pedidoId}/aceptar`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const pedidoDetail = await request(app.getHttpServer() as string)
      .get(`/api/v1/pedidos/${pedidoId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const pedidoProductoId = pedidoDetail.body.data.pedidoProductos[0].id;

    const recepRes = await request(app.getHttpServer() as string)
      .post('/api/v1/recepciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        pedidoIds: [pedidoId],
        productos: [{ pedidoProductoId, cantidadRecibida: 2 }],
        observaciones: 'Test E2E Incidencia',
      });

    recepcionId =
      recepRes.body.data.id ||
      (Array.isArray(recepRes.body.data) ? recepRes.body.data[0].id : null);

    if (!recepcionId) {
      console.error('FALLO SETUP E2E:', JSON.stringify(recepRes.body, null, 2));
      throw new Error('No se pudo crear la recepción para el test');
    }
  });

  it('Flujo completo: Reportar -> Verificar Flag -> Resolver con Movimiento', async () => {
    const reportRes = await request(app.getHttpServer() as string)
      .post('/api/v1/incidencias/reportar')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        recepcionId,
        tipo: TipoIncidencia.FALTA_PRODUCTO,
      });

    let incidenciaId: string | undefined;
    if (reportRes.status === 201) {
      const incidencias = reportRes.body.data as Array<{ id: string }>;
      incidenciaId = incidencias[0]?.id;
    } else {
      const incidenciasExistentes = await request(app.getHttpServer() as string)
        .get('/api/v1/incidencias')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      incidenciaId = (
        incidenciasExistentes.body.data.data as Array<{ id: string }>
      )?.find((inc) => !!inc.id)?.id;
    }
    expect(incidenciaId).toBeTruthy();

    const recepCheck = await request(app.getHttpServer() as string)
      .get(`/api/v1/recepciones/${recepcionId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(recepCheck.body.data.incidencia).toBe(true);

    const resolveRes = await request(app.getHttpServer() as string)
      .post(`/api/v1/incidencias/${incidenciaId}/resolver`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        accion: TipoResolucion.DEVOLUCION,
        observaciones: 'Resuelto en test E2E',
      });

    expect(resolveRes.status).toBe(201);

    const movRes = await request(app.getHttpServer() as string)
      .get('/api/v1/movimientos')
      .set('Authorization', `Bearer ${adminToken}`);

    const movimientos = movRes.body.data.data;
    const found = movimientos.find((m: any) => m.entidadId === incidenciaId);
    expect(found).toBeDefined();
  });
});
