import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { getTestApp } from '../setup/test-app';
import {
  expectErrorResponse,
  expectStandardResponse,
  generateUniqueName,
  loginAndGetToken,
} from '../utils/test-helpers';

describe('ProductoController (e2e) - Alta compleja', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    app = await getTestApp();
    adminToken = await loginAndGetToken(app);
  });

  async function createProveedor(nombre?: string) {
    const response = await request(app.getHttpServer())
      .post('/api/v1/proveedor')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: nombre ?? generateUniqueName('Proveedor alta compleja'),
        nif: `B${Math.floor(10000000 + Math.random() * 89999999)}`,
        email: `${Date.now()}-${Math.random().toString(36).slice(2)}@proveedor.test`,
      })
      .expect(201);

    return response.body.data as { id: string; nombre: string };
  }

  async function expectProductNotPersisted(nombreProducto: string) {
    const listResponse = await request(app.getHttpServer())
      .get('/api/v1/productos')
      .query({ searchTerm: nombreProducto })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(
      listResponse.body.data.data.some(
        (producto: { nombre: string }) => producto.nombre === nombreProducto
      )
    ).toBe(false);
  }

  it('crea un producto maestro con alérgenos y proveedor en una sola petición', async () => {
    const proveedor = await createProveedor();
    const nombreProducto = generateUniqueName('Leche alta compleja');

    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: nombreProducto,
        marca: 'Marca base',
        tipo: 'lacteo',
        unidad: 'L',
        contenido: 1,
        alergenos: ['LACTEOS'],
        proveedores: [
          {
            proveedorId: proveedor.id,
            precioUnitario: 1.45,
            marcaEspecifica: 'Pascual',
            codigoBarras: '5901234123457',
          },
        ],
      });

    expectStandardResponse(createResponse, 201);
    expect(createResponse.body.data.nombre).toBe(nombreProducto);
    expect(createResponse.body.data.alergenos).toEqual(
      expect.arrayContaining([expect.objectContaining({ alergeno: 'LACTEOS' })])
    );
    expect(createResponse.body.data.proveedores).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          proveedorId: proveedor.id,
          precioUnitario: 1.45,
        }),
      ])
    );

    const getResponse = await request(app.getHttpServer())
      .get(`/api/v1/productos/${createResponse.body.data.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expectStandardResponse(getResponse, 200);
    expect(getResponse.body.data.proveedores).toHaveLength(1);
    expect(getResponse.body.data.alergenos).toHaveLength(1);
  });

  it('genera automáticamente un EAN-13 cuando el producto maestro no lo recibe en el payload', async () => {
    const nombreProducto = generateUniqueName('Producto con ean autogenerado');

    const response = await request(app.getHttpServer())
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: nombreProducto,
        tipo: 'otro',
        unidad: 'UNIDAD',
        contenido: 1,
      })
      .expect(201);

    expectStandardResponse(response, 201);
    expect(response.body.data.codigoBarras).toMatch(/^\d{13}$/);
  });

  it('acepta un código de barras alfanumérico del producto', async () => {
    const nombreProducto = generateUniqueName('Producto codigo flexible');

    const response = await request(app.getHttpServer())
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: nombreProducto,
        tipo: 'lacteo',
        unidad: 'L',
        contenido: 1,
        codigoBarras: 'QAPNEBB8UX',
      });

    expectStandardResponse(response, 201);
    expect(response.body.data.codigoBarras).toBe('QAPNEBB8UX');
  });

  it('rechaza un código de barras de producto duplicado y no persiste la segunda alta', async () => {
    const firstCreateResponse = await request(app.getHttpServer())
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: generateUniqueName('Producto codigo unico'),
        tipo: 'otro',
        unidad: 'UNIDAD',
        contenido: 1,
      })
      .expect(201);

    const codigoBarras = firstCreateResponse.body.data.codigoBarras as string;

    const nombreDuplicado = generateUniqueName('Producto codigo duplicado');

    const duplicateResponse = await request(app.getHttpServer())
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: nombreDuplicado,
        tipo: 'otro',
        unidad: 'UNIDAD',
        contenido: 1,
        codigoBarras,
      });

    expectErrorResponse(duplicateResponse, 409);
    await expectProductNotPersisted(nombreDuplicado);
  });

  it('rechaza la alta compleja cuando el proveedor no existe y no persiste el producto', async () => {
    const nombreProducto = generateUniqueName('Leche proveedor inexistente');

    const response = await request(app.getHttpServer())
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: nombreProducto,
        tipo: 'lacteo',
        unidad: 'L',
        contenido: 1,
        proveedores: [
          {
            proveedorId: '01954a87-0778-74d4-bb32-55b12044579f',
            precioUnitario: 1.45,
          },
        ],
      });

    expectErrorResponse(response, 404);

    await expectProductNotPersisted(nombreProducto);
  });

  it('rechaza proveedores duplicados en el mismo payload y no persiste nada', async () => {
    const proveedor = await createProveedor();
    const nombreProducto = generateUniqueName('Leche proveedor duplicado');

    const response = await request(app.getHttpServer())
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: nombreProducto,
        tipo: 'lacteo',
        unidad: 'L',
        contenido: 1,
        proveedores: [
          {
            proveedorId: proveedor.id,
            precioUnitario: 1.45,
          },
          {
            proveedorId: proveedor.id,
            precioUnitario: 1.5,
          },
        ],
      });

    expectErrorResponse(response, 400);

    await expectProductNotPersisted(nombreProducto);
  });

  it('rechaza alérgenos duplicados en el mismo payload y no persiste nada', async () => {
    const nombreProducto = generateUniqueName('Leche alergeno duplicado');

    const response = await request(app.getHttpServer())
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: nombreProducto,
        tipo: 'lacteo',
        unidad: 'L',
        contenido: 1,
        alergenos: ['LACTEOS', 'LACTEOS'],
      });

    expectErrorResponse(response, 400);

    await expectProductNotPersisted(nombreProducto);
  });

  it('rechaza la alta compleja cuando falta el precio unitario del proveedor y no persiste nada', async () => {
    const proveedor = await createProveedor();
    const nombreProducto = generateUniqueName('Producto sin precio unitario');

    const response = await request(app.getHttpServer())
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: nombreProducto,
        tipo: 'lacteo',
        unidad: 'L',
        contenido: 1,
        proveedores: [
          {
            proveedorId: proveedor.id,
          },
        ],
      });

    expectErrorResponse(response, 400);
    await expectProductNotPersisted(nombreProducto);
  });

  it('acepta el código de barras alfanumérico de un proveedor', async () => {
    const proveedor = await createProveedor();
    const nombreProducto = generateUniqueName(
      'Producto con proveedor flexible'
    );

    const response = await request(app.getHttpServer())
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: nombreProducto,
        tipo: 'lacteo',
        unidad: 'L',
        contenido: 1,
        proveedores: [
          {
            proveedorId: proveedor.id,
            precioUnitario: 1.45,
            codigoBarras: 'PROV-123',
          },
        ],
      });

    expectStandardResponse(response, 201);
    expect(response.body.data.proveedores).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          proveedorId: proveedor.id,
          codigoBarras: 'PROV-123',
        }),
      ])
    );
  });

  it('permite completar el flujo conectado actualizando alérgenos y proveedores después del alta base', async () => {
    const proveedorA = await createProveedor();
    const proveedorB = await createProveedor();
    const nombreBase = generateUniqueName('Leche base');

    const createBaseResponse = await request(app.getHttpServer())
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: nombreBase,
        tipo: 'lacteo',
        unidad: 'L',
        contenido: 1,
      })
      .expect(201);

    const productoId = createBaseResponse.body.data.id as string;

    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/v1/productos/${productoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: `${nombreBase} premium`,
        alergenos: ['LACTEOS', 'GLUTEN'],
        proveedores: [
          {
            proveedorId: proveedorA.id,
            precioUnitario: 1.45,
            marcaEspecifica: 'Pascual',
          },
          {
            proveedorId: proveedorB.id,
            precioUnitario: 1.6,
            marcaEspecifica: 'Asturiana',
          },
        ],
      })
      .expect(200);

    expectStandardResponse(updateResponse, 200);
    expect(updateResponse.body.data.nombre).toBe(`${nombreBase} premium`);
    expect(updateResponse.body.data.alergenos).toHaveLength(2);
    expect(updateResponse.body.data.proveedores).toHaveLength(2);
  });

  it('sincroniza el flujo conectado eliminando proveedores omitidos y sustituyendo alérgenos', async () => {
    const proveedorA = await createProveedor();
    const proveedorB = await createProveedor();
    const nombreProducto = generateUniqueName('Producto sincronizacion patch');

    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: nombreProducto,
        tipo: 'lacteo',
        unidad: 'L',
        contenido: 1,
        alergenos: ['LACTEOS', 'GLUTEN'],
        proveedores: [
          {
            proveedorId: proveedorA.id,
            precioUnitario: 1.45,
            marcaEspecifica: 'Marca A',
          },
          {
            proveedorId: proveedorB.id,
            precioUnitario: 1.7,
            marcaEspecifica: 'Marca B',
          },
        ],
      })
      .expect(201);

    const productoId = createResponse.body.data.id as string;

    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/v1/productos/${productoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        alergenos: ['LACTEOS'],
        proveedores: [
          {
            proveedorId: proveedorA.id,
            precioUnitario: 1.55,
            marcaEspecifica: 'Marca A actualizada',
          },
        ],
      })
      .expect(200);

    expectStandardResponse(updateResponse, 200);
    expect(updateResponse.body.data.alergenos).toEqual([
      expect.objectContaining({ alergeno: 'LACTEOS' }),
    ]);
    expect(updateResponse.body.data.proveedores).toEqual([
      expect.objectContaining({
        proveedorId: proveedorA.id,
        precioUnitario: 1.55,
      }),
    ]);

    const getResponse = await request(app.getHttpServer())
      .get(`/api/v1/productos/${productoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(getResponse.body.data.alergenos).toHaveLength(1);
    expect(getResponse.body.data.proveedores).toHaveLength(1);
    expect(
      getResponse.body.data.proveedores.some(
        (proveedor: { proveedorId: string }) =>
          proveedor.proveedorId === proveedorB.id
      )
    ).toBe(false);
  });

  it('sin stock usa la media de precios de referencia como PMP global y la actualiza al cambiar precios en ABM', async () => {
    const proveedorA = await createProveedor();
    const proveedorB = await createProveedor();
    const nombreProducto = generateUniqueName('Producto pmp abm');

    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: nombreProducto,
        tipo: 'lacteo',
        unidad: 'L',
        contenido: 1,
        proveedores: [
          {
            proveedorId: proveedorA.id,
            precioUnitario: 2,
            marcaEspecifica: 'Marca A',
          },
          {
            proveedorId: proveedorB.id,
            precioUnitario: 4,
            marcaEspecifica: 'Marca B',
          },
        ],
      })
      .expect(201);

    const productoId = createResponse.body.data.id as string;

    const pmpInicialResponse = await request(app.getHttpServer())
      .get(`/api/v1/productos/${productoId}/pmp`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Number(pmpInicialResponse.body.data.pmp)).toBeCloseTo(3, 4);

    await request(app.getHttpServer())
      .patch(`/api/v1/productos/${productoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        proveedores: [
          {
            proveedorId: proveedorA.id,
            precioUnitario: 6,
            marcaEspecifica: 'Marca A',
          },
          {
            proveedorId: proveedorB.id,
            precioUnitario: 4,
            marcaEspecifica: 'Marca B',
          },
        ],
      })
      .expect(200);

    const pmpActualizadoResponse = await request(app.getHttpServer())
      .get(`/api/v1/productos/${productoId}/pmp`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Number(pmpActualizadoResponse.body.data.pmp)).toBeCloseTo(5, 4);

    const proveedorActualizado =
      pmpActualizadoResponse.body.data.porProveedor.find(
        (pp: { proveedorId: string; pmp: number }) =>
          pp.proveedorId === proveedorA.id
      );

    expect(Number(proveedorActualizado?.pmp ?? 0)).toBeCloseTo(0, 4);
  });

  it('permite vaciar alérgenos y proveedores enviando arrays vacíos en PATCH', async () => {
    const proveedor = await createProveedor();
    const nombreProducto = generateUniqueName('Producto limpieza patch');

    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: nombreProducto,
        tipo: 'lacteo',
        unidad: 'L',
        contenido: 1,
        alergenos: ['LACTEOS'],
        proveedores: [
          {
            proveedorId: proveedor.id,
            precioUnitario: 1.45,
          },
        ],
      })
      .expect(201);

    const productoId = createResponse.body.data.id as string;

    const updateResponse = await request(app.getHttpServer())
      .patch(`/api/v1/productos/${productoId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        alergenos: [],
        proveedores: [],
      })
      .expect(200);

    expectStandardResponse(updateResponse, 200);
    expect(updateResponse.body.data.alergenos).toHaveLength(0);
    expect(updateResponse.body.data.proveedores).toHaveLength(0);
  });
});
