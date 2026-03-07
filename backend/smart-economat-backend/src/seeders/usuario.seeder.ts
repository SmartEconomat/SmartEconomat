import { DataSource } from 'typeorm';
import { Usuario } from '../modules/usuario/usuario.entity/usuario.entity';
import { Profesor } from '../modules/profesor/profesor.entity/profesor.entity';
import { Alumno } from '../modules/alumno/alumno.entity/alumno.entity';
import { AlumnoSlot } from '../modules/profesor/profesor.entity/alumno-slot.entity';
import { rolUsuario, UserStatus } from '../modules/usuario/enums/usuario.enums';
import { SeederI18nHelper } from '../common/helpers/seeder-i18n.helper';
import * as bcrypt from 'bcrypt';

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
      {
        username: 'profesor3',
        email: 'profesor3@smarteconomat.com',
        cial: 'CIAL-33333',
      },
    ];

    const aulas = ['Aula A', 'Aula B', 'Aula C'];

    for (const profData of professorsToCreate) {
      let profUser = await manager.findOne(Usuario, {
        where: { username: profData.username },
      });
      let profEntity;

      if (!profUser) {
        profUser = manager.create(Usuario, {
          username: profData.username,
          password: defaultPassword,
          email: profData.email,
          rol: rolUsuario.PROFESOR,
          status:
            profData.username === 'profesor1'
              ? UserStatus.ACTIVE
              : UserStatus.INACTIVE,
        });
        await manager.save(profUser);

        profEntity = manager.create(Profesor, {
          user: profUser,
          cial: profData.cial,
        });
        await manager.save(profEntity);
      } else {
        profEntity = await manager.findOne(Profesor, {
          where: { user: { id: profUser.id } },
        });
      }

      if (!profEntity) continue;

      for (const aulaName of aulas) {
        for (let i = 1; i <= 5; i++) {
          const numeroClase = i;

          let slot = await manager.findOne(AlumnoSlot, {
            where: {
              profesor: { id: profEntity.id },
              aula: aulaName,
              numeroClase,
            },
            relations: ['alumno'],
          });

          if (!slot) {
            slot = manager.create(AlumnoSlot, {
              profesor: profEntity,
              aula: aulaName,
              numeroClase,
            });
            await manager.save(slot);
          }

          if (slot.alumno) continue;

          const firstName = faker.person.firstName();
          const lastName = faker.person.lastName();
          const username =
            faker.internet.username({ firstName, lastName }).toLowerCase() +
            faker.number.int(999);
          const studentUser = manager.create(Usuario, {
            username,
            password: defaultPassword,
            rol: rolUsuario.ALUMNO,
            status: UserStatus.INACTIVE,
          });
          await manager.save(studentUser);

          const alumnoEntity = manager.create(Alumno, {
            user: studentUser,
            slot: slot,
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
