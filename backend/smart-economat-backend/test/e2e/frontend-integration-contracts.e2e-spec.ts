import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { getTestApp } from '../setup/test-app';

interface ProductoProveedorRelation {
  id: string;
  marca?: string;
  codigoBarras?: string;
}

interface PedidoProductoRelation {
  id: string;
}

let uniqueSequence = 0;

function uniqueKey(): string {
  uniqueSequence += 1;
  return `${Date.now()}${String(uniqueSequence).padStart(4, '0')}`;
}

function generateEan13(): string {
  const base12 = uniqueKey().replace(/\D/g, '').slice(-12).padStart(12, '0');
  const checksum = base12
    .split('')
    .map(Number)
    .reduce((sum, digit, index) => sum + digit * (index % 2 === 0 ? 1 : 3), 0);
  const controlDigit = (10 - (checksum % 10)) % 10;
  return `${base12}${controlDigit}`;
}

function dayRange() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const isoDate = `${year}-${month}-${day}`;
  return {
    startDate: isoDate,
    endDate: isoDate,
  };
}

describe('Frontend Integration Contracts (e2e)', () => {
  jest.setTimeout(60000);

  let app: INestApplication;
  let adminToken: string;
  let profesorToken: string;
  let adminUserId: string;

  beforeAll(async () => {
    app = await getTestApp();

    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@smarteconomat.com',
        password: 'SmartEconomat2026!',
      })
      .expect(200);

    adminToken = adminLogin.body.data.access_token;

    const profile = await request(app.getHttpServer())
      .get('/api/v1/usuarios/perfil')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    adminUserId = profile.body.data.id;

    const profesorLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'profesor1@smarteconomat.com',
        password: 'SmartEconomat2026!',
      })
      .expect(200);

    profesorToken = profesorLogin.body.data.access_token;
  });

  async function createProveedor() {
    const unique = uniqueKey();
    const response = await request(app.getHttpServer())
      .post('/api/v1/proveedor')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: `Proveedor Integracion ${unique}`,
        nif: `B${String(unique).slice(-8)}`,
        email: `integracion_${unique}@example.com`,
      })
      .expect(201);

    return response.body.data;
  }

  async function createProductoConProveedor() {
    const proveedor = await createProveedor();
    const codigoBarras = generateEan13();

    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: `Producto Integracion ${uniqueKey()}`,
        tipo: 'lacteo',
        unidad: 'L',
        contenido: 1,
        codigoBarras,
        alergenos: ['LACTEOS', 'GLUTEN'],
        proveedores: [
          {
            proveedorId: proveedor.id,
            marcaEspecifica: 'Marca Integracion',
            precioUnitario: 4.25,
          },
        ],
      });

    if (createResponse.status !== 201) {
      throw new Error(
        `Error creando producto de integración: ${JSON.stringify(createResponse.body)}`
      );
    }

    const productoId = createResponse.body.data.id as string;

    const detailResponse = await request(app.getHttpServer())
      .get(`/api/v1/productos/${productoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const relations = (detailResponse.body.data.productoProveedores ||
      detailResponse.body.data.proveedores ||
      []) as ProductoProveedorRelation[];

    return {
      proveedor,
      producto: detailResponse.body.data,
      productoProveedorId: relations[0]?.id,
      codigoBarras,
    };
  }

  async function createPedidoConLinea() {
    const { proveedor, productoProveedorId } =
      await createProductoConProveedor();

    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/pedidos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        proveedorId: proveedor.id,
        observaciones: 'Pedido integración frontend',
        lineas: [
          {
            productoProveedorId,
            cantidad: 3,
          },
        ],
      })
      .expect(201);

    const pedidoId = createResponse.body.data.id as string;

    const detailResponse = await request(app.getHttpServer())
      .get(`/api/v1/pedidos/${pedidoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const pedidoProductos = (detailResponse.body.data.pedidoProductos ||
      detailResponse.body.data.productos ||
      []) as PedidoProductoRelation[];

    return {
      pedido: detailResponse.body.data,
      pedidoProductoId: pedidoProductos[0]?.id,
      productoProveedorId,
      proveedor,
    };
  }

  async function createIncidenciaResuelta(searchMarker: string) {
    const { pedido, pedidoProductoId } = await createPedidoConLinea();

    const recepcionResponse = await request(app.getHttpServer())
      .post('/api/v1/recepciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        pedidoIds: [pedido.id],
        productos: pedidoProductoId
          ? [
              {
                pedidoProductoId,
                cantidadRecibida: 3,
              },
            ]
          : [],
        observaciones: `Recepcion ${searchMarker}`,
      })
      .expect(201);

    const recepcionId = recepcionResponse.body.data.id;

    const incidenciaResponse = await request(app.getHttpServer())
      .post('/api/v1/incidencias')
      .set('Authorization', `Bearer ${profesorToken}`)
      .send({
        recepcionId,
        pedidoId: pedido.id,
        observacionesRecepcion: `Incidencia ${searchMarker}`,
      })
      .expect(201);

    const incidenciaId = incidenciaResponse.body.data.id as string;

    await request(app.getHttpServer())
      .patch(`/api/v1/incidencias/${incidenciaId}/resolver`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        usuarioId: adminUserId,
        observacionesResolucion: `Resuelta ${searchMarker}`,
      })
      .expect(200);

    return incidenciaId;
  }

  describe('Usuarios', () => {
    it('E2E-INT-USU-01: Debe aceptar búsqueda/paginación/ordenación compatibles con frontend', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/usuarios')
        .query({
          page: 1,
          limit: 50,
          searchTerm: 'admin',
          sortBy: 'username',
          order: 'ASC',
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.limit).toBe(50);
      expect(typeof response.body.data.total).toBe('number');
    });

    it('E2E-INT-USU-02: Debe rechazar un cambio de contraseña débil', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/v1/usuarios/perfil/password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          oldPassword: 'SmartEconomat2026!',
          newPassword: '12345678',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('E2E-INT-USU-03: Debe aceptar el nombre en el perfil', async () => {
      const response = await request(app.getHttpServer())
        .patch('/api/v1/usuarios/perfil')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Nombre nuevo' })
        .expect(200);

      expect(response.body.data.nombre).toBe('Nombre nuevo');
    });
  });

  describe('Productos', () => {
    it('E2E-INT-PRO-01: Debe aceptar enums normalizados y marcaEspecifica del proveedor', async () => {
      const { producto, codigoBarras } = await createProductoConProveedor();

      const relations = (producto.productoProveedores ||
        producto.proveedores ||
        []) as ProductoProveedorRelation[];
      const alergenos = producto.alergenos || [];

      expect(producto.codigoBarras).toBe(codigoBarras);
      expect(producto.unidad).toBe('L');
      expect(relations.length).toBeGreaterThan(0);
      expect(relations[0].marca).toBe('Marca Integracion');
      expect(alergenos.length).toBeGreaterThan(0);
    });
  });

  describe('Pedidos', () => {
    it('E2E-INT-PED-01: Debe rechazar el payload legado con pedidoProductos en lugar de lineas', async () => {
      const { proveedor, productoProveedorId } =
        await createProductoConProveedor();

      const response = await request(app.getHttpServer())
        .post('/api/v1/pedidos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          proveedorId: proveedor.id,
          pedidoProductos: [
            {
              productoProveedorId,
              cantidad: 2,
            },
          ],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Recepcion', () => {
    it('E2E-INT-REC-01: Debe aceptar productosNuevos con el shape corregido', async () => {
      const { pedido } = await createPedidoConLinea();

      const response = await request(app.getHttpServer())
        .post('/api/v1/recepciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          pedidoIds: [pedido.id],
          observaciones: 'Recepcion con producto nuevo valido',
          productos: [],
          productosNuevos: [
            {
              pendienteCreacion: true,
              codigoBarras: generateEan13(),
              nombre: `Nuevo recepcion ${uniqueKey()}`,
              marca: 'Marca Nueva',
              unidad: 'KG',
              tipo: 'otro',
              contenido: 1,
              cantidadRecibida: 2,
              observaciones: 'Alta correcta',
              isWeighedWithScale: false,
            },
          ],
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('E2E-INT-REC-02: Debe rechazar campos legacy no permitidos en productosNuevos', async () => {
      const { pedido } = await createPedidoConLinea();

      const response = await request(app.getHttpServer())
        .post('/api/v1/recepciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          pedidoIds: [pedido.id],
          observaciones: 'Recepcion con campos legacy invalidos',
          productos: [],
          productosNuevos: [
            {
              pendienteCreacion: true,
              codigoBarras: generateEan13(),
              nombre: `Nuevo legacy ${uniqueKey()}`,
              marca: 'Marca Nueva',
              unidad: 'KG',
              tipo: 'otro',
              contenido: 1,
              cantidadRecibida: 2,
              observaciones: 'Debe fallar',
              isWeighedWithScale: false,
              estadoVisual: 'OPTIMO',
              fechaCaducidad: '2026-12-31T00:00:00.000Z',
            },
          ],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Inventario', () => {
    it('E2E-INT-INV-01: Debe aceptar fechaCaducidad ISO en creación de inventario', async () => {
      const { productoProveedorId } = await createProductoConProveedor();

      const ubicacionResponse = await request(app.getHttpServer())
        .post('/api/v1/ubicacion')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: `Ubicacion Integracion ${Date.now()}` })
        .expect(201);

      const fechaCaducidad = '2026-12-31T00:00:00.000Z';

      const response = await request(app.getHttpServer())
        .post('/api/v1/inventario')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productoProveedorId,
          ubicacionId: ubicacionResponse.body.data.id,
          cantidadActual: 15,
          cantidadMinima: 3,
          cantidadMaxima: 25,
          fechaCaducidad,
        })
        .expect(201);

      expect(response.body.data.fechaCaducidad).toBeTruthy();
      expect(new Date(response.body.data.fechaCaducidad).toISOString()).toBe(
        fechaCaducidad
      );
    });
  });

  describe('Recetas', () => {
    it('E2E-INT-REC-01: Debe rechazar tiempoPreparacion sin normalizar', async () => {
      const { producto } = await createProductoConProveedor();

      const response = await request(app.getHttpServer())
        .post('/api/v1/recetas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: `Receta Integracion ${Date.now()}`,
          instrucciones: 'Preparar y servir',
          tiempo: '10 min',
          dificultad: 'Fácil',
          tiempoPreparacion: '30 min',
          ingredientes: [
            {
              productoId: producto.id,
              cantidad: 1,
              unidad: 'kg',
            },
          ],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Incidencias', () => {
    it('E2E-INT-INC-01: Debe aceptar filtros resuelta/startDate/endDate/searchTerm', async () => {
      const searchMarker = `Filtro-${Date.now()}`;
      const incidenciaId = await createIncidenciaResuelta(searchMarker);
      const { startDate, endDate } = dayRange();

      const response = await request(app.getHttpServer())
        .get('/api/v1/incidencias')
        .query({
          page: 1,
          limit: 10,
          searchTerm: searchMarker,
          resuelta: true,
          startDate,
          endDate,
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(
        response.body.data.data.map((item: { id: string }) => item.id)
      ).toContain(incidenciaId);
    });
  });
});
