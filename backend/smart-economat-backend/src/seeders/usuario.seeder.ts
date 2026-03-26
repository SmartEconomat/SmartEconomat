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

    let adminUser = await manager.findOne(Usuario, {
      where: { username: 'admin' },
    });
    if (!adminUser) {
      adminUser = manager.create(Usuario, {
        nombre: 'Administrador Principal',
        username: 'admin',
        password: defaultPassword,
        email: 'admin@smarteconomat.com',
        rol: rolUsuario.ADMINISTRADOR,
        status: UserStatus.ACTIVE,
        activo: true,
        roles: [getSeedRole(rolUsuario.ADMINISTRADOR)],
        mustChangePassword: false,
        passwordResetToken: null,
        passwordResetExpires: null,
      });
      await manager.save(adminUser);
    } else {
      adminUser.nombre = 'Administrador Principal';
      adminUser.rol = rolUsuario.ADMINISTRADOR;
      adminUser.status = UserStatus.ACTIVE;
      adminUser.activo = true;
      adminUser.roles = [getSeedRole(rolUsuario.ADMINISTRADOR)];
      adminUser.mustChangePassword = false;
      adminUser.password = defaultPassword;
      await manager.save(adminUser);
    }

    let superAdminUser = await manager.findOne(Usuario, {
      where: { username: 'superAdmin' },
    });
    if (!superAdminUser) {
      const superAdminPassword = 'SmartEconomat2026*';
      superAdminUser = manager.create(Usuario, {
        nombre: 'Super Administrador',
        username: 'superAdmin',
        password: superAdminPassword,
        email: 'superadmin@smarteconomat.com',
        rol: rolUsuario.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        activo: true,
        roles: [getSeedRole(rolUsuario.SUPER_ADMIN)],
        mustChangePassword: true,
        passwordResetToken: null,
        passwordResetExpires: null,
      });
      await manager.save(superAdminUser);
    } else {
      superAdminUser.nombre = 'Super Administrador';
      superAdminUser.rol = rolUsuario.SUPER_ADMIN;
      superAdminUser.roles = [getSeedRole(rolUsuario.SUPER_ADMIN)];
      await manager.save(superAdminUser);
    }

    const professorsToCreate = [
      {
        nombre: 'Profesor Uno (Cocina Básica)',
        username: 'profesor1',
        email: 'profesor1@smarteconomat.com',
        cial: 'CIAL-11111',
      },
      {
        nombre: 'Profesora Dos (Pastelería)',
        username: 'profesor2',
        email: 'profesor2@smarteconomat.com',
        cial: 'CIAL-22222',
      },
      {
        nombre: 'Profesor Tres (Teoría Nutricional)',
        username: 'profesor3',
        email: 'profesor3@smarteconomat.com',
        cial: 'CIAL-33333',
      },
      {
        nombre: 'Profesora Cuatro (Corte y Preparación)',
        username: 'profesor4',
        email: 'profesor4@smarteconomat.com',
        cial: 'CIAL-44444',
      },
    ];

    const aulas = [
      'Aula 101 - Informática',
      'Aula 102 - Cocina Práctica',
      'Aula 201 - Nutrición',
      'Taller Múltiple Panadería',
      'Laboratorio Ciencias Alimentarias',
    ];

    for (const profData of professorsToCreate) {
      let profUser = await manager.findOne(Usuario, {
        where: { username: profData.username },
      });
      let profEntity;

      const cialUpper = profData.cial.toUpperCase();

      if (!profUser) {
        profUser = manager.create(Usuario, {
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
        const numSlots = process.env.NODE_ENV === 'test' ? 1 : 5;
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

          const firstName = faker.person.firstName();
          const lastName = faker.person.lastName();
          const username =
            faker.internet.username({ firstName, lastName }).toLowerCase() +
            faker.number.int(999);
          const studentEmail = faker.internet
            .email({ firstName, lastName })
            .toLowerCase();

          const statusValue =
            process.env.NODE_ENV === 'test'
              ? UserStatus.ACTIVE
              : faker.helpers.arrayElement([
                  UserStatus.ACTIVE,
                  UserStatus.INACTIVE,
                ]);
          const studentUser = manager.create(Usuario, {
            nombre: `${firstName} ${lastName}`,
            username,
            password: defaultPassword,
            email: studentEmail,
            rol: rolUsuario.ALUMNO,
            status: statusValue,
            activo: statusValue === UserStatus.ACTIVE,
            roles: [getSeedRole(rolUsuario.ALUMNO)],
            mustChangePassword: faker.datatype.boolean(),
            passwordResetToken: null,
            passwordResetExpires: null,
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
