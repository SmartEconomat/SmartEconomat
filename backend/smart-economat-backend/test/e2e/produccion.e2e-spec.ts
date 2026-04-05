import { getTestApp } from '../setup/test-app';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DificultadReceta } from '../../src/modules/receta/enums/receta.enums';

describe('ProduccionController (e2e)', () => {
  jest.setTimeout(60000);

  let app: INestApplication;
  let adminToken: string;
  let recetaId: string;
  let ingredienteId: string;
  let ubicacionId: string;
  let productoProveedorId: string;

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
    const ubiRes = await request(app.getHttpServer() as string)
      .post('/api/v1/ubicacion')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: `Ubi Prod ${Date.now()}` });
    if (ubiRes.status !== 201) {
      throw new Error(`Ubi fail: ${JSON.stringify(ubiRes.body)}`);
    }
    ubicacionId = ubiRes.body.data.id;

    const provRes = await request(app.getHttpServer() as string)
      .post('/api/v1/proveedor')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: `Prov Prod ${Date.now()}`,
        nif: `B${Math.floor(Math.random() * 100000000)}`,
        email: `prov_prod_${Date.now()}@example.com`,
      });
    if (provRes.status !== 201) {
      throw new Error(`Prov fail: ${JSON.stringify(provRes.body)}`);
    }
    const provId = provRes.body.data.id;

    const ingRes = await request(app.getHttpServer() as string)
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: `Ingrediente E2E ${Date.now()}`,
        tipo: 'otro',
        unidad: 'KG',
        contenido: 1,
        proveedores: [{ proveedorId: provId, precioUnitario: 1 }],
      });
    if (ingRes.status !== 201) {
      throw new Error(`Ingrediente fail: ${JSON.stringify(ingRes.body)}`);
    }
    ingredienteId = ingRes.body.data.id;

    const ingDetail = await request(app.getHttpServer() as string)
      .get(`/api/v1/productos/${ingredienteId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    if (ingDetail.status !== 200) {
      throw new Error(`IngDetail: ${JSON.stringify(ingDetail.body)}`);
    }
    const relations = ingDetail.body.data.proveedores || [];
    if (relations.length === 0) {
      throw new Error(
        `No proveedores found for product: ${JSON.stringify(ingDetail.body.data)}`
      );
    }
    productoProveedorId = relations[0].id;

    const inventarioRes = await request(app.getHttpServer() as string)
      .post('/api/v1/inventario')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        productoProveedorId,
        ubicacionId,
        cantidadActual: 100,
        cantidadMinima: 0,
      });
    if (inventarioRes.status !== 201) {
      throw new Error(`Inventario fail: ${JSON.stringify(inventarioRes.body)}`);
    }

    const recetaRes = await request(app.getHttpServer() as string)
      .post('/api/v1/recetas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: `Receta E2E ${Date.now()}`,
        instrucciones: 'Mezclar y listo',
        tiempoEstimadoMinutos: 5,
        dificultad: DificultadReceta.FACIL,
        rendimiento: 1,
        unidadResultado: 'kg',
        raciones: 4,
        ingredientes: [
          { productoId: ingredienteId, cantidad: 2, unidad: 'kg' },
        ],
      });
    if (recetaRes.status !== 201) {
      throw new Error(`Receta fail: ${JSON.stringify(recetaRes.body)}`);
    }
    recetaId = recetaRes.body.data.id;
  });

  describe('Flujo de Producción y Raciones', () => {
    it('Debe ejecutar producción, crear lote y permitir consumo', async () => {
      const validRes = await request(app.getHttpServer() as string)
        .post('/api/v1/produccion/validar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [{ recetaId, cantidad: 1 }],
        });
      if (!validRes.body.data.ingredients[0].isEnough) {
        throw new Error(`Stock fail: ${JSON.stringify(validRes.body.data)}`);
      }
      expect(validRes.body.data.ingredients[0].isEnough).toBe(true);

      const cookRes = await request(app.getHttpServer() as string)
        .post('/api/v1/produccion/ejecutar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          recetaId,
          cantidadProducida: 1,
          ubicacionDestinoId: ubicacionId,
        });

      if (cookRes.status !== 201) {
        throw new Error(`Cook fail 500: ${JSON.stringify(cookRes.body)}`);
      }
      expect(cookRes.status).toBe(201);
      const loteId = cookRes.body.data.id;
      expect(Number(cookRes.body.data.porcionesProducidas)).toBe(4);
      expect(Number(cookRes.body.data.porcionesRestantes)).toBe(4);
      expect(cookRes.body.data.estado).toBe('disponible');

      const consumeRes = await request(app.getHttpServer() as string)
        .patch(`/api/v1/produccion/lote/${loteId}/consumir`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ tipo: 'raciones', valor: 1.5 });

      expect(consumeRes.status).toBe(200);
      expect(Number(consumeRes.body.data.porcionesRestantes)).toBe(2.5);
      expect(consumeRes.body.data.fechaAgotado ?? null).toBeNull();

      const consumeFinalRes = await request(app.getHttpServer() as string)
        .patch(`/api/v1/produccion/lote/${loteId}/consumir`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ tipo: 'raciones', valor: 2.5 });

      expect(consumeFinalRes.status).toBe(200);
      expect(Number(consumeFinalRes.body.data.porcionesRestantes)).toBe(0);
      expect(consumeFinalRes.body.data.estado).toBe('agotado');
      expect(consumeFinalRes.body.data.fechaAgotado).toBeTruthy();
    });

    it('Debe fallar si no hay stock suficiente', async () => {
      const cookRes = await request(app.getHttpServer() as string)
        .post('/api/v1/produccion/ejecutar')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          recetaId,
          cantidadProducida: 100,
          ubicacionDestinoId: ubicacionId,
        });

      expect(cookRes.status).toBe(400);
    });
  });
});
