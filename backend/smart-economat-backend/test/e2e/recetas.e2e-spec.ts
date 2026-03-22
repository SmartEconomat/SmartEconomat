import { getTestApp } from '../setup/test-app';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DificultadReceta } from '../../src/modules/receta/enums/receta.enums';
import {
  UnidadMedida,
  TipoProducto,
} from '../../src/modules/producto/enums/producto.enums';

/**
 * @file recetas.e2e-spec.ts
 * @description Pruebas de integración para el controlador de Recetas.
 * Cubre el CRUD de recetas y sus validaciones.
 */
describe('RecetaController (e2e)', () => {
  jest.setTimeout(60000);

  let app: INestApplication;
  let adminToken: string;
  let recetaId: string;
  let productoId: string;

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
    const productoRes = await request(app.getHttpServer() as string)
      .post('/api/v1/productos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: `Producto Receta E2E ${Date.now()}_${Math.random()}`,
        unidad: UnidadMedida.KG,
        tipo: TipoProducto.VERDURA,
        contenido: 1,
      });

    if (productoRes.status !== 201) {
      throw new Error(
        `Failed to create product in beforeEach: ${JSON.stringify(productoRes.body)}`
      );
    }
    productoId = productoRes.body.data.id;

    const recetaRes = await request(app.getHttpServer() as string)
      .post('/api/v1/recetas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombre: `Receta Base E2E ${Date.now()}_${Math.random()}`,
        instrucciones: 'Instrucciones base',
        tiempoEstimadoMinutos: 10,
        dificultad: DificultadReceta.FACIL,
        ingredientes: [{ productoId, cantidad: 1, unidad: 'kg' }],
      });

    if (recetaRes.status !== 201) {
      throw new Error(
        `Failed to create recipe in beforeEach: ${JSON.stringify(recetaRes.body)}`
      );
    }
    recetaId = recetaRes.body.data.id;
  });

  describe('CRUD de Recetas', () => {
    /**
     * @test Debe crear una receta con todos los campos obligatorios.
     */
    it('POST /recetas - Debe crear una receta (201)', async () => {
      const res = await request(app.getHttpServer() as string)
        .post('/api/v1/recetas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: `Receta E2E ${Date.now()}`,
          instrucciones: 'Mezclar y cocinar.',
          tiempoEstimadoMinutos: 20,
          dificultad: DificultadReceta.MEDIA,
          ingredientes: [
            {
              productoId,
              cantidad: 1,
              unidad: 'kg',
            },
          ],
        });

      if (res.status !== 201) {
        throw new Error(
          `Expected 201, got ${res.status}. Body: ${JSON.stringify(res.body)}`
        );
      }

      expect(res.body.success).toBe(true);
      recetaId = res.body.data.id;
    });

    /**
     * @test Debe listar las recetas registradas.
     */
    it('GET /recetas - Debe listar recetas (200)', () => {
      return request(app.getHttpServer() as string)
        .get('/api/v1/recetas')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    /**
     * @test Debe actualizar los datos de una receta.
     */
    it('PATCH /recetas/:id - Debe actualizar receta (200)', () => {
      return request(app.getHttpServer() as string)
        .patch(`/api/v1/recetas/${recetaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nombre: 'Receta Modificada' })
        .expect((res) => {
          if (res.status !== 200) {
            throw new Error(
              `Expected 200, got ${res.status}. Body: ${JSON.stringify(res.body)}`
            );
          }
        });
    });

    /**
     * @test Debe eliminar una receta (solo admin).
     */
    it('DELETE /recetas/:id - Debe eliminar receta (204)', () => {
      return request(app.getHttpServer() as string)
        .delete(`/api/v1/recetas/${recetaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect((res) => {
          if (res.status !== 204) {
            throw new Error(
              `Expected 204, got ${res.status}. Body: ${JSON.stringify(res.body)}`
            );
          }
        });
    });

    /**
     * @test Debe duplicar una receta.
     */
    it('POST /recetas/duplicate - Debe duplicar una receta (201)', async () => {
      const originalName = `Receta Original ${Date.now()}_${Math.random()}`;
      const duplicatedName = `Receta Duplicada ${Date.now()}_${Math.random()}`;

      const createRes = await request(app.getHttpServer() as string)
        .post('/api/v1/recetas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: originalName,
          instrucciones: 'Instrucciones originales',
          tiempoEstimadoMinutos: 15,
          dificultad: DificultadReceta.FACIL,
          ingredientes: [
            {
              productoId,
              cantidad: 0.5,
              unidad: 'l',
            },
          ],
        });

      if (createRes.status !== 201) {
        throw new Error(
          `Expected 201, got ${createRes.status}. Body: ${JSON.stringify(createRes.body)}`
        );
      }

      const originalId = createRes.body.data.id;

      const duplicateRes = await request(app.getHttpServer() as string)
        .post('/api/v1/recetas/duplicate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sourceId: originalId,
          newName: duplicatedName,
        });

      if (duplicateRes.status !== 201) {
        throw new Error(
          `Expected 201, got ${duplicateRes.status}. Body: ${JSON.stringify(duplicateRes.body)}`
        );
      }

      expect(duplicateRes.body.success).toBe(true);
      expect(duplicateRes.body.data.nombre).toBe(duplicatedName);
      const duplicatedId = duplicateRes.body.data.id;

      await request(app.getHttpServer() as string)
        .delete(`/api/v1/recetas/${originalId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      await request(app.getHttpServer() as string)
        .delete(`/api/v1/recetas/${duplicatedId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });
  });
});
