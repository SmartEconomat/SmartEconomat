import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DificultadReceta } from '../../src/modules/receta/enums/receta.enums';
import { Movimiento } from '../../src/modules/movimiento/movimiento.entity/movimiento.entity';
import { TipoMovimiento } from '../../src/modules/movimiento/enums/movimiento.enums';
import { Merma } from '../../src/modules/merma/merma.entity/merma.entity';
import { getTestApp } from '../setup/test-app';

describe('Merma desde Produccion (e2e)', () => {
  jest.setTimeout(60000);

  let app: INestApplication;
  let adminToken: string;
  let dataSource: DataSource;

  let ubicacionId: string;
  let proveedorId: string;
  let productoId: string;
  let productoProveedorId: string;
  let recetaId: string;
  let loteId: string;

  const idempotencyKey = '01961496-cc99-7d4d-89f8-e7ac15e809fa';

  beforeAll(async () => {
    app = await getTestApp();
    dataSource = app.get(DataSource);

    const loginResponse = await request(app.getHttpServer() as string)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@smarteconomat.com',
        password: 'SmartEconomat2026!',
      });

    adminToken = loginResponse.body.data.access_token;
  });

  beforeEach(async () => {
    const ubicacionResponse = await request(app.getHttpServer() as string)
      .post('/api/v1/ubicacion')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: `Ubi Merma Prod ${Date.now()}` });

    ubicacionId = ubicacionResponse.body.data.id;

    const proveedorResponse = await request(app.getHttpServer() as string)
      .post('/api/v1/proveedor')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: `Proveedor Merma Prod ${Date.now()}`,
        nif: `B${Math.floor(Math.random() * 100000000)}`,
        email: `prov_merma_prod_${Date.now()}@example.com`,
      });

    proveedorId = proveedorResponse.body.data.id;

    const productoResponse = await request(app.getHttpServer() as string)
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: `Ingrediente Merma Prod ${Date.now()}`,
        tipo: 'otro',
        unidad: 'KG',
        contenido: 1,
        proveedores: [{ proveedorId, precioUnitario: 2 }],
      });

    productoId = productoResponse.body.data.id;

    const productoDetalleResponse = await request(app.getHttpServer() as string)
      .get(`/api/v1/productos/${productoId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const relacionesProveedor =
      productoDetalleResponse.body.data.proveedores || [];
    productoProveedorId = relacionesProveedor[0].id;

    await request(app.getHttpServer() as string)
      .post('/api/v1/inventario')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        productoProveedorId,
        ubicacionId,
        cantidadActual: 100,
        cantidadMinima: 0,
      })
      .expect(201);

    const recetaResponse = await request(app.getHttpServer() as string)
      .post('/api/v1/recetas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: `Receta Merma Prod ${Date.now()}`,
        instrucciones: 'Preparar',
        tiempoEstimadoMinutos: 5,
        dificultad: DificultadReceta.FACIL,
        rendimiento: 2,
        unidadResultado: 'kg',
        raciones: 4,
        ingredientes: [{ productoId, cantidad: 1, unidad: 'kg' }],
      });

    recetaId = recetaResponse.body.data.id;

    const produccionResponse = await request(app.getHttpServer() as string)
      .post('/api/v1/produccion/ejecutar')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        recetaId,
        cantidadProducida: 2,
        ubicacionDestinoId: ubicacionId,
      })
      .expect(201);

    loteId = produccionResponse.body.data.id;
  });

  async function getStockConsolidadoProducto(
    targetProductoId: string
  ): Promise<number> {
    const stockResponse = await request(app.getHttpServer() as string)
      .get('/api/v1/inventario/stock')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ productoId: targetProductoId, consolidado: true })
      .expect(200);

    const rows: Array<{ stockTotal: number | string }> =
      stockResponse.body.data;
    if (!rows.length) return 0;

    return Number(rows[0].stockTotal);
  }

  it('registra merma de ingrediente desde producción y no duplica por idempotencia', async () => {
    const stockAntes = await getStockConsolidadoProducto(productoId);

    const firstResponse = await request(app.getHttpServer() as string)
      .post('/api/v1/merma/produccion/reportar')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        produccionLoteId: loteId,
        productoId,
        cantidad: 3,
        motivo: 'error_preparacion',
        notas: 'Merma real en mise en place',
        idempotencyKey,
      })
      .expect(201);

    const secondResponse = await request(app.getHttpServer() as string)
      .post('/api/v1/merma/produccion/reportar')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        produccionLoteId: loteId,
        productoId,
        cantidad: 3,
        motivo: 'error_preparacion',
        notas: 'Retry de cliente',
        idempotencyKey,
      })
      .expect(201);

    expect(firstResponse.body.data.id).toBe(secondResponse.body.data.id);
    expect(firstResponse.body.data.tipo).toBe('produccion');
    expect(firstResponse.body.data.origenEntidad).toBe('ProduccionLote');
    expect(firstResponse.body.data.origenId).toBe(loteId);

    const stockDespues = await getStockConsolidadoProducto(productoId);
    expect(stockDespues).toBeCloseTo(stockAntes - 3, 6);

    const mermaRepo = dataSource.getRepository(Merma);
    const movimientoRepo = dataSource.getRepository(Movimiento);

    const merma = await mermaRepo.findOne({
      where: { id: firstResponse.body.data.id },
    });

    expect(merma).toBeTruthy();

    const movimientosMerma = await movimientoRepo.find({
      where: {
        entidad: 'Merma',
        entidadId: firstResponse.body.data.id,
        tipo: TipoMovimiento.MERMA,
      },
    });

    expect(movimientosMerma.length).toBeGreaterThan(0);
  });

  it('rechaza merma de producción cuando el producto no es ingrediente de la receta del lote', async () => {
    const otroProductoResponse = await request(app.getHttpServer() as string)
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: `Ingrediente no receta ${Date.now()}`,
        tipo: 'otro',
        unidad: 'KG',
        contenido: 1,
        proveedores: [{ proveedorId, precioUnitario: 1 }],
      })
      .expect(201);

    await request(app.getHttpServer() as string)
      .post('/api/v1/merma/produccion/reportar')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        produccionLoteId: loteId,
        productoId: otroProductoResponse.body.data.id,
        cantidad: 1,
        motivo: 'error_preparacion',
      })
      .expect(400);
  });
});
