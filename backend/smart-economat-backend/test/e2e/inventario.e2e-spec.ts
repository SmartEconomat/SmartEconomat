import { getTestApp } from '../setup/test-app';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { Movimiento } from '../../src/modules/movimiento/movimiento.entity/movimiento.entity';

describe('InventarioController (e2e)', () => {
  jest.setTimeout(30000);

  let app: INestApplication;
  let adminToken: string;
  let productoId: string;
  let productoProveedorId: string;
  let ubicacionId: string;
  let dataSource: DataSource;

  beforeAll(async () => {
    app = await getTestApp();
    dataSource = app.get(DataSource);

    const response = await request(app.getHttpServer() as string)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@smarteconomat.com',
        password: 'SmartEconomat2026!',
      });
    adminToken = response.body.data.access_token;
  });

  beforeEach(async () => {
    const ubiRes = await request(app.getHttpServer() as string)
      .post('/api/v1/ubicacion')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: `Ubi Inv ${Date.now()}` });
    ubicacionId = ubiRes.body.data.id;

    const provRes = await request(app.getHttpServer() as string)
      .post('/api/v1/proveedor')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: `Prov Inv ${Date.now()}`,
        nif: `B${Math.floor(Math.random() * 100000000)}`,
        email: `prov_inv_${Date.now()}@example.com`,
      });
    const provId = provRes.body.data.id;

    const prodRes = await request(app.getHttpServer() as string)
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: `Prod Inv ${Date.now()}`,
        tipo: 'lacteo',
        unidad: 'L',
        contenido: 1,
        proveedores: [{ proveedorId: provId, precioUnitario: 5 }],
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
  });

  describe('CRUD de Inventario', () => {
    async function createInventario() {
      const res = await request(app.getHttpServer() as string)
        .post('/api/v1/inventario')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productoProveedorId,
          ubicacionId,
          cantidadActual: 100,
          cantidadMinima: 10,
          cantidadMaxima: 200,
        });
      return res.body.data;
    }

    it('E2E-INV-01-CRE: Crear item de inventario', async () => {
      const response = await request(app.getHttpServer() as string)
        .post('/api/v1/inventario')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productoProveedorId,
          ubicacionId,
          cantidadActual: 100,
          cantidadMinima: 10,
          cantidadMaxima: 200,
        });

      expect(response.status).toBe(201);
      expect(Number(response.body.data.cantidadActual)).toBe(100);
    });

    it('E2E-INV-06-GET: Listar inventario', async () => {
      await createInventario();
      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/inventario')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data.data.length).toBeGreaterThan(0);
      expect(typeof response.body.data.total).toBe('number');
      expect(typeof response.body.data.page).toBe('number');
      expect(typeof response.body.data.limit).toBe('number');
    });

    it('E2E-INV-10-UPD-ADJ: Ajustar cantidad', async () => {
      const item = await createInventario();
      const response = await request(app.getHttpServer() as string)
        .patch(`/api/v1/inventario/${item.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cantidadActual: 150 });

      expect(response.status).toBe(200);
      expect(Number(response.body.data.cantidadActual)).toBe(150);
    });

    it('E2E-INV-11-MANUAL-ADJ: Registrar ajuste manual auditado', async () => {
      const item = await createInventario();
      const response = await request(app.getHttpServer() as string)
        .post('/api/v1/inventario/ajustes-manuales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          inventarioId: item.id,
          tipo: 'salida_ajuste',
          ajuste: -15,
          motivo: 'Rotura interna',
          observaciones: 'Envase dañado en almacén',
        });

      expect(response.status).toBe(201);
      expect(Number(response.body.data.cantidadActual)).toBe(85);

      const movimientoRepo = dataSource.getRepository(Movimiento);
      const movimiento = await movimientoRepo.findOne({
        where: {
          inventarioId: item.id,
          entidad: 'AjusteManualInventario',
        },
        relations: ['usuario'],
        order: {
          createdAt: 'DESC',
        },
      });

      expect(movimiento).toBeTruthy();
      expect(movimiento?.tipo).toBe('salida_ajuste');
      expect(Number(movimiento?.cantidad)).toBe(15);
      expect(movimiento?.descripcion).toContain('Ajuste manual de inventario:');
      expect(movimiento?.descripcion).toContain('Rotura interna');

      expect(movimiento?.usuarioId).toBeTruthy();
    });

    it('E2E-INV-11B-MANUAL-ADJ-VALIDATION: Rechazar signo inconsistente para entrada manual', async () => {
      const item = await createInventario();
      const response = await request(app.getHttpServer() as string)
        .post('/api/v1/inventario/ajustes-manuales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          inventarioId: item.id,
          tipo: 'entrada',
          ajuste: -15,
          motivo: 'Carga incorrecta',
        });

      expect(response.status).toBe(400);
    });

    it('E2E-INV-11C-MANUAL-ADJ-VALIDATION: Rechazar ajuste manual con valor 0', async () => {
      const item = await createInventario();
      const response = await request(app.getHttpServer() as string)
        .post('/api/v1/inventario/ajustes-manuales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          inventarioId: item.id,
          tipo: 'ajuste',
          ajuste: 0,
          motivo: 'Ajuste nulo',
        });

      expect(response.status).toBe(400);
    });

    it('E2E-INV-11D-MANUAL-ADJ-NOTFOUND: Rechazar ajuste sobre inventario inexistente', async () => {
      const response = await request(app.getHttpServer() as string)
        .post('/api/v1/inventario/ajustes-manuales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          inventarioId: '01954a87-0778-74d4-bb32-55b12044579f',
          tipo: 'ajuste',
          ajuste: 5,
          motivo: 'Regularización sobre recurso inexistente',
        });

      expect(response.status).toBe(404);
    });

    it('E2E-INV-12-MANUAL-ADJ-CONFLICT: Rechazar ajuste que deja stock negativo', async () => {
      const item = await createInventario();
      const response = await request(app.getHttpServer() as string)
        .post('/api/v1/inventario/ajustes-manuales')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          inventarioId: item.id,
          tipo: 'salida_ajuste',
          ajuste: -150,
          motivo: 'Regularización inválida',
        });

      expect(response.status).toBe(409);
    });

    it('E2E-INV-15-DEL-OK: Eliminar item de inventario', async () => {
      const item = await createInventario();
      await request(app.getHttpServer() as string)
        .delete(`/api/v1/inventario/${item.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });

    it('E2E-INV-15B-DEL-MOV-USER: El movimiento de eliminación expone el usuario en la API', async () => {
      const item = await createInventario();

      await request(app.getHttpServer() as string)
        .delete(`/api/v1/inventario/${item.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      const movimientoRepo = dataSource.getRepository(Movimiento);
      const movimiento = await movimientoRepo.findOne({
        where: {
          inventarioId: item.id,
          entidad: 'Inventario',
        },
        relations: ['usuario'],
        order: {
          createdAt: 'DESC',
        },
      });

      expect(movimiento).toBeTruthy();
      expect(movimiento?.usuarioId).toBeTruthy();

      const response = await request(app.getHttpServer() as string)
        .get(`/api/v1/movimientos/${movimiento?.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.usuario).toBeTruthy();
      expect(response.body.data.usuario.id).toBe(movimiento?.usuarioId);
      expect(
        response.body.data.usuario.nombre ||
          response.body.data.usuario.username ||
          response.body.data.usuario.email
      ).toBeTruthy();
    });
  });

  describe('Consulta de stock multicriterio', () => {
    async function createInventarioEnUbicacion(
      currentUbicacionId: string,
      cantidadActual: number,
      cantidadMinima: number = 10
    ) {
      const res = await request(app.getHttpServer() as string)
        .post('/api/v1/inventario')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productoProveedorId,
          ubicacionId: currentUbicacionId,
          cantidadActual,
          cantidadMinima,
          cantidadMaxima: 200,
        });

      expect(res.status).toBe(201);
      return res.body.data;
    }

    it('E2E-INV-STOCK-01: Debe desglosar stock por ubicación', async () => {
      const segundaUbicacion = await request(app.getHttpServer() as string)
        .post('/api/v1/ubicacion')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: `Ubi Inv Stock ${Date.now()}` });

      expect(segundaUbicacion.status).toBe(201);

      await createInventarioEnUbicacion(ubicacionId, 50, 10);
      await createInventarioEnUbicacion(segundaUbicacion.body.data.id, 20, 10);

      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/inventario/stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ productoId });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            productoId,
            ubicacionId,
            stock: 50,
          }),
          expect.objectContaining({
            productoId,
            ubicacionId: segundaUbicacion.body.data.id,
            stock: 20,
          }),
        ])
      );
    });

    it('E2E-INV-STOCK-02: Debe devolver stock consolidado por producto', async () => {
      const segundaUbicacion = await request(app.getHttpServer() as string)
        .post('/api/v1/ubicacion')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: `Ubi Inv Consolidado ${Date.now()}` });

      expect(segundaUbicacion.status).toBe(201);

      await createInventarioEnUbicacion(ubicacionId, 50, 10);
      await createInventarioEnUbicacion(segundaUbicacion.body.data.id, 20, 10);

      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/inventario/stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ productoId, consolidado: true });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([
        expect.objectContaining({
          productoId,
          stockTotal: 70,
        }),
      ]);
    });

    it('E2E-INV-STOCK-03: Debe filtrar sólo stock bajo', async () => {
      const segundaUbicacion = await request(app.getHttpServer() as string)
        .post('/api/v1/ubicacion')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: `Ubi Inv Low ${Date.now()}` });

      expect(segundaUbicacion.status).toBe(201);

      await createInventarioEnUbicacion(ubicacionId, 50, 10);
      await createInventarioEnUbicacion(segundaUbicacion.body.data.id, 5, 10);

      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/inventario/stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ productoId, onlyLowStock: true });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toEqual(
        expect.objectContaining({
          productoId,
          ubicacionId: segundaUbicacion.body.data.id,
          stock: 5,
        })
      );
    });

    it('E2E-INV-STOCK-04: Debe validar los filtros de entrada', async () => {
      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/inventario/stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ productoId: 'no-es-un-uuid' });

      expect(response.status).toBe(400);
    });
  });

  describe('Alertas', () => {
    it('GET /api/v1/alertas/caducidad - Debe listar alertas de caducidad', async () => {
      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/alertas/caducidad')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
    });

    it('GET /api/v1/alertas/stock - Debe listar alertas de stock', async () => {
      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/alertas/stock')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
    });
  });
});
