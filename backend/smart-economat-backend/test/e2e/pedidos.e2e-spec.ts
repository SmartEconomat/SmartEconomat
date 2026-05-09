import { getTestApp } from '../setup/test-app';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { EstadoPedido } from '../../src/modules/pedido/enums/estado-pedido.enum';
import { EstadoPedidoUsuario } from '../../src/modules/pedido/enums/estado-pedido-usuario.enum';
import { generateUniqueName } from '../utils/test-helpers';

describe('PedidoController (e2e)', () => {
  jest.setTimeout(30000);

  let app: INestApplication;
  let adminToken: string;
  let proveedorId: string;
  let productoId: string;
  let productoProveedorId: string;
  let ubicacionId: string;

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

    productoId = prodRes.body.data.id;

    const relations =
      prodDetail.body.data.productoProveedores ||
      prodDetail.body.data.proveedores ||
      [];
    productoProveedorId = relations[0].id;

    const ubiRes = await request(app.getHttpServer() as string)
      .post('/api/v1/ubicacion')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: `Ubi Pedido ${Date.now()}` });
    ubicacionId = ubiRes.body.data.id;
  });

  describe('Ciclo de Vida del Pedido', () => {
    async function createPedido() {
      const res = await request(app.getHttpServer() as string)
        .post('/api/v1/pedidos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          proveedorId,
          observaciones: 'Pedido de prueba e2e',
          lineas: [
            {
              productoProveedorId,
              cantidad: 5,
            },
          ],
        });

      const detail = await request(app.getHttpServer() as string)
        .get(`/api/v1/pedidos/${res.body.data.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      return detail.body.data;
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
          observaciones: 'Pedido de prueba e2e',
          lineas: [
            {
              productoProveedorId,
              cantidad: 5,
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.data.numeroGlobal).toBeDefined();
      expect(response.body.data.estado).toBe(
        EstadoPedido.PENDIENTE_DE_APROBACION
      );
      expect(Number(response.body.data.costeTotal)).toBe(52.5);
      const diffMs =
        new Date(response.body.data.fechaEntrega).getTime() - Date.now();
      expect(diffMs).toBeGreaterThan(47 * 60 * 60 * 1000);
      expect(diffMs).toBeLessThan(49 * 60 * 60 * 1000);
    });

    it('E2E-PED-02-CRE-LEGACY: Rechaza fechaEntrega en el payload de creación', async () => {
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

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('E2E-PED-03-CRE-LEGACY: Rechaza motivoCancelacion en el payload de creación', async () => {
      const response = await request(app.getHttpServer() as string)
        .post('/api/v1/pedidos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          proveedorId,
          motivoCancelacion: 'Campo legacy no permitido',
          lineas: [
            {
              productoProveedorId,
              cantidad: 5,
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
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

    it('E2E-PED-13-UPD-FENT: Bloquea la actualización manual de fecha de entrega', async () => {
      const pedido = await createPedido();
      const newDate = new Date(Date.now() + 172800000).toISOString();
      const response = await request(app.getHttpServer() as string)
        .patch(`/api/v1/pedidos/${pedido.id}/fecha-entrega`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ fechaEntrega: newDate });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
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

    it('E2E-PED-21-CAN-BLOCK: No cancela un pedido si ya comenzó la recepción', async () => {
      const pedido = await createPedido();

      await request(app.getHttpServer() as string)
        .patch(`/api/v1/pedidos/${pedido.id}/aceptar`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app.getHttpServer() as string)
        .post('/api/v1/recepciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          pedidoIds: [pedido.id],
          productos: [
            {
              pedidoProductoId: pedido.pedidoProductos[0].id,
              cantidadRecibida: 1,
            },
          ],
          observaciones: 'Recepción parcial para bloqueo de cancelación',
        })
        .expect(201);

      const response = await request(app.getHttpServer() as string)
        .patch(`/api/v1/pedidos/${pedido.id}/cancelar`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ motivoCancelacion: 'Ya no hace falta' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    async function createProductoConProveedor(
      proveedorIdParam: string,
      nombre: string,
      precioUnitario: number
    ) {
      const prodRes = await request(app.getHttpServer() as string)
        .post('/api/v1/productos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre,
          tipo: 'cereal',
          unidad: 'KG',
          contenido: 1,
          proveedores: [{ proveedorId: proveedorIdParam, precioUnitario }],
        });

      expect(prodRes.status).toBe(201);
      return prodRes.body.data.id as string;
    }

    async function createReceta(
      nombre: string,
      ingredientes: Array<{
        productoId: string;
        cantidad: number;
        unidad: string;
        mermaAplicada?: number;
      }>
    ) {
      const recetaRes = await request(app.getHttpServer() as string)
        .post('/api/v1/recetas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre,
          instrucciones: 'Preparación de prueba',
          dificultad: 'Fácil',
          tiempoEstimadoMinutos: 10,
          ingredientes,
        });

      expect(recetaRes.status).toBe(201);
      return recetaRes.body.data.id as string;
    }

    async function createInventario(
      productoProveedorIdParam: string,
      cantidadActual: number,
      cantidadMinima = 0
    ) {
      const inventarioRes = await request(app.getHttpServer() as string)
        .post('/api/v1/inventario')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productoProveedorId: productoProveedorIdParam,
          ubicacionId,
          cantidadActual,
          cantidadMinima,
        });

      expect(inventarioRes.status).toBe(201);
      return inventarioRes.body.data;
    }

    it('E2E-PED-18-FROM-RECIPES-OK: Genera un pedido de un único proveedor desde recetas', async () => {
      const productoId = await createProductoConProveedor(
        proveedorId,
        generateUniqueName('Harina receta pedido'),
        4
      );

      const recetaAId = await createReceta(generateUniqueName('Receta A'), [
        { productoId, cantidad: 2, unidad: 'kg' },
      ]);
      const recetaBId = await createReceta(generateUniqueName('Receta B'), [
        { productoId, cantidad: 1, unidad: 'kg' },
      ]);

      const response = await request(app.getHttpServer() as string)
        .post('/api/v1/pedidos/from-recipes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          recetaIds: [recetaAId, recetaBId],
          proveedorId,
          observaciones: 'Pedido consolidado desde E2E',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.estado).toBe(
        EstadoPedido.PENDIENTE_DE_APROBACION
      );
      expect(response.body.data.proveedor?.id).toBe(proveedorId);
      expect(response.body.data.pedidoProductos).toHaveLength(1);
      expect(Number(response.body.data.pedidoProductos[0].cantidad)).toBe(3);
      expect(Number(response.body.data.costeTotal)).toBe(12);
    });

    it('E2E-PED-19-FROM-RECIPES-404: Devuelve 404 si alguna receta no existe', async () => {
      const productoId = await createProductoConProveedor(
        proveedorId,
        generateUniqueName('Producto receta 404'),
        3
      );
      const recetaId = await createReceta(generateUniqueName('Receta válida'), [
        { productoId, cantidad: 1, unidad: 'kg' },
      ]);

      const response = await request(app.getHttpServer() as string)
        .post('/api/v1/pedidos/from-recipes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          recetaIds: [recetaId, '0191c30c-1e55-7000-8000-000000000000'],
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('E2E-PED-20-FROM-RECIPES-400: Falla si las recetas requieren varios proveedores y no se indica uno', async () => {
      const proveedorAltRes = await request(app.getHttpServer() as string)
        .post('/api/v1/proveedor')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: generateUniqueName('Proveedor alternativo pedido'),
          nif: `B${Math.floor(Math.random() * 100000000)}`,
          email: `prov_alt_${Date.now()}@example.com`,
        });
      expect(proveedorAltRes.status).toBe(201);
      const proveedorAltId = proveedorAltRes.body.data.id as string;

      const productoAId = await createProductoConProveedor(
        proveedorId,
        generateUniqueName('Producto receta A'),
        2
      );
      const productoBId = await createProductoConProveedor(
        proveedorAltId,
        generateUniqueName('Producto receta B'),
        5
      );

      const recetaAId = await createReceta(
        generateUniqueName('Receta común A'),
        [{ productoId: productoAId, cantidad: 1, unidad: 'kg' }]
      );
      const recetaBId = await createReceta(
        generateUniqueName('Receta común B'),
        [{ productoId: productoBId, cantidad: 1, unidad: 'kg' }]
      );

      const response = await request(app.getHttpServer() as string)
        .post('/api/v1/pedidos/from-recipes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          recetaIds: [recetaAId, recetaBId],
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain(
        'Un pedido solo puede pertenecer a un proveedor'
      );
    });

    it('E2E-PED-22-PU-FROM-RECIPES-OK: Genera un pedido visible agrupado por proveedor desde recetas', async () => {
      const proveedorAltRes = await request(app.getHttpServer() as string)
        .post('/api/v1/proveedor')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: generateUniqueName('Proveedor visible recetas'),
          nif: `B${Math.floor(Math.random() * 100000000)}`,
          email: `prov_visible_${Date.now()}@example.com`,
        });
      expect(proveedorAltRes.status).toBe(201);
      const proveedorAltId = proveedorAltRes.body.data.id as string;

      const productoAId = await createProductoConProveedor(
        proveedorId,
        generateUniqueName('Producto visible receta A'),
        2
      );
      const productoBId = await createProductoConProveedor(
        proveedorAltId,
        generateUniqueName('Producto visible receta B'),
        5
      );

      const recetaAId = await createReceta(
        generateUniqueName('Receta visible A'),
        [{ productoId: productoAId, cantidad: 1, unidad: 'kg' }]
      );
      const recetaBId = await createReceta(
        generateUniqueName('Receta visible B'),
        [{ productoId: productoBId, cantidad: 1, unidad: 'kg' }]
      );

      const response = await request(app.getHttpServer() as string)
        .post('/api/v1/pedido-usuarios/from-recipes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          recetaIds: [recetaAId, recetaBId],
          observaciones: 'Pedido visible desde recetas',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.numeroGlobal).toBeDefined();
      expect(response.body.data.estado).toBe(EstadoPedidoUsuario.PENDIENTE);
      expect(response.body.data.pedidos).toHaveLength(2);

      const proveedores = new Set(
        response.body.data.pedidos.map(
          (pedido: { proveedor?: { id?: string } }) => pedido.proveedor?.id
        )
      );

      expect(proveedores).toEqual(new Set([proveedorId, proveedorAltId]));
    });

    it('E2E-PED-23-PU-FROM-MISSING-STOCK-OK: Genera un pedido visible desde faltantes reales de inventario', async () => {
      await createInventario(productoProveedorId, 1, 0);

      const recetaFaltanteId = await createReceta(
        generateUniqueName('Receta faltante visible'),
        [{ productoId, cantidad: 4, unidad: 'kg' }]
      );

      const response = await request(app.getHttpServer() as string)
        .post('/api/v1/pedido-usuarios/from-missing-stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [{ recetaId: recetaFaltanteId, cantidadAProducir: 1 }],
          observaciones: 'Pedido visible por faltantes',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.estado).toBe(EstadoPedidoUsuario.PENDIENTE);
      expect(response.body.data.numeroGlobal).toBeDefined();
      expect(response.body.data.lineas).toHaveLength(1);
      expect(response.body.data.lineas[0].productoProveedorId).toBe(
        productoProveedorId
      );
      expect(Number(response.body.data.lineas[0].cantidad)).toBeGreaterThan(0);
      expect(response.body.data.pedidos).toHaveLength(1);
      expect(response.body.data.pedidos[0].proveedor?.id).toBe(proveedorId);
    });

    it('E2E-PED-24-PU-APPROVE-NUMBERS-OK: Mantiene el número del pedido visible y asigna números independientes a cada pedido proveedor', async () => {
      const proveedorAltRes = await request(app.getHttpServer() as string)
        .post('/api/v1/proveedor')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: generateUniqueName('Proveedor aprobación visible'),
          nif: `B${Math.floor(Math.random() * 100000000)}`,
          email: `prov_visible_approve_${Date.now()}@example.com`,
        });
      expect(proveedorAltRes.status).toBe(201);
      const proveedorAltId = proveedorAltRes.body.data.id as string;

      const productoAltId = await createProductoConProveedor(
        proveedorAltId,
        generateUniqueName('Producto proveedor alternativo aprobación'),
        7
      );

      const productoAltDetail = await request(app.getHttpServer() as string)
        .get(`/api/v1/productos/${productoAltId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const productoProveedorAltId = (productoAltDetail.body.data
        .productoProveedores ||
        productoAltDetail.body.data.proveedores ||
        [])[0].id as string;

      const pedidoUsuarioResponse = await request(app.getHttpServer() as string)
        .post('/api/v1/pedido-usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          observaciones: 'Pedido visible multi-proveedor para aprobación',
          lineas: [
            {
              productoProveedorId,
              cantidad: 2,
            },
            {
              productoProveedorId: productoProveedorAltId,
              cantidad: 3,
            },
          ],
        });

      expect(pedidoUsuarioResponse.status).toBe(201);
      const pedidoUsuarioId = pedidoUsuarioResponse.body.data.id as string;
      const numeroPedidoUsuario = String(
        pedidoUsuarioResponse.body.data.numeroGlobal
      );

      const approvalResponse = await request(app.getHttpServer() as string)
        .patch(`/api/v1/pedido-usuarios/${pedidoUsuarioId}/aceptar`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send();

      expect(approvalResponse.status).toBe(200);
      expect(String(approvalResponse.body.data.numeroGlobal)).toBe(
        numeroPedidoUsuario
      );
      expect(approvalResponse.body.data.estado).toBe(
        EstadoPedidoUsuario.APROBADO
      );
      expect(approvalResponse.body.data.pedidos).toHaveLength(2);

      const numerosPedidoProveedor = approvalResponse.body.data.pedidos.map(
        (pedido: { numeroGlobal: string; proveedor?: { id?: string } }) => ({
          numeroGlobal: String(pedido.numeroGlobal),
          proveedorId: pedido.proveedor?.id,
        })
      );

      expect(
        numerosPedidoProveedor.every(
          (pedido) =>
            Boolean(pedido.numeroGlobal) &&
            pedido.numeroGlobal !== numeroPedidoUsuario
        )
      ).toBe(true);
      expect(
        new Set(numerosPedidoProveedor.map((pedido) => pedido.numeroGlobal))
          .size
      ).toBe(2);
      expect(
        new Set(numerosPedidoProveedor.map((pedido) => pedido.proveedorId))
      ).toEqual(new Set([proveedorId, proveedorAltId]));
    });
  });
});
