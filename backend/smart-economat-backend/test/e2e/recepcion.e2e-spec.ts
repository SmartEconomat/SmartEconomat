import { getTestApp } from '../setup/test-app';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { generateUniqueName, loginAndGetToken } from '../utils/test-helpers';
import { Pedido } from '../../src/modules/pedido/pedido.entity/pedido.entity';
import { EstadoPedido } from '../../src/modules/pedido/enums/estado-pedido.enum';
import { TipoMovimiento } from '../../src/modules/movimiento/enums/movimiento.enums';
import { EstadoRecepcion } from '../../src/modules/recepcion/enums/estado-recepcion.enum';
import { EstadoProductoRecepcion } from '../../src/modules/recepcion/enums/estado-producto.enum';
import { EstadoVisualProducto } from '../../src/modules/recepcion/enums/estado-visual.enum';
import { Recepcion } from '../../src/modules/recepcion/recepcion.entity/recepcion.entity';
import { RecepcionPedido } from '../../src/modules/recepcion/recepcion-pedido.entity/recepcion-pedido.entity';
import { RecepcionProducto } from '../../src/modules/recepcion/recepcion-productos.entity/recepcion-producto.entity';
import { AlbaranPedidoRecepcion } from '../../src/modules/albaran/albaran-pedido-recepcion.entity/albaran-pedido-recepcion.entity';

