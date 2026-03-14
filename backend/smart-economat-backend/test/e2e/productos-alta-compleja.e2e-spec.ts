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

    expectErrorResponse(response, 409);

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

    expectErrorResponse(response, 409);

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
});
