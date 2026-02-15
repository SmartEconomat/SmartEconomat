import { Incidencia } from '../modules/incidencia/incidencia.entity/incidencia.entity';
import { Recepcion } from '../modules/recepcion/recepcion.entity/recepcion.entity';
import { DataSource } from 'typeorm';
import { SEEDER_MESSAGES } from './constants/messages';

export const runSeeder = async (dataSource: DataSource) => {
  const { faker } = await import('@faker-js/faker');

  const incidenciaRepo = dataSource.getRepository(Incidencia);
  const recepcionRepo = dataSource.getRepository(Recepcion);

  const MAX_INCIDENCIA = 5;

  const recepciones = await recepcionRepo.find();
  if (recepciones.length === 0) {
    throw new Error(SEEDER_MESSAGES.errors.NO_RECEPCIONES);
  }

  const incidencias: Incidencia[] = [];

  for (let i = 0; i < MAX_INCIDENCIA; i++) {
    const recepcion = faker.helpers.arrayElement(recepciones);

    const productos = Array.from({
      length: faker.number.int({ min: 1, max: 5 }),
    }).map(() => {
      const cantidadPedida = faker.number.int({ min: 1, max: 20 });
      const cantidadRecibida = faker.number.int({
        min: 0,
        max: cantidadPedida,
      });

      return {
        idPedidoProducto: faker.string.uuid(),
        cantidadPedida,
        cantidadRecibida,
        diferencia: cantidadRecibida - cantidadPedida,
        observaciones: faker.helpers.maybe(() => faker.lorem.sentence()),
      };
    });

    const incidencia = incidenciaRepo.create({
      recepcion,
      datosOriginales: {
        productos,
        observacionesRecepcion: faker.helpers.maybe(() =>
          faker.lorem.paragraph()
        ),
      },
      observacionesResolucion: faker.helpers.maybe(() =>
        faker.lorem.paragraph()
      ),
    });

    incidencias.push(incidencia);
  }

  await incidenciaRepo.save(incidencias);

  console.log(`Seeder: ${incidencias.length} incidencias creadas`);
};
