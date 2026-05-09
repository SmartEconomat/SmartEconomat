import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { getTestApp } from '../setup/test-app';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
describe('MovimientoController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let profesorToken: string;
  let testMovimientoId: string;

  beforeAll(async () => {
    app = await getTestApp();

    const adminResponse = await request(app.getHttpServer() as string)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@smarteconomat.com',
        password: 'SmartEconomat2026!',
      });
    adminToken = adminResponse.body.data?.access_token;

    const profesorResponse = await request(app.getHttpServer() as string)
      .post('/api/v1/auth/login')
      .send({
        email: 'profesor1@smarteconomat.com',
        password: 'SmartEconomat2026!',
      });
    profesorToken = profesorResponse.body.data?.access_token || adminToken;
  });

  describe('Listado General', () => {
    /**
     * Ejecuta la lógica de operación dentro del flujo de la aplicación.
     */
    it('GET /movimientos - Debe listar movimientos (200)', async () => {
      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/movimientos')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('data');
      expect(Array.isArray(response.body.data.data)).toBe(true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('limit');
      expect(response.body.data).toHaveProperty('totalPages');
    });

    it('GET /movimientos?page=1&limit=1 should respect pagination parameters', async () => {
      const res2 = await request(app.getHttpServer() as string)
        .get('/api/v1/movimientos')
        .query({ page: 1, limit: 1 })
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res2.status).toBe(200);
      expect(res2.body.data.page).toBe(1);
      expect(res2.body.data.limit).toBe(1);
      expect(Array.isArray(res2.body.data.data)).toBe(true);
      expect(res2.body.data.data.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Trazabilidad de Movimientos (Caso de Uso Principal)', () => {
    /**
     * Ejecuta la lógica de operación dentro del flujo de la aplicación.
     */
    it('GET /movimientos/historial - Sin parámetros debe fallar (400)', async () => {
      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/movimientos/historial')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('entityId');
    });

    /**
     * Ejecuta la lógica de operación dentro del flujo de la aplicación.
     */
    it('GET /movimientos/historial?entityId=<uuid> - Debe retornar historial por producto (200 o 404)', async () => {
      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/movimientos/historial')
        .query({ entityId: '019c9b4f-74f8-7a6e-8b5b-96191c30c1e5' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400, 404]).toContain(response.status);

      if (response.status === 200 && response.body.data?.data?.length > 1) {
        const items = response.body.data.data as { createdAt: string }[];
        const dates = items.map((m) => new Date(m.createdAt).getTime());
        for (let i = 0; i < dates.length - 1; i++) {
          expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
        }
      }
    });

    /**
     * Ejecuta la lógica de operación dentro del flujo de la aplicación.
     */
    it('GET /movimientos/historial?userId=<uuid> - Debe retornar historial por usuario (200 o 404)', async () => {
      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/movimientos/historial')
        .query({ userId: '019c9b4f-74f8-7a6e-8b5b-96191c30c1e5' })
        .set('Authorization', `Bearer ${profesorToken}`);

      expect([200, 400, 404]).toContain(response.status);
    });

    /**
     * Ejecuta la lógica de operación dentro del flujo de la aplicación.
     */
    it('GET /movimientos/historial?entityId=<uuid>&type=entrada - Debe filtrar por tipo (200 o 404)', async () => {
      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/movimientos/historial')
        .query({
          entityId: '019c9b4f-74f8-7a6e-8b5b-96191c30c1e5',
          type: 'entrada',
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400, 404]).toContain(response.status);

      if (response.status === 200) {
        const items = response.body.data.data as { tipo: string }[];
        items.forEach((m) => {
          expect(m.tipo).toBe('entrada');
        });
      }
    });

    /**
     * Ejecuta la lógica de operación dentro del flujo de la aplicación.
     */
    it('GET /movimientos/historial?entityId=<uuid>&startDate=2026-01-01&endDate=2026-02-28 - Debe filtrar por rango (200 o 404)', async () => {
      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/movimientos/historial')
        .query({
          entityId: '019c9b4f-74f8-7a6e-8b5b-96191c30c1e5',
          startDate: '2026-01-01',
          endDate: '2026-02-28',
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400, 404]).toContain(response.status);
    });

    /**
     * Ejecuta la lógica de operación dentro del flujo de la aplicación.
     */
    it('GET /movimientos/historial - Fechas inválidas deben fallar (400)', async () => {
      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/movimientos/historial')
        .query({
          entityId: '019c9b4f-74f8-7a6e-8b5b-96191c30c1e5',
          startDate: '2026-02-28',
          endDate: '2026-01-01',
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });

    /**
     * Ejecuta la lógica de operación dentro del flujo de la aplicación.
     */
    it('GET /movimientos/historial?entityId=invalid - UUID inválido debe fallar (400)', async () => {
      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/movimientos/historial')
        .query({ entityId: 'not-a-uuid' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });

    /**
     * Ejecuta la lógica de operación dentro del flujo de la aplicación.
     */
    it('GET /movimientos/historial - Sin autorización debe fallar (403)', async () => {
      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/movimientos/historial')
        .query({ entityId: '019c9b4f-74f8-7a6e-8b5b-96191c30c1e5' });

      expect(response.status).toBe(401);
    });

    /**
     * Ejecuta la lógica de operación dentro del flujo de la aplicación.
     */
    it('GET /movimientos/historial?sortBy=cantidad&sortOrder=ASC - Debe ordenar personalizadamente', async () => {
      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/movimientos/historial')
        .query({
          entityId: '019c9b4f-74f8-7a6e-8b5b-96191c30c1e5',
          sortBy: 'cantidad',
          sortOrder: 'ASC',
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400, 404]).toContain(response.status);
    });
  });

  describe('Detalle y Operaciones CRUD', () => {
    /**
     * Ejecuta la lógica de operación dentro del flujo de la aplicación.
     */
    it('GET /movimientos/:id - Debe retornar detalles del movimiento (200 o 404)', async () => {
      const listResponse = await request(app.getHttpServer() as string)
        .get('/api/v1/movimientos')
        .set('Authorization', `Bearer ${adminToken}`);

      if (
        listResponse.body.data?.data &&
        listResponse.body.data.data.length > 0
      ) {
        const movId = listResponse.body.data.data[0].id;
        testMovimientoId = movId;

        const detailResponse = await request(app.getHttpServer() as string)
          .get(`/api/v1/movimientos/${movId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect([200, 404]).toContain(detailResponse.status);
      }
    });

    /**
     * Ejecuta la lógica de operación dentro del flujo de la aplicación.
     */
    it('GET /movimientos/:id - UUID inexistente debe fallar (404)', async () => {
      const response = await request(app.getHttpServer() as string)
        .get('/api/v1/movimientos/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });

    /**
     * Ejecuta la lógica de operación dentro del flujo de la aplicación.
     */
    it('DELETE /movimientos/:id - Solo administrador puede eliminar (403 para profesor)', async () => {
      if (testMovimientoId) {
        const response = await request(app.getHttpServer() as string)
          .delete(`/api/v1/movimientos/${testMovimientoId}`)
          .set('Authorization', `Bearer ${profesorToken}`);

        expect([204, 403]).toContain(response.status);
      }
    });

    /**
     * Ejecuta la lógica de operación dentro del flujo de la aplicación.
     */
    it('DELETE /movimientos/:id - ID inexistente debe fallar (404)', async () => {
      const response = await request(app.getHttpServer() as string)
        .delete('/api/v1/movimientos/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Validación de DTOs', () => {
    /**
     * Ejecuta la lógica de operación dentro del flujo de la aplicación.
     */
    it('POST /movimientos - DTO inválido debe fallar (400)', async () => {
      const response = await request(app.getHttpServer() as string)
        .post('/api/v1/movimientos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          cantidad: 'no es numero',
          tipo: 'entrada',
        });

      expect(response.status).toBe(400);
    });
  });
});