describe('RecepcionController (e2e)', () => {
  jest.setTimeout(30000);

  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let adminUserId: string;

  const barcode = () =>
    `${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(0, 13);

  function binaryParser(
    res: any,
    callback: (error: Error | null, body: Buffer) => void
  ) {
    const data: Buffer[] = [];
    res.on('data', (chunk: Buffer | string) => {
      data.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    res.on('end', () => callback(null, Buffer.concat(data)));
    res.on('error', (error: Error) => callback(error, Buffer.alloc(0)));
  }

  async function createProveedor() {
    const response = await request(app.getHttpServer())
      .post('/api/v1/proveedor')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: generateUniqueName('Proveedor recepción'),
        nif: `B${Math.floor(10000000 + Math.random() * 89999999)}`,
        email: `${Date.now()}-${Math.random().toString(36).slice(2)}@recepcion.test`,
      })
      .expect(201);

    return response.body.data as { id: string; nombre: string };
  }

  async function createProductoConProveedor(
    proveedorId: string,
    overrides: Partial<{
      nombre: string;
      tipo: string;
      unidad: string;
      contenido: number;
      precioUnitario: number;
    }> = {}
  ) {
    const nombre = overrides.nombre ?? generateUniqueName('Producto recepción');
    const tipo = overrides.tipo ?? 'otro';
    const unidad = overrides.unidad ?? 'UNIDAD';
    const contenido = overrides.contenido ?? 1;
    const precioUnitario = overrides.precioUnitario ?? 1.5;

    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre,
        tipo,
        unidad,
        contenido,
        proveedores: [
          {
            proveedorId,
            precioUnitario,
          },
        ],
      })
      .expect(201);

    const productoId = createResponse.body.data.id as string;

    const detailResponse = await request(app.getHttpServer())
      .get(`/api/v1/productos/${productoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const relaciones =
      detailResponse.body.data.productoProveedores ||
      detailResponse.body.data.proveedores ||
      [];

    return {
      productoId,
      productoProveedorId: relaciones[0].id as string,
      nombre,
    };
  }

  async function createPedido(
    proveedorId: string,
    lineas: Array<{ productoProveedorId: string; cantidad: number }>
  ) {
    const response = await request(app.getHttpServer())
      .post('/api/v1/pedidos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        proveedorId,
        observaciones: 'Pedido auxiliar para recepción',
        lineas,
      })
      .expect(201);

    const pedidoId = response.body.data.id as string;
    const pedido = await dataSource.getRepository(Pedido).findOne({
      where: { id: pedidoId },
      relations: ['pedidoProductos'],
    });

    return {
      pedidoId,
      pedidoProductoIds: (pedido?.pedidoProductos || []).map((pp) => pp.id),
    };
  }

  beforeAll(async () => {
    app = await getTestApp();
    dataSource = app.get(DataSource);
    adminToken = await loginAndGetToken(app);

    const profileResponse = await request(app.getHttpServer())
      .get('/api/v1/usuarios/perfil')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    adminUserId = profileResponse.body.data.id as string;
  });

  afterAll(() => {
    /* app compartida, no cerrar */
  });

  describe('Procesar Recepción (Batch ACID)', () => {
    it('POST /recepcion - Debe fallar con body vacío (400) por DTO multipedido', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/recepciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);
    });

    it('POST /recepcion - Debe fallar si el pedidoId no existe (404)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/recepciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          pedidoIds: ['0191c30c-1e55-7000-8000-000000000000'],
          usuarioId: adminUserId,
          productos: [],
        })
        .expect(404);
    });

    it('procesa una recepción multipedido exacta y persiste albaranes, stock y movimientos', async () => {
      const proveedor = await createProveedor();
      const productoA = await createProductoConProveedor(proveedor.id, {
        nombre: generateUniqueName('Producto MP A'),
      });
      const productoB = await createProductoConProveedor(proveedor.id, {
        nombre: generateUniqueName('Producto MP B'),
      });

      const pedidoA = await createPedido(proveedor.id, [
        { productoProveedorId: productoA.productoProveedorId, cantidad: 5 },
      ]);
      const pedidoB = await createPedido(proveedor.id, [
        { productoProveedorId: productoB.productoProveedorId, cantidad: 3 },
      ]);

      const response = await request(app.getHttpServer())
        .post('/api/v1/recepciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          usuarioId: adminUserId,
          observaciones: generateUniqueName('Recepción multipedido exacta'),
          pedidos: [
            {
              pedidoId: pedidoA.pedidoId,
              nAlbaran: generateUniqueName('ALB-A'),
              observaciones: 'Pedido A sin incidencias',
            },
            {
              pedidoId: pedidoB.pedidoId,
              nAlbaran: generateUniqueName('ALB-B'),
              observaciones: 'Pedido B sin incidencias',
            },
          ],
          productos: [
            {
              pedidoProductoId: pedidoA.pedidoProductoIds[0],
              cantidadRecibida: 5,
              cantidadAlbaran: 5,
              estadoVisual: EstadoVisualProducto.OPTIMO,
            },
            {
              pedidoProductoId: pedidoB.pedidoProductoIds[0],
              cantidadRecibida: 3,
              cantidadAlbaran: 3,
              estadoVisual: EstadoVisualProducto.OPTIMO,
            },
          ],
        })
        .expect(201);

      const recepcionId = response.body.data.id as string;

      expect(response.body.data.incidencias).toEqual([]);
      expect(response.body.data.inventariosCreados).toBe(2);
      expect(response.body.data.movimientosGenerados).toBe(2);
      expect(response.body.data.pedidosActualizados).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: pedidoA.pedidoId,
            estadoNuevo: EstadoPedido.RECEPCIONADO,
          }),
          expect.objectContaining({
            id: pedidoB.pedidoId,
            estadoNuevo: EstadoPedido.RECEPCIONADO,
          }),
        ])
      );

      const recepcion = await dataSource.getRepository(Recepcion).findOneBy({
        id: recepcionId,
      });
      const recepcionPedidos = await dataSource
        .getRepository(RecepcionPedido)
        .findBy({ recepcionId });
      const albaranLinks = await dataSource
        .getRepository(AlbaranPedidoRecepcion)
        .find();
      const movimientosResponse = await request(app.getHttpServer())
        .get('/api/v1/movimientos')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const stockAResponse = await request(app.getHttpServer())
        .get('/api/v1/inventario/stock')
        .query({ productoId: productoA.productoId, consolidado: true })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const stockBResponse = await request(app.getHttpServer())
        .get('/api/v1/inventario/stock')
        .query({ productoId: productoB.productoId, consolidado: true })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const recepcionPedidoIds = recepcionPedidos.map((rp) => rp.id);
      const relatedAlbaranLinks = albaranLinks.filter((link) =>
        recepcionPedidoIds.includes(link.recepcionPedidoId)
      );
      const recepcionMovimientos = (
        movimientosResponse.body.data.data as any[]
      ).filter(
        (movimiento) =>
          movimiento.entidadId === recepcionId &&
          movimiento.tipo === TipoMovimiento.ENTRADA_COMPRA
      );

      expect(recepcion?.estado).toBe(EstadoRecepcion.COMPLETADA);
      expect(recepcionPedidos).toHaveLength(2);
      expect(relatedAlbaranLinks).toHaveLength(2);
      expect(recepcionMovimientos).toHaveLength(2);
      expect(stockAResponse.body.data).toEqual([
        expect.objectContaining({
          productoId: productoA.productoId,
          stockTotal: 5,
        }),
      ]);
      expect(stockBResponse.body.data).toEqual([
        expect.objectContaining({
          productoId: productoB.productoId,
          stockTotal: 3,
        }),
      ]);
    });

    it('genera trazabilidad automática cuando una línea se marca como rota y no incrementa inventario', async () => {
      const proveedor = await createProveedor();
      const producto = await createProductoConProveedor(proveedor.id, {
        nombre: generateUniqueName('Producto incidencia recepción'),
      });
      const pedido = await createPedido(proveedor.id, [
        { productoProveedorId: producto.productoProveedorId, cantidad: 5 },
      ]);

      const response = await request(app.getHttpServer())
        .post('/api/v1/recepciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          usuarioId: adminUserId,
          pedidos: [{ pedidoId: pedido.pedidoId }],
          observaciones: generateUniqueName('Recepción con incidencia'),
          productos: [
            {
              pedidoProductoId: pedido.pedidoProductoIds[0],
              cantidadRecibida: 2,
              cantidadAlbaran: 2,
              estadoProducto: EstadoProductoRecepcion.ROTO,
              estadoVisual: EstadoVisualProducto.ROTO,
              observaciones: 'Caja rota en muelle',
              incidenciaDescripcion: 'Rotura detectada en el control de muelle',
            },
          ],
        })
        .expect(201);

      const recepcionId = response.body.data.id as string;
      const recepcion = await dataSource.getRepository(Recepcion).findOneBy({
        id: recepcionId,
      });
      const recepcionProducto = await dataSource
        .getRepository(RecepcionProducto)
        .findOne({
          where: {
            recepcionId,
            pedidoProductoId: pedido.pedidoProductoIds[0],
          },
          relations: ['incidencia'],
        });
      const incidenciasList = await request(app.getHttpServer())
        .get('/api/v1/incidencias')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const incidencia = await request(app.getHttpServer())
        .get(`/api/v1/incidencias/${recepcionProducto?.incidenciaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const stockResponse = await request(app.getHttpServer())
        .get('/api/v1/inventario/stock')
        .query({ productoId: producto.productoId, consolidado: true })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const pedidoActualizado = await dataSource
        .getRepository(Pedido)
        .findOneBy({
          id: pedido.pedidoId,
        });

      const productosIncidencia = response.body.data.incidencias.flatMap(
        (incidenciaGenerada: any) =>
          incidenciaGenerada.datosOriginales.productos
      );
      const stockTotal = (
        stockResponse.body.data as Array<{ stockTotal: number }>
      ).reduce((acc, item) => acc + Number(item.stockTotal || 0), 0);

      expect(response.body.data.incidencias.length).toBeGreaterThanOrEqual(1);
      expect(productosIncidencia).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            tipo: 'DEFECTUOSO',
            diferencia: -2,
            observaciones: 'Rotura detectada en el control de muelle',
          }),
        ])
      );
      expect(recepcion?.estado).toBe(EstadoRecepcion.CON_INCIDENCIAS);
      expect(recepcion?.incidencia).toBe(true);
      expect(pedidoActualizado?.estado).toBe(EstadoPedido.INCIDENCIA);
      expect(recepcionProducto?.estadoProducto).toBe(
        EstadoProductoRecepcion.ROTO
      );
      expect(recepcionProducto?.incidenciaId).toBeTruthy();
      expect(incidencia.body.data.id).toBe(recepcionProducto?.incidenciaId);
      expect(incidencia.body.data.pedidoId).toBe(pedido.pedidoId);
      expect(incidencia.body.data.lineas).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            pedidoProductoId: pedido.pedidoProductoIds[0],
            tipoDiferencia: 'DEFECTUOSO',
          }),
        ])
      );
      expect(stockTotal).toBe(0);
      expect(
        (incidenciasList.body.data.data as any[]).some(
          (item) => item.id === recepcionProducto?.incidenciaId
        )
      ).toBe(true);
    });

    it('mueve el pedido de pendiente_de_aprobacion a parcial y después a recepcionado según recepciones parciales y totales', async () => {
      const proveedor = await createProveedor();
      const producto = await createProductoConProveedor(proveedor.id, {
        nombre: generateUniqueName('Producto transición automática'),
      });
      const pedido = await createPedido(proveedor.id, [
        { productoProveedorId: producto.productoProveedorId, cantidad: 5 },
      ]);

      const primeraRecepcion = await request(app.getHttpServer())
        .post('/api/v1/recepciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          usuarioId: adminUserId,
          pedidos: [{ pedidoId: pedido.pedidoId }],
          observaciones: generateUniqueName('Recepción parcial transición'),
          productos: [
            {
              pedidoProductoId: pedido.pedidoProductoIds[0],
              cantidadRecibida: 2,
              cantidadAlbaran: 2,
              estadoVisual: EstadoVisualProducto.OPTIMO,
            },
          ],
        })
        .expect(201);

      expect(primeraRecepcion.body.data.pedidosActualizados).toEqual([
        expect.objectContaining({
          id: pedido.pedidoId,
          estadoAnterior: EstadoPedido.PENDIENTE_DE_APROBACION,
          estadoNuevo: EstadoPedido.PARCIAL,
        }),
      ]);

      let pedidoActualizado = await dataSource.getRepository(Pedido).findOneBy({
        id: pedido.pedidoId,
      });
      expect(pedidoActualizado?.estado).toBe(EstadoPedido.PARCIAL);

      const segundaRecepcion = await request(app.getHttpServer())
        .post('/api/v1/recepciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          usuarioId: adminUserId,
          pedidos: [{ pedidoId: pedido.pedidoId }],
          observaciones: generateUniqueName('Recepción total transición'),
          productos: [
            {
              pedidoProductoId: pedido.pedidoProductoIds[0],
              cantidadRecibida: 3,
              cantidadAlbaran: 3,
              estadoVisual: EstadoVisualProducto.OPTIMO,
            },
          ],
        })
        .expect(201);

      expect(segundaRecepcion.body.data.pedidosActualizados).toEqual([
        expect.objectContaining({
          id: pedido.pedidoId,
          estadoAnterior: EstadoPedido.PARCIAL,
          estadoNuevo: EstadoPedido.RECEPCIONADO,
        }),
      ]);

      pedidoActualizado = await dataSource.getRepository(Pedido).findOneBy({
        id: pedido.pedidoId,
      });
      expect(pedidoActualizado?.estado).toBe(EstadoPedido.RECEPCIONADO);
    });

    it('crea productos nuevos durante la recepción y deja trazabilidad en stock', async () => {
      const proveedor = await createProveedor();
      const productoExistente = await createProductoConProveedor(proveedor.id, {
        nombre: generateUniqueName('Producto base recepción'),
      });
      const pedido = await createPedido(proveedor.id, [
        {
          productoProveedorId: productoExistente.productoProveedorId,
          cantidad: 1,
        },
      ]);

      const nombreNuevo = generateUniqueName('Producto alta directa');
      const codigoNuevo = barcode();

      const response = await request(app.getHttpServer())
        .post('/api/v1/recepciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          usuarioId: adminUserId,
          pedidos: [{ pedidoId: pedido.pedidoId }],
          observaciones: generateUniqueName('Recepción con alta directa'),
          productos: [
            {
              pedidoProductoId: pedido.pedidoProductoIds[0],
              cantidadRecibida: 1,
              cantidadAlbaran: 1,
              estadoVisual: EstadoVisualProducto.OPTIMO,
            },
          ],
          productosNuevos: [
            {
              pendienteCreacion: true,
              codigoBarras: codigoNuevo,
              nombre: nombreNuevo,
              marca: 'Marca recepción',
              unidad: 'UNIDAD',
              tipo: 'otro',
              contenido: 1,
              cantidadRecibida: 7,
            },
          ],
        })
        .expect(201);

      const productoCreadoId = response.body.data.productosCreados[0]
        .id as string;
      const productoCreadoResponse = await request(app.getHttpServer())
        .get(`/api/v1/productos/${productoCreadoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const stockNuevoResponse = await request(app.getHttpServer())
        .get('/api/v1/inventario/stock')
        .query({ productoId: productoCreadoId, consolidado: true })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const pedidoActualizado = await dataSource
        .getRepository(Pedido)
        .findOneBy({
          id: pedido.pedidoId,
        });

      expect(response.body.data.incidencias).toEqual([]);
      expect(response.body.data.productosCreados).toEqual([
        expect.objectContaining({
          id: productoCreadoId,
          nombre: nombreNuevo,
          codigoBarras: codigoNuevo,
        }),
      ]);
      expect(response.body.data.inventariosCreados).toBe(2);
      expect(response.body.data.movimientosGenerados).toBe(2);
      expect(pedidoActualizado?.estado).toBe(EstadoPedido.RECEPCIONADO);
      expect(productoCreadoResponse.body.data.nombre).toBe(nombreNuevo);
      expect(stockNuevoResponse.body.data).toEqual([
        expect.objectContaining({
          productoId: productoCreadoId,
          stockTotal: 7,
        }),
      ]);
    });

    it('rechaza una línea ajena al pedido seleccionado y mantiene el pedido sin cambios', async () => {
      const proveedor = await createProveedor();
      const productoValido = await createProductoConProveedor(proveedor.id, {
        nombre: generateUniqueName('Producto rollback válido'),
      });
      const productoAjeno = await createProductoConProveedor(proveedor.id, {
        nombre: generateUniqueName('Producto rollback ajeno'),
      });
      const pedidoValido = await createPedido(proveedor.id, [
        {
          productoProveedorId: productoValido.productoProveedorId,
          cantidad: 1,
        },
      ]);
      const pedidoAjeno = await createPedido(proveedor.id, [
        { productoProveedorId: productoAjeno.productoProveedorId, cantidad: 1 },
      ]);

      const response = await request(app.getHttpServer())
        .post('/api/v1/recepciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          usuarioId: adminUserId,
          pedidos: [{ pedidoId: pedidoValido.pedidoId }],
          observaciones: generateUniqueName('Rollback recepción'),
          productos: [
            {
              pedidoProductoId: pedidoAjeno.pedidoProductoIds[0],
              cantidadRecibida: 1,
              estadoVisual: EstadoVisualProducto.OPTIMO,
            },
          ],
          productosNuevos: [
            {
              pendienteCreacion: true,
              codigoBarras: barcode(),
              nombre: generateUniqueName('Producto rollback no persistido'),
              unidad: 'UNIDAD',
              tipo: 'otro',
              contenido: 1,
              cantidadRecibida: 4,
            },
          ],
        })
        .expect(400);

      const pedidoValidoActualizado = await dataSource
        .getRepository(Pedido)
        .findOneBy({ id: pedidoValido.pedidoId });

      expect(response.body.success).toBe(false);
      expect(pedidoValidoActualizado?.estado).toBe(
        EstadoPedido.PENDIENTE_DE_APROBACION
      );
    });

    it('genera un PDF de pedidos agrupados por proveedor', async () => {
      const proveedor = await createProveedor();
      const producto = await createProductoConProveedor(proveedor.id, {
        nombre: generateUniqueName('Producto PDF pedido'),
      });
      const pedido = await createPedido(proveedor.id, [
        { productoProveedorId: producto.productoProveedorId, cantidad: 6 },
      ]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/recepciones/reporte-pdf')
        .query({ tipo: 'pedido', pedidoId: pedido.pedidoId })
        .set('Authorization', `Bearer ${adminToken}`)
        .buffer(true)
        .parse(binaryParser)
        .expect(200);

      expect(response.headers['content-type']).toContain('application/pdf');
      expect(response.headers['content-disposition']).toContain(
        'attachment; filename="reporte-recepcion.pdf"'
      );
      expect(Buffer.isBuffer(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(500);
    });

    it('genera un PDF de incidencias filtrando por proveedor y no resueltas', async () => {
      const proveedor = await createProveedor();
      const producto = await createProductoConProveedor(proveedor.id, {
        nombre: generateUniqueName('Producto PDF incidencia'),
      });
      const pedido = await createPedido(proveedor.id, [
        { productoProveedorId: producto.productoProveedorId, cantidad: 4 },
      ]);

      await request(app.getHttpServer())
        .post('/api/v1/recepciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          usuarioId: adminUserId,
          pedidos: [{ pedidoId: pedido.pedidoId }],
          observaciones: generateUniqueName('Recepción para PDF incidencias'),
          productos: [
            {
              pedidoProductoId: pedido.pedidoProductoIds[0],
              cantidadRecibida: 1,
              cantidadAlbaran: 1,
              estadoVisual: EstadoVisualProducto.ROTO,
              observaciones: 'Golpe en transporte',
            },
          ],
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .get('/api/v1/recepciones/reporte-pdf')
        .query({
          tipo: 'incidencias',
          proveedorId: proveedor.id,
          soloNoResueltas: 'true',
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .buffer(true)
        .parse(binaryParser)
        .expect(200);

      expect(response.headers['content-type']).toContain('application/pdf');
      expect(Buffer.isBuffer(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(500);
    });
  });
});
