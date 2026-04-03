import { Usuario } from '../modules/usuario/usuario.entity/usuario.entity';
import { Profesor } from '../modules/profesor/profesor.entity/profesor.entity';
import { Alumno } from '../modules/alumno/alumno.entity/alumno.entity';
import { AlumnoSlot } from '../modules/profesor/profesor.entity/alumno-slot.entity';
import { Rol } from '../modules/roles/rol.entity/rol.entity';
import { rolUsuario, UserStatus } from '../modules/usuario/enums/usuario.enums';
import { SeederI18nHelper } from '../common/helpers/seeder-i18n.helper';
import { SeedContext } from './seed-context';
import { randomBytes } from 'node:crypto';
import { faker } from '@faker-js/faker';

export const runSeeder = async (context: SeedContext) => {
  const dataSource = context.getDataSource();
  await dataSource.transaction(async (manager) => {
    const defaultPassword = 'SmartEconomat2026!';
    const rolesRepo = manager.getRepository(Rol);

    const rolesByName = new Map(
      (
        await rolesRepo.find({
          where: [
            { nombre: 'SUPER_ADMIN' },
            { nombre: rolUsuario.ADMINISTRADOR },
            { nombre: rolUsuario.PROFESOR },
            { nombre: rolUsuario.ALUMNO },
          ],
        })
      ).map((role) => [role.nombre, role])
    );

    const getSeedRole = (roleName: string) => {
      const role = rolesByName.get(roleName);
      if (!role) {
        throw new Error(
          `No existe el rol dinámico "${roleName}". Ejecuta primero roles-permisos.seeder.ts`
        );
      }
      return role;
    };

    const TEST_UUIDS = {
      ADMIN: '019d4bf6-248f-757c-9e06-177233b26101',
      SUPER_ADMIN: '019d4bf6-248f-757c-9e06-177233b26102',
      PROFESOR1: '019d4bf6-248f-757c-9e06-177233b26103',
      PROFESOR2: '019d4bf6-248f-757c-9e06-177233b26104',
      PROFESOR3: '019d4bf6-248f-757c-9e06-177233b26105',
    };

    const isTest = process.env.NODE_ENV === 'test';

    let adminUser = await manager.findOne(Usuario, {
      where: { username: 'admin' },
    });
    if (!adminUser) {
      adminUser = manager.create(Usuario, {
        id: isTest ? TEST_UUIDS.ADMIN : undefined,
        nombre: 'Administrador Principal',
        username: 'admin',
        password: defaultPassword,
        email: 'admin@smarteconomat.com',
        rol: rolUsuario.ADMINISTRADOR,
        status: UserStatus.ACTIVE,
        activo: true,
        roles: [getSeedRole(rolUsuario.ADMINISTRADOR)],
        mustChangePassword: false,
      });
      await manager.save(adminUser);
    }

    let superAdminUser = await manager.findOne(Usuario, {
      where: { username: 'superAdmin' },
    });
    if (!superAdminUser) {
      const superAdminPassword = 'SmartEconomat2026*';
      superAdminUser = manager.create(Usuario, {
        id: isTest ? TEST_UUIDS.SUPER_ADMIN : undefined,
        nombre: 'Super Administrador',
        username: 'superAdmin',
        password: superAdminPassword,
        email: 'superadmin@smarteconomat.com',
        rol: rolUsuario.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        activo: true,
        roles: [getSeedRole(rolUsuario.SUPER_ADMIN)],
        mustChangePassword: true,
      });
      await manager.save(superAdminUser);
    }

    const professorsToCreate = [
      {
        id: isTest ? TEST_UUIDS.PROFESOR1 : undefined,
        nombre: 'Profesor Uno (Cocina Básica)',
        username: 'profesor1',
        email: 'profesor1@smarteconomat.com',
        cial: 'CIAL-11111',
      },
      {
        id: isTest ? TEST_UUIDS.PROFESOR2 : undefined,
        nombre: 'Profesora Dos (Pastelería)',
        username: 'profesor2',
        email: 'profesor2@smarteconomat.com',
        cial: 'CIAL-22222',
      },
      {
        id: isTest ? TEST_UUIDS.PROFESOR3 : undefined,
        nombre: 'Profesor Tres (Teoría Nutricional)',
        username: 'profesor3',
        email: 'profesor3@smarteconomat.com',
        cial: 'CIAL-33333',
      },
    ];

    const aulas = [
      'Aula 101 - Informática',
      'Aula 102 - Cocina Práctica',
      'Aula 201 - Nutrición',
    ];

    for (const profData of professorsToCreate) {
      let profUser = await manager.findOne(Usuario, {
        where: { username: profData.username },
      });
      let profEntity;

      const cialUpper = profData.cial.toUpperCase();

      if (!profUser) {
        profUser = manager.create(Usuario, {
          id: profData.id,
          nombre: profData.nombre,
          username: profData.username,
          password: defaultPassword,
          email: profData.email,
          rol: rolUsuario.PROFESOR,
          status: UserStatus.ACTIVE,
          activo: true,
          roles: [getSeedRole(rolUsuario.PROFESOR)],
          mustChangePassword: false,
        });
        await manager.save(profUser);

        profEntity = manager.create(Profesor, {
          user: profUser,
          cial: cialUpper,
        });
        await manager.save(profEntity);
      } else {
        profEntity = await manager.findOne(Profesor, {
          where: { user: { id: profUser.id } },
        });
        profUser.rol = rolUsuario.PROFESOR;
        profUser.status = UserStatus.ACTIVE;
        profUser.activo = true;
        profUser.roles = [getSeedRole(rolUsuario.PROFESOR)];
        await manager.save(profUser);
      }

      if (!profEntity) continue;

      for (const aulaName of aulas) {
        const isTest = process.env.NODE_ENV === 'test';
        const numSlots = isTest ? 1 : 5;
        for (let i = 1; i <= numSlots; i++) {
          const numeroClase = i;

          let slot = await manager.findOne(AlumnoSlot, {
            where: {
              profesor: { id: profEntity.id },
              aula: aulaName,
              numeroClase,
            },
            relations: ['alumnos'],
          });

          if (!slot) {
            slot = manager.create(AlumnoSlot, {
              profesor: profEntity,
              aula: aulaName,
              numeroClase,
              capacidad: 30,
              codigoSlot: `AL-${randomBytes(3).toString('hex').toUpperCase()}`,
            });
            await manager.save(slot);
          }

          if (slot.alumnos && slot.alumnos.length > 0) continue;

          let firstName, lastName, username, studentEmail, statusValue;

          if (isTest) {
            firstName = 'AlumnoTest';
            lastName = `${profData.username}_${i}`;
            username = `alumno_test_${profData.username}_${i}`.toLowerCase();
            studentEmail = `${username}@smarteconomat.com`;
            statusValue = UserStatus.ACTIVE;
          } else {
            firstName = faker.person.firstName();
            lastName = faker.person.lastName();
            username =
              faker.internet.username({ firstName, lastName }).toLowerCase() +
              faker.number.int(999);
            studentEmail = faker.internet
              .email({ firstName, lastName })
              .toLowerCase();
            statusValue = faker.helpers.arrayElement([
              UserStatus.ACTIVE,
              UserStatus.INACTIVE,
            ]);
          }

          const existingStudent = await manager.findOne(Usuario, {
            where: { username },
          });

          if (existingStudent) continue;

          const studentUser = manager.create(Usuario, {
            nombre: `${firstName} ${lastName}`,
            username,
            password: defaultPassword,
            email: studentEmail,
            rol: rolUsuario.ALUMNO,
            status: statusValue,
            activo: statusValue === UserStatus.ACTIVE,
            roles: [getSeedRole(rolUsuario.ALUMNO)],
            mustChangePassword: !isTest && faker.datatype.boolean(),
          });
          await manager.save(studentUser);

          const alumnoEntity = manager.create(Alumno, {
            user: studentUser,
            slot: slot,
            profesor: profEntity,
          });
          await manager.save(alumnoEntity);
        }
      }
    }

    console.log(SeederI18nHelper.getSeederSuccess('usuarios'));
  });
};
