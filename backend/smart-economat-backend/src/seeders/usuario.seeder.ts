import { DataSource } from 'typeorm';
import { Usuario } from '../modules/usuario/usuario.entity/usuario.entity';
import { Profesor } from '../modules/profesor/profesor.entity/profesor.entity';
import { Alumno } from '../modules/alumno/alumno.entity/alumno.entity';
import { AlumnoSlot } from '../modules/profesor/profesor.entity/alumno-slot.entity';
import { rolUsuario, UserStatus } from '../modules/usuario/enums/usuario.enums';
import { SeederI18nHelper } from '../common/helpers/seeder-i18n.helper';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';

export const runSeeder = async (dataSource: DataSource) => {
  const { faker } = await import('@faker-js/faker');

  await dataSource.transaction(async (manager) => {
    const defaultPassword = await bcrypt.hash('SmartEconomat2026!', 10);

    let adminUser = await manager.findOne(Usuario, {
      where: { username: 'admin' },
    });
    if (!adminUser) {
      adminUser = manager.create(Usuario, {
        username: 'admin',
        password: defaultPassword,
        email: 'admin@smarteconomat.com',
        rol: rolUsuario.ADMINISTRADOR,
        status: UserStatus.ACTIVE,
      });
      await manager.save(adminUser);
    }

    const professorsToCreate = [
      {
        username: 'profesor1',
        email: 'profesor1@smarteconomat.com',
        cial: 'CIAL-11111',
      },
      {
        username: 'profesor2',
        email: 'profesor2@smarteconomat.com',
        cial: 'CIAL-22222',
      },
    ];
    if (process.env.NODE_ENV !== 'test') {
      professorsToCreate.push({
        username: 'profesor3',
        email: 'profesor3@smarteconomat.com',
        cial: 'CIAL-33333',
      });
    }

    const aulas =
      process.env.NODE_ENV === 'test' ? ['Aula A'] : ['Aula B', 'Aula C'];

    for (const profData of professorsToCreate) {
      let profUser = await manager.findOne(Usuario, {
        where: { username: profData.username },
      });
      let profEntity;

      const cialUpper = profData.cial.toUpperCase();

      if (!profUser) {
        profUser = manager.create(Usuario, {
          username: profData.username,
          password: defaultPassword,
          email: profData.email,
          rol: rolUsuario.PROFESOR,
          status: UserStatus.ACTIVE,
          activo: true,
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
            username,
            password: defaultPassword,
            email: studentEmail,
            rol: rolUsuario.ALUMNO,
            status: statusValue,
            activo: statusValue === UserStatus.ACTIVE,
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

    console.log(
      SeederI18nHelper.getSeederSuccess(
        'usuarios, profesores, aulas y alumnos detallados'
      )
    );
  });
};
