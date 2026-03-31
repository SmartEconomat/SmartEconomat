import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { Alumno } from '../../src/modules/alumno/alumno.entity/alumno.entity';
import { Usuario } from '../../src/modules/usuario/usuario.entity/usuario.entity';
import { getTestApp } from '../setup/test-app';

describe('Auth multi-user flows (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;

  beforeAll(async () => {
    app = await getTestApp();
    dataSource = app.get(DataSource);

    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@smarteconomat.com',
        password: 'SmartEconomat2026!',
      })
      .expect(200);

    adminToken = adminLogin.body.data.access_token;
  });

  async function activateUserByUsername(username: string) {
    const user = await dataSource.getRepository(Usuario).findOne({
      where: { username },
    });

    expect(user).toBeDefined();

    await request(app.getHttpServer())
      .patch(`/api/v1/admin/users/${user!.id}/activate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    return user!;
  }

  async function createActivatedProfesor(prefix: string) {
    const unique = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const profesor = {
      username: unique,
      email: `${unique}@example.com`,
      password: 'Password123!',
      cial: `CIAL_${unique}`,
    };

    await request(app.getHttpServer())
      .post('/api/v1/profesores/register')
      .send(profesor)
      .expect(201);

    const user = await activateUserByUsername(profesor.username);

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: profesor.email, password: profesor.password })
      .expect(200);

    return {
      ...profesor,
      userId: user.id,
      token: login.body.data.access_token as string,
    };
  }

  async function createAlumnoForProfesor(input: {
    username: string;
    password: string;
    aula: string;
    numeroClase: number;
    cialProfesor: string;
  }) {
    await request(app.getHttpServer())
      .post('/api/v1/alumnos/register')
      .send(input)
      .expect(201);

    const user = await dataSource.getRepository(Usuario).findOne({
      where: { username: input.username },
    });
    const alumno = await dataSource.getRepository(Alumno).findOne({
      where: { user: { id: user?.id } },
      relations: ['user', 'slot', 'slot.profesor'],
    });

    expect(user).toBeDefined();
    expect(alumno).toBeDefined();

    return {
      user: user!,
      alumno: alumno!,
    };
  }

  it('registra varios profesores, valida activación, login independiente y cambio de contraseña', async () => {
    const uniqueBase = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const profesorA = {
      username: `prof_multi_a_${uniqueBase}`,
      email: `prof_multi_a_${uniqueBase}@example.com`,
      password: 'Password123!',
      cial: `CIAL_MULTI_A_${uniqueBase}`,
    };
    const profesorB = {
      username: `prof_multi_b_${uniqueBase}`,
      email: `prof_multi_b_${uniqueBase}@example.com`,
      password: 'Password123!',
      cial: `CIAL_MULTI_B_${uniqueBase}`,
    };

    await request(app.getHttpServer())
      .post('/api/v1/profesores/register')
      .send(profesorA)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/profesores/register')
      .send(profesorB)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: profesorA.email, password: profesorA.password })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: profesorB.email, password: profesorB.password })
      .expect(400);

    await activateUserByUsername(profesorA.username);
    await activateUserByUsername(profesorB.username);

    const profesorALogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: profesorA.email, password: profesorA.password })
      .expect(200);

    const profesorBLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: profesorB.username, password: profesorB.password })
      .expect(200);

    expect(profesorALogin.body.data.access_token).toBeDefined();
    expect(profesorBLogin.body.data.access_token).toBeDefined();

    await request(app.getHttpServer())
      .patch('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${profesorALogin.body.data.access_token}`)
      .send({
        currentPassword: 'PasswordIncorrecta123!',
        newPassword: 'ProfesorNueva123!',
      })
      .expect(400);

    await request(app.getHttpServer())
      .patch('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${profesorALogin.body.data.access_token}`)
      .send({
        currentPassword: profesorA.password,
        newPassword: 'ProfesorNueva123!',
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: profesorA.email, password: profesorA.password })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: profesorA.email, password: 'ProfesorNueva123!' })
      .expect(200);
  });

  it('registra varios alumnos por profesor, activa sus cuentas, valida login individual y cambio de contraseña', async () => {
    const profesorA = await createActivatedProfesor('prof_group_a');
    const profesorB = await createActivatedProfesor('prof_group_b');

    const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const alumnoA1 = await createAlumnoForProfesor({
      username: `alu_a1_${suffix}`,
      password: 'Password123!',
      aula: 'Aula Grupo A',
      numeroClase: 1,
      cialProfesor: profesorA.cial,
    });
    const alumnoA2 = await createAlumnoForProfesor({
      username: `alu_a2_${suffix}`,
      password: 'Password123!',
      aula: 'Aula Grupo A',
      numeroClase: 2,
      cialProfesor: profesorA.cial,
    });
    const alumnoB1 = await createAlumnoForProfesor({
      username: `alu_b1_${suffix}`,
      password: 'Password123!',
      aula: 'Aula Grupo B',
      numeroClase: 1,
      cialProfesor: profesorB.cial,
    });

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: alumnoA1.user.username, password: 'Password123!' })
      .expect(400);

    await request(app.getHttpServer())
      .patch(`/api/v1/profesores/alumnos/${alumnoA1.alumno.id}/activate`)
      .set('Authorization', `Bearer ${profesorA.token}`)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/v1/profesores/alumnos/${alumnoA2.alumno.id}/activate`)
      .set('Authorization', `Bearer ${profesorA.token}`)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/api/v1/profesores/alumnos/${alumnoB1.alumno.id}/activate`)
      .set('Authorization', `Bearer ${profesorB.token}`)
      .expect(200);

    const profesorAStudents = await request(app.getHttpServer())
      .get('/api/v1/profesores/alumnos')
      .set('Authorization', `Bearer ${profesorA.token}`)
      .expect(200);

    const profesorBStudents = await request(app.getHttpServer())
      .get('/api/v1/profesores/alumnos')
      .set('Authorization', `Bearer ${profesorB.token}`)
      .expect(200);

    expect(profesorAStudents.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ username: alumnoA1.user.username }),
        expect.objectContaining({ username: alumnoA2.user.username }),
      ])
    );
    expect(profesorAStudents.body.data).toHaveLength(2);
    expect(profesorBStudents.body.data).toEqual([
      expect.objectContaining({ username: alumnoB1.user.username }),
    ]);

    const alumnoALogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: alumnoA1.user.username, password: 'Password123!' })
      .expect(200);
    const alumnoA2Login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: alumnoA2.user.username, password: 'Password123!' })
      .expect(200);
    const alumnoBLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: alumnoB1.user.username, password: 'Password123!' })
      .expect(200);

    expect(alumnoALogin.body.data.access_token).toBeDefined();
    expect(alumnoA2Login.body.data.access_token).toBeDefined();
    expect(alumnoBLogin.body.data.access_token).toBeDefined();

    await request(app.getHttpServer())
      .patch('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${alumnoALogin.body.data.access_token}`)
      .send({
        currentPassword: 'Incorrecta123!',
        newPassword: 'AlumnoNueva123!',
      })
      .expect(400);

    await request(app.getHttpServer())
      .patch('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${alumnoALogin.body.data.access_token}`)
      .send({
        currentPassword: 'Password123!',
        newPassword: 'AlumnoNueva123!',
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: alumnoA1.user.username, password: 'Password123!' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: alumnoA1.user.username, password: 'AlumnoNueva123!' })
      .expect(200);
  });
});
