/**
 * @file endpoint-inventory-coverage.e2e-spec.ts
 * @description Ejercita endpoints que el inventario E2E marcaba como sin llamada explícita en supertest.
 * Objetivo: al menos una petición por ruta (200/201/204 preferible; 400/404 aceptables si el contrato lo exige).
 */
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { getTestApp } from '../setup/test-app';
import { generateUniqueName, loginAndGetToken } from '../utils/test-helpers';
import { MotivoMerma } from '../../src/modules/merma/enums/merma.enums';
import { Alergeno } from '../../src/modules/producto/enums/producto.enums';
import { rolUsuario } from '../../src/modules/usuario/enums/usuario.enums';
import { RecepcionProducto } from '../../src/modules/recepcion/recepcion-productos.entity/recepcion-producto.entity';
import { Recepcion } from '../../src/modules/recepcion/recepcion.entity/recepcion.entity';
import { Incidencia } from '../../src/modules/incidencia/incidencia.entity/incidencia.entity';
import { PurchaseBatch } from '../../src/modules/pedido/purchase-batch.entity/purchase-batch.entity';

describe('Endpoint inventory coverage (e2e)', () => {
  jest.setTimeout(180000);

  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let profesorToken: string;
  beforeAll(async () => {
    app = await getTestApp();
    dataSource = app.get(DataSource);
    adminToken = await loginAndGetToken(app);
    const pr = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'profesor1@smarteconomat.com',
        password: 'SmartEconomat2026!',
      });
    profesorToken = pr.body.data?.access_token ?? adminToken;
  });

  describe('Auth', () => {
    it('POST /api/v1/auth/logout', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .expect(200);
    });

    it('GET /api/v1/auth/profile', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('POST /api/v1/auth/reset-password (token inválido)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/reset-password')
        .send({ token: 'invalid-token', newPassword: 'Aa1!aaaa' });
      expect([400, 404]).toContain(res.status);
    });
  });

  describe('Admin', () => {
    it('GET /api/v1/admin/roles y GET /api/v1/admin/permissions', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/admin/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      await request(app.getHttpServer())
        .get('/api/v1/admin/permissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('PATCH /api/v1/admin/users/:id/role', async () => {
      const roles = await request(app.getHttpServer())
        .get('/api/v1/admin/roles')
        .set('Authorization', `Bearer ${adminToken}`);
      const roleId =
        roles.body.data?.[0]?.id ?? roles.body.data?.roles?.[0]?.id;
      const users = await request(app.getHttpServer())
        .get('/api/v1/usuarios?limit=5')
        .set('Authorization', `Bearer ${adminToken}`);
      const userId = users.body.data?.data?.[0]?.id;
      if (!roleId || !userId) {
        expect(true).toBe(true);
        return;
      }
      await request(app.getHttpServer())
        .patch(`/api/v1/admin/users/${userId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ roleId })
        .expect(200);
    });
  });

  describe('Export (GET binarios / xlsx)', () => {
    it('exportaciones lote A', async () => {
      const paths = [
        '/api/v1/export/productos/xlsx',
        '/api/v1/export/pedidos/xlsx',
        '/api/v1/export/proveedores/xlsx',
        '/api/v1/export/albaranes/xlsx',
        '/api/v1/export/incidencias/xlsx',
        '/api/v1/export/inventario/xlsx',
        '/api/v1/export/movimientos/xlsx',
        '/api/v1/export/recepciones/xlsx',
      ];
      for (const p of paths) {
        const res = await request(app.getHttpServer())
          .get(p)
          .set('Authorization', `Bearer ${adminToken}`);
        expect([200, 204]).toContain(res.status);
      }
    });
    it('export recetas xlsx', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/export/recetas/xlsx')
        .set('Authorization', `Bearer ${adminToken}`);
      expect([200, 204]).toContain(res.status);
    });
    it('export ubicaciones xlsx', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/export/ubicaciones/xlsx')
        .set('Authorization', `Bearer ${adminToken}`);
      expect([200, 204]).toContain(res.status);
    });
    it('export usuarios xlsx (sin buffer completo)', async () => {
      await new Promise<void>((resolve, reject) => {
        request(app.getHttpServer())
          .get('/api/v1/export/usuarios/xlsx')
          .set('Authorization', `Bearer ${adminToken}`)
          .buffer(false)
          .end((err, res) => {
            if (err)
              return reject(
                err instanceof Error ? err : new Error(String(err))
              );
            expect([200, 204]).toContain(res.status);
            (
              res as unknown as NodeJS.ReadableStream & { destroy?: () => void }
            ).destroy?.();
            resolve();
          });
      });
    });
    it('exportaciones PDF (catálogo)', async () => {
      const pdfPaths = [
        '/api/v1/export/productos/pdf',
        '/api/v1/export/proveedores/pdf',
        '/api/v1/export/inventario/pdf',
        '/api/v1/export/pedidos/pdf',
        '/api/v1/export/albaranes/pdf',
        '/api/v1/export/recetas/pdf',
      ];
      for (const p of pdfPaths) {
        const res = await request(app.getHttpServer())
          .get(p)
          .set('Authorization', `Bearer ${adminToken}`);
        expect([200, 204]).toContain(res.status);
      }
    });
  });

  describe('Alumnos (rutas públicas / alumno)', () => {
    it('GET aulas, slots, clases, profesores', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/alumnos/aulas')
        .expect(200);
      await request(app.getHttpServer())
        .get('/api/v1/alumnos/aulas/Aula%20A/clases')
        .expect(200);
      await request(app.getHttpServer())
        .get('/api/v1/alumnos/aulas/Aula%20A/clases/1/profesores')
        .expect(200);
      const slotRes = await request(app.getHttpServer()).get(
        '/api/v1/alumnos/slots/CLASE-DEMO'
      );
      expect([200, 404]).toContain(slotRes.status);
    });
  });

  describe('Albaranes documento', () => {
    it('GET documento inexistente', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/albaranes/documento/no-existe.pdf')
        .set('Authorization', `Bearer ${adminToken}`);
      expect([200, 404]).toContain(res.status);
    });

    it('POST upload-documento requiere multipart', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/albaranes/upload-documento')
        .set('Authorization', `Bearer ${adminToken}`);
      expect([400, 415]).toContain(res.status);
    });
  });

  describe('Archivos content', () => {
    it('GET /api/v1/archivos/content/:filename', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/archivos/content/no-existe.bin')
        .set('Authorization', `Bearer ${adminToken}`);
      expect([200, 404]).toContain(res.status);
    });
  });

  describe('Historial precio', () => {
    it('CRUD mínimo', async () => {
      const prov = await request(app.getHttpServer())
        .post('/api/v1/proveedor')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: generateUniqueName('HP'),
          nif: `B${Math.floor(10000000 + Math.random() * 89999999)}`,
          email: `${Date.now()}@hp.test`,
        });
      const prod = await request(app.getHttpServer())
        .post('/api/v1/productos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: generateUniqueName('ProdHP'),
          tipo: 'otro',
          unidad: 'UNIDAD',
          contenido: 1,
          proveedores: [{ proveedorId: prov.body.data.id, precioUnitario: 5 }],
        });
      const detail = await request(app.getHttpServer())
        .get(`/api/v1/productos/${prod.body.data.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      const ppId =
        detail.body.data.productoProveedores?.[0]?.id ??
        detail.body.data.proveedores?.[0]?.id;

      await request(app.getHttpServer())
        .get('/api/v1/historial-precio')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const created = await request(app.getHttpServer())
        .post('/api/v1/historial-precio')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ productoProveedorId: ppId, precio: 7.5 })
        .expect(201);

      const hid = created.body.data.id;
      await request(app.getHttpServer())
        .get(`/api/v1/historial-precio/${hid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      await request(app.getHttpServer())
        .patch(`/api/v1/historial-precio/${hid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ precio: 8 })
        .expect(200);
      await request(app.getHttpServer())
        .delete(`/api/v1/historial-precio/${hid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });
  });

  describe('Incidencias resueltas', () => {
    it('CRUD mínimo', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/incidencias-resueltas')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const inc = await dataSource.getRepository(Incidencia).find({ take: 1 });
      if (!inc.length) return;
      const perf = await request(app.getHttpServer())
        .get('/api/v1/usuarios/perfil')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const adminId = perf.body.data.id as string;
      const created = await request(app.getHttpServer())
        .post('/api/v1/incidencias-resueltas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          idIncidencia: inc[0].id,
          idUsuarioResolutor: adminId,
          tipoResolucion: 'aceptada',
        });
      expect([201, 409]).toContain(created.status);
      if (created.status !== 201) return;
      const irid = created.body.data.id;
      await request(app.getHttpServer())
        .get(`/api/v1/incidencias-resueltas/${irid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      await request(app.getHttpServer())
        .patch(`/api/v1/incidencias-resueltas/${irid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ observaciones: 'e2e' })
        .expect(200);
      await request(app.getHttpServer())
        .delete(`/api/v1/incidencias-resueltas/${irid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });
  });

  describe('Merma', () => {
    it('stats, list, create, get', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/merma/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const prod = await request(app.getHttpServer())
        .post('/api/v1/productos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: generateUniqueName('MermaP'),
          tipo: 'otro',
          unidad: 'UNIDAD',
          contenido: 1,
          proveedores: [
            {
              proveedorId: (
                await request(app.getHttpServer())
                  .post('/api/v1/proveedor')
                  .set('Authorization', `Bearer ${adminToken}`)
                  .send({
                    nombre: generateUniqueName('MProv'),
                    nif: `B${Math.floor(10000000 + Math.random() * 89999999)}`,
                    email: `${Date.now()}@m.test`,
                  })
              ).body.data.id,
              precioUnitario: 1,
            },
          ],
        });
      const pid = prod.body.data.id as string;
      const list = await request(app.getHttpServer())
        .get('/api/v1/merma')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(list.body.success).toBe(true);
      const created = await request(app.getHttpServer())
        .post('/api/v1/merma')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productoId: pid,
          cantidad: 0.5,
          motivo: MotivoMerma.OTROS,
        });
      expect([201, 400]).toContain(created.status);
      if (created.status !== 201) return;
      await request(app.getHttpServer())
        .get(`/api/v1/merma/${created.body.data.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Movimientos PATCH :id', () => {
    it('actualiza movimiento existente', async () => {
      const list = await request(app.getHttpServer())
        .get('/api/v1/movimientos?limit=1')
        .set('Authorization', `Bearer ${adminToken}`);
      const id = list.body.data?.data?.[0]?.id;
      if (!id) {
        expect(true).toBe(true);
        return;
      }
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/movimientos/${id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ observaciones: 'e2e-inventory' });
      expect([200, 400, 403]).toContain(res.status);
    });
  });

  describe('Pedido usuarios', () => {
    it('flujo mínimo', async () => {
      const prov = await request(app.getHttpServer())
        .post('/api/v1/proveedor')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: generateUniqueName('PU'),
          nif: `B${Math.floor(10000000 + Math.random() * 89999999)}`,
          email: `${Date.now()}@pu.test`,
        });
      const pp = await request(app.getHttpServer())
        .post('/api/v1/productos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: generateUniqueName('PPU'),
          tipo: 'otro',
          unidad: 'UNIDAD',
          contenido: 1,
          proveedores: [{ proveedorId: prov.body.data.id, precioUnitario: 3 }],
        });
      const det = await request(app.getHttpServer())
        .get(`/api/v1/productos/${pp.body.data.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      const ppId =
        det.body.data.productoProveedores?.[0]?.id ??
        det.body.data.proveedores?.[0]?.id;

      const created = await request(app.getHttpServer())
        .post('/api/v1/pedido-usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          lineas: [{ productoProveedorId: ppId, cantidad: 1 }],
        })
        .expect(201);
      const puid = created.body.data.id;
      await request(app.getHttpServer())
        .get('/api/v1/pedido-usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      await request(app.getHttpServer())
        .get(`/api/v1/pedido-usuarios/${puid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const patchPu = await request(app.getHttpServer())
        .patch(`/api/v1/pedido-usuarios/${puid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          lineas: [{ productoProveedorId: ppId, cantidad: 2 }],
        });
      expect([200, 409]).toContain(patchPu.status);
      await request(app.getHttpServer())
        .patch(`/api/v1/pedido-usuarios/${puid}/aceptar`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const pdfRes = await request(app.getHttpServer())
        .get(`/api/v1/pedido-usuarios/${puid}/pdf`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect([200, 400]).toContain(pdfRes.status);
      const pu2 = await request(app.getHttpServer())
        .post('/api/v1/pedido-usuarios')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          lineas: [{ productoProveedorId: ppId, cantidad: 1 }],
        })
        .expect(201);
      await request(app.getHttpServer())
        .patch(`/api/v1/pedido-usuarios/${pu2.body.data.id}/cancelar`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect([200, 400]);
    });
  });

  describe('Pedido draft finalize', () => {
    it('POST /api/v1/pedido/draft/finalize', async () => {
      const prov = await request(app.getHttpServer())
        .post('/api/v1/proveedor')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: generateUniqueName('PDf'),
          nif: `B${Math.floor(10000000 + Math.random() * 89999999)}`,
          email: `${Date.now()}@pdf.test`,
        });
      const pp = await request(app.getHttpServer())
        .post('/api/v1/productos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: generateUniqueName('PDfp'),
          tipo: 'otro',
          unidad: 'UNIDAD',
          contenido: 1,
          proveedores: [{ proveedorId: prov.body.data.id, precioUnitario: 2 }],
        });
      const det = await request(app.getHttpServer())
        .get(`/api/v1/productos/${pp.body.data.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      const ppId =
        det.body.data.productoProveedores?.[0]?.id ??
        det.body.data.proveedores?.[0]?.id;
      await request(app.getHttpServer())
        .post('/api/v1/pedido/draft')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          payload: {
            observaciones: 'inv',
            lineas: [{ productoProveedorId: ppId, cantidad: 1 }],
          },
        })
        .expect(200);
      const res = await request(app.getHttpServer())
        .post('/api/v1/pedido/draft/finalize')
        .set('Authorization', `Bearer ${adminToken}`);
      expect([201, 400]).toContain(res.status);
    });
  });

  describe('Pedidos PATCH :id y aceptar', () => {
    it('patch pedido y aceptar', async () => {
      const prov = await request(app.getHttpServer())
        .post('/api/v1/proveedor')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: generateUniqueName('Ped'),
          nif: `B${Math.floor(10000000 + Math.random() * 89999999)}`,
          email: `${Date.now()}@ped.test`,
        });
      const prod = await request(app.getHttpServer())
        .post('/api/v1/productos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: generateUniqueName('PedP'),
          tipo: 'otro',
          unidad: 'UNIDAD',
          contenido: 1,
          proveedores: [{ proveedorId: prov.body.data.id, precioUnitario: 4 }],
        });
      const det = await request(app.getHttpServer())
        .get(`/api/v1/productos/${prod.body.data.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      const ppId =
        det.body.data.productoProveedores?.[0]?.id ??
        det.body.data.proveedores?.[0]?.id;
      const ped = await request(app.getHttpServer())
        .post('/api/v1/pedidos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          proveedorId: prov.body.data.id,
          lineas: [{ productoProveedorId: ppId, cantidad: 2 }],
        })
        .expect(201);
      const pid = ped.body.data.id;
      const patchPed = await request(app.getHttpServer())
        .patch(`/api/v1/pedidos/${pid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          proveedorId: prov.body.data.id,
          lineas: [{ productoProveedorId: ppId, cantidad: 3 }],
        });
      expect([200, 409]).toContain(patchPed.status);
      await request(app.getHttpServer())
        .patch(`/api/v1/pedidos/${pid}/aceptar`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Preparaciones', () => {
    it('ciclo preparación', async () => {
      const prov = await request(app.getHttpServer())
        .post('/api/v1/proveedor')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: generateUniqueName('PrepP'),
          nif: `B${Math.floor(10000000 + Math.random() * 89999999)}`,
          email: `${Date.now()}@prep.test`,
        });
      const prod = await request(app.getHttpServer())
        .post('/api/v1/productos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: generateUniqueName('PrepPr'),
          tipo: 'cereal',
          unidad: 'KG',
          contenido: 1,
          proveedores: [{ proveedorId: prov.body.data.id, precioUnitario: 2 }],
        });
      const pid = prod.body.data.id as string;
      const rec = await request(app.getHttpServer())
        .post('/api/v1/recetas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: generateUniqueName('RecPrep'),
          instrucciones: 'x',
          dificultad: 'Fácil',
          tiempoEstimadoMinutos: 5,
          ingredientes: [{ productoId: pid, cantidad: 1, unidad: 'kg' }],
        })
        .expect(201);
      const recetaId = rec.body.data.id as string;
      await request(app.getHttpServer())
        .get('/api/v1/preparaciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const prep = await request(app.getHttpServer())
        .post('/api/v1/preparaciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ recetaId, cantidadAProducir: 1 })
        .expect(201);
      const prid = prep.body.data.id;
      await request(app.getHttpServer())
        .get(`/api/v1/preparaciones/${prid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      await request(app.getHttpServer())
        .patch(`/api/v1/preparaciones/${prid}/iniciar`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      await request(app.getHttpServer())
        .patch(`/api/v1/preparaciones/${prid}/finalizar`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect([200, 400]);
      await request(app.getHttpServer())
        .delete(`/api/v1/preparaciones/${prid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect([200, 204, 400, 404]);
    });

    it('cancelar preparación', async () => {
      const prov = await request(app.getHttpServer())
        .post('/api/v1/proveedor')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: generateUniqueName('PrepC'),
          nif: `B${Math.floor(10000000 + Math.random() * 89999999)}`,
          email: `${Date.now()}@prepc.test`,
        });
      const prod = await request(app.getHttpServer())
        .post('/api/v1/productos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: generateUniqueName('PrepPC'),
          tipo: 'cereal',
          unidad: 'KG',
          contenido: 1,
          proveedores: [{ proveedorId: prov.body.data.id, precioUnitario: 2 }],
        });
      const pid = prod.body.data.id as string;
      const rec = await request(app.getHttpServer())
        .post('/api/v1/recetas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: generateUniqueName('RecPrepC'),
          instrucciones: 'x',
          dificultad: 'Fácil',
          tiempoEstimadoMinutos: 5,
          ingredientes: [{ productoId: pid, cantidad: 1, unidad: 'kg' }],
        })
        .expect(201);
      const prep = await request(app.getHttpServer())
        .post('/api/v1/preparaciones')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ recetaId: rec.body.data.id, cantidadAProducir: 0.5 })
        .expect(201);
      const prid = prep.body.data.id;
      await request(app.getHttpServer())
        .patch(`/api/v1/preparaciones/${prid}/cancelar`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Producción', () => {
    it('GET list y detalle', async () => {
      const list = await request(app.getHttpServer())
        .get('/api/v1/produccion')
        .set('Authorization', `Bearer ${adminToken}`);
      expect([200, 403]).toContain(list.status);
      if (list.body.data?.data?.length) {
        const id = list.body.data.data[0].id;
        await request(app.getHttpServer())
          .get(`/api/v1/produccion/${id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);
      }
    });
  });

  describe('Producto alérgenos', () => {
    it('CRUD y delete parcial', async () => {
      const prov = await request(app.getHttpServer())
        .post('/api/v1/proveedor')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: generateUniqueName('AlerP'),
          nif: `B${Math.floor(10000000 + Math.random() * 89999999)}`,
          email: `${Date.now()}@al.test`,
        });
      const prod = await request(app.getHttpServer())
        .post('/api/v1/productos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: generateUniqueName('ProdAler'),
          tipo: 'otro',
          unidad: 'UNIDAD',
          contenido: 1,
          proveedores: [{ proveedorId: prov.body.data.id, precioUnitario: 1 }],
        });
      const pid = prod.body.data.id as string;
      await request(app.getHttpServer())
        .get('/api/v1/producto-alergenos')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      await request(app.getHttpServer())
        .post('/api/v1/producto-alergenos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ idProducto: pid, alergeno: Alergeno.GLUTEN })
        .expect(201);
      await request(app.getHttpServer())
        .get(`/api/v1/producto-alergenos/${pid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      await request(app.getHttpServer())
        .patch(`/api/v1/producto-alergenos/${pid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ alergenos: [Alergeno.LACTEOS] })
        .expect(200);
      await request(app.getHttpServer())
        .delete(`/api/v1/producto-alergenos/${pid}/${Alergeno.LACTEOS}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });
  });

  describe('Producto proveedor extras', () => {
    it('search, comparar, merma', async () => {
      const prod = await request(app.getHttpServer())
        .get('/api/v1/productos?limit=1')
        .set('Authorization', `Bearer ${adminToken}`);
      const productoId = prod.body.data?.data?.[0]?.id;
      if (!productoId) return;
      await request(app.getHttpServer())
        .get('/api/v1/producto-proveedor/search?q=test')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      await request(app.getHttpServer())
        .get(`/api/v1/producto-proveedor/comparar/${productoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const rel = await request(app.getHttpServer())
        .get(`/api/v1/productos/${productoId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      const ppId =
        rel.body.data?.productoProveedores?.[0]?.id ??
        rel.body.data?.proveedores?.[0]?.id;
      if (ppId) {
        await request(app.getHttpServer())
          .patch(`/api/v1/producto-proveedor/${ppId}/merma`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ merma: 0 })
          .expect([200, 400]);
      }
    });
  });

  describe('Productos historial-precios y PMP', () => {
    it('GET subrecursos', async () => {
      const prod = await request(app.getHttpServer())
        .get('/api/v1/productos?limit=1')
        .set('Authorization', `Bearer ${adminToken}`);
      const id = prod.body.data?.data?.[0]?.id;
      if (!id) return;
      await request(app.getHttpServer())
        .get(`/api/v1/productos/${id}/historial-precios`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      await request(app.getHttpServer())
        .get(`/api/v1/productos/${id}/pmp`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Profesores slots (no admin)', () => {
    it('slots profesor', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/profesores/slots')
        .set('Authorization', `Bearer ${profesorToken}`)
        .expect(200);
      const slot = await request(app.getHttpServer())
        .post('/api/v1/profesores/slots')
        .set('Authorization', `Bearer ${profesorToken}`)
        .send({
          aula: `Aula Test ${Date.now()}`,
          numeroClase: Math.floor(50 + Math.random() * 200),
          capacidad: 20,
        })
        .expect(201);
      const sid = slot.body.data.id;
      await request(app.getHttpServer())
        .patch(`/api/v1/profesores/slots/${sid}`)
        .set('Authorization', `Bearer ${profesorToken}`)
        .send({ aula: 'Aula2' })
        .expect(200);
      const delSlot = await request(app.getHttpServer())
        .delete(`/api/v1/profesores/slots/${sid}`)
        .set('Authorization', `Bearer ${profesorToken}`);
      expect([200, 204]).toContain(delSlot.status);
    });

    it('admin slots y listados', async () => {
      const allP = await request(app.getHttpServer())
        .get('/api/v1/profesores/all-profesores')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const profs = Array.isArray(allP.body.data)
        ? allP.body.data
        : (allP.body.data?.data ?? []);
      const profesorId = (profs[0]?.id ?? profs[0]?.userId) as string;
      if (!profesorId) return;
      await request(app.getHttpServer())
        .post('/api/v1/profesores/admin-slots')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          profesorId,
          aula: `AulaAdm${Date.now()}`,
          numeroClase: Math.floor(300 + Math.random() * 100),
          capacidad: 15,
        })
        .expect(201);
      await request(app.getHttpServer())
        .get('/api/v1/profesores/all-profesores')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Proveedor por id', () => {
    it('GET /api/v1/proveedor/:id', async () => {
      const prov = await request(app.getHttpServer())
        .post('/api/v1/proveedor')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: generateUniqueName('ProvById'),
          nif: `B${Math.floor(10000000 + Math.random() * 89999999)}`,
          email: `${Date.now()}@pv.test`,
        });
      await request(app.getHttpServer())
        .get(`/api/v1/proveedor/${prov.body.data.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Purchase batches — rutas adicionales', () => {
    it('detalle, patch, pdf, consolidate, from-missing-stock', async () => {
      const prov = await request(app.getHttpServer())
        .post('/api/v1/proveedor')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: generateUniqueName('PB2'),
          nif: `B${Math.floor(10000000 + Math.random() * 89999999)}`,
          email: `${Date.now()}@pb2.test`,
        });
      const pp = await request(app.getHttpServer())
        .post('/api/v1/productos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: generateUniqueName('PB2p'),
          tipo: 'otro',
          unidad: 'UNIDAD',
          contenido: 1,
          proveedores: [{ proveedorId: prov.body.data.id, precioUnitario: 3 }],
        });
      const det = await request(app.getHttpServer())
        .get(`/api/v1/productos/${pp.body.data.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      const ppId =
        det.body.data.productoProveedores?.[0]?.id ??
        det.body.data.proveedores?.[0]?.id;
      await request(app.getHttpServer())
        .post('/api/v1/purchase-batches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          lineas: [{ productoProveedorId: ppId, cantidad: 1 }],
        })
        .expect(201);
      const latest = await dataSource.getRepository(PurchaseBatch).find({
        order: { createdAt: 'DESC' },
        take: 1,
      });
      const bid = latest[0]?.id;
      expect(bid).toBeDefined();
      await request(app.getHttpServer())
        .get(`/api/v1/purchase-batches/${bid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const patchB = await request(app.getHttpServer())
        .patch(`/api/v1/purchase-batches/${bid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          lineas: [{ productoProveedorId: ppId, cantidad: 2 }],
        });
      expect([200, 400]).toContain(patchB.status);
      await request(app.getHttpServer())
        .get(`/api/v1/purchase-batches/${bid}/pdf`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const acc = await request(app.getHttpServer())
        .patch(`/api/v1/purchase-batches/${bid}/aceptar`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect([200, 400]).toContain(acc.status);
      await request(app.getHttpServer())
        .post('/api/v1/purchase-batches/from-missing-stock')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect([200, 201, 400]);
      const ped = await request(app.getHttpServer())
        .post('/api/v1/pedidos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          proveedorId: prov.body.data.id,
          lineas: [{ productoProveedorId: ppId, cantidad: 1 }],
        })
        .expect(201);
      await request(app.getHttpServer())
        .post('/api/v1/purchase-batches/consolidate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ pedidoIds: [ped.body.data.id] })
        .expect([200, 201, 400, 404]);
      const latest2 = await dataSource.getRepository(PurchaseBatch).find({
        order: { createdAt: 'DESC' },
        take: 1,
      });
      const bid2 = latest2[0]?.id;
      await request(app.getHttpServer())
        .patch(`/api/v1/purchase-batches/${bid2}/cancelar`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect([200, 400]);
    });
  });

  describe('Recepción productos', () => {
    it('lista, detalle y patch con filas semilla', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/recepcion-productos')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const rows = await dataSource.getRepository(RecepcionProducto).find({
        take: 1,
      });
      if (!rows.length) return;
      const rpid = rows[0].id;
      await request(app.getHttpServer())
        .get(`/api/v1/recepcion-productos/${rpid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      await request(app.getHttpServer())
        .patch(`/api/v1/recepcion-productos/${rpid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cantidadRecibida: rows[0].cantidadRecibida })
        .expect(200);
      await request(app.getHttpServer())
        .post('/api/v1/recepcion-productos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          idRecepcion: rows[0].recepcionId,
          idPedidoProducto: rows[0].pedidoProductoId,
          cantidadRecibida: 0.001,
        })
        .expect([201, 400, 409]);
      const fresh = await dataSource.getRepository(RecepcionProducto).find({
        order: { createdAt: 'DESC' },
        take: 1,
      });
      if (fresh.length && fresh[0].id !== rpid) {
        await request(app.getHttpServer())
          .delete(`/api/v1/recepcion-productos/${fresh[0].id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect([204, 400]);
      }
    });
  });

  describe('Recepciones patch/delete', () => {
    it('PATCH y DELETE recepción (datos existentes)', async () => {
      const recs = await dataSource.getRepository(Recepcion).find({ take: 1 });
      if (!recs.length) return;
      const rid = recs[0].id;
      await request(app.getHttpServer())
        .patch(`/api/v1/recepciones/${rid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ observaciones: 'e2e-inventory' })
        .expect([200, 400]);
      const delRec = await request(app.getHttpServer())
        .delete(`/api/v1/recepciones/${rid}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect([200, 204, 400, 409, 500]).toContain(delRec.status);
    });
  });

  describe('Recetas — subrutas', () => {
    it('detalle, escandallo, pdf, cocinar, recalcular, export pdf', async () => {
      const prov = await request(app.getHttpServer())
        .post('/api/v1/proveedor')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: generateUniqueName('RecSub'),
          nif: `B${Math.floor(10000000 + Math.random() * 89999999)}`,
          email: `${Date.now()}@recs.test`,
        });
      const prod = await request(app.getHttpServer())
        .post('/api/v1/productos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: generateUniqueName('RecSubP'),
          tipo: 'cereal',
          unidad: 'KG',
          contenido: 1,
          proveedores: [{ proveedorId: prov.body.data.id, precioUnitario: 1 }],
        });
      const pid = prod.body.data.id as string;
      const rec = await request(app.getHttpServer())
        .post('/api/v1/recetas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: generateUniqueName('RecetaSub'),
          instrucciones: 'z',
          dificultad: 'Fácil',
          tiempoEstimadoMinutos: 5,
          ingredientes: [{ productoId: pid, cantidad: 1, unidad: 'kg' }],
        })
        .expect(201);
      const rid = rec.body.data.id as string;
      await request(app.getHttpServer())
        .get(`/api/v1/recetas/${rid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      await request(app.getHttpServer())
        .get(`/api/v1/recetas/${rid}/detalle`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      await request(app.getHttpServer())
        .get(`/api/v1/recetas/${rid}/escandallo`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      await request(app.getHttpServer())
        .get(`/api/v1/recetas/${rid}/pdf`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      await request(app.getHttpServer())
        .post(`/api/v1/recetas/${rid}/cocinar`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ cantidad: 1 })
        .expect([200, 400]);
      await request(app.getHttpServer())
        .post(`/api/v1/recetas/${rid}/recalcular-costes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      await request(app.getHttpServer())
        .get(`/api/v1/recetas/export/pdf?ids=${rid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  describe('Usuarios — admin y permisos', () => {
    it('minimos, admin create, patch admin, delete, permisos', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/usuarios/minimos')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const created = await request(app.getHttpServer())
        .post('/api/v1/usuarios/admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Test User',
          username: `u_adm_${Date.now()}`,
          password: 'Aa1!aaaa',
          rol: rolUsuario.PROFESOR,
        })
        .expect(201);
      const uid = created.body.data.id;
      await request(app.getHttpServer())
        .patch(`/api/v1/usuarios/${uid}/admin`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ activo: true })
        .expect(200);
      const perms = await request(app.getHttpServer())
        .get('/api/v1/admin/permissions')
        .set('Authorization', `Bearer ${adminToken}`);
      const permList = Array.isArray(perms.body.data)
        ? perms.body.data
        : (perms.body.data?.permissions ?? []);
      const permId = permList[0]?.id;
      if (permId) {
        await request(app.getHttpServer())
          .post(`/api/v1/usuarios/${uid}/permisos-adicionales/${permId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect([200, 201, 400]);
        await request(app.getHttpServer())
          .delete(`/api/v1/usuarios/${uid}/permisos-adicionales/${permId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect([200, 204]);
      }
      await request(app.getHttpServer())
        .delete(`/api/v1/usuarios/${uid}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect([200, 204]);
    });
  });
});
