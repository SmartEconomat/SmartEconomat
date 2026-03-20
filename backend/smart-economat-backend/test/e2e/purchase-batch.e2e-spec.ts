import { getTestApp } from '../setup/test-app';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { loginAndGetToken, generateUniqueName } from '../utils/test-helpers';
import { Pedido } from '../../src/modules/pedido/pedido.entity/pedido.entity';
import { PedidoDraft } from '../../src/modules/pedido-draft/pedido-draft.entity/pedido-draft.entity';

describe('PurchaseBatchController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;

  beforeAll(async () => {
    app = await getTestApp();
    dataSource = app.get(DataSource);
    adminToken = await loginAndGetToken(app);
  });

  async function createProveedor() {
    const res = await request(app.getHttpServer())
      .post('/api/v1/proveedor')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: generateUniqueName('Prov Batch'),
        nif: `B${Math.floor(10000000 + Math.random() * 89999999)}`,
        email: `${Date.now()}@batch.test`,
      });
    return res.body.data;
  }

  async function createProductoConProveedor(proveedorId: string) {
    const res = await request(app.getHttpServer())
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: generateUniqueName('Prod Batch'),
        tipo: 'otro',
        unidad: 'UNIDAD',
        contenido: 1,
        proveedores: [{ proveedorId, precioUnitario: 10 }],
      });

    const detail = await request(app.getHttpServer())
      .get(`/api/v1/productos/${res.body.data.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const relaciones =
      detail.body.data.proveedores ||
      detail.body.data.productoProveedores ||
      [];
    return relaciones[0].id;
  }

  it('POST /purchase-batches - Debería crear un lote con pedidos agrupados por proveedor', async () => {
    const prov1 = await createProveedor();
    const prov2 = await createProveedor();
    const pp1 = await createProductoConProveedor(prov1.id);
    const pp2 = await createProductoConProveedor(prov2.id);

    const res = await request(app.getHttpServer())
      .post('/api/v1/purchase-batches')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        observaciones: 'Lote de prueba E2E',
        lineas: [
          { productoProveedorId: pp1, cantidad: 10 },
          { productoProveedorId: pp2, cantidad: 20 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.pedidos).toHaveLength(2);

    const draftCount = await dataSource.getRepository(PedidoDraft).count();
    expect(draftCount).toBe(0);

    const batchId = res.body.data.id;
    const pedidos = await dataSource
      .getRepository(Pedido)
      .find({ where: { batchId } });
    expect(pedidos).toHaveLength(2);
  });

  it('GET /purchase-batches - Debería listar los lotes', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/purchase-batches')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
