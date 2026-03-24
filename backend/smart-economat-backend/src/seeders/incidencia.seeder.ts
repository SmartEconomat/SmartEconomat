import { SeedContext } from './seed-context';
import { faker } from '@faker-js/faker';
import { Incidencia } from '../modules/incidencia/incidencia.entity/incidencia.entity';
import { RecepcionPedido } from '../modules/recepcion/recepcion-pedido.entity/recepcion-pedido.entity';
import {
  IncidenciaLinea,
  TipoDiferencia,
  EstadoReclamacion,
} from '../modules/incidencia/incidencia-linea.entity/incidencia-linea.entity';
import { SeederI18nHelper } from '../common/helpers/seeder-i18n.helper';

export const runSeeder = async (context: SeedContext) => {
  const dataSource = context.getDataSource();
  const incidenciaRepo = dataSource.getRepository(Incidencia);
  const incidenciaLineaRepo = dataSource.getRepository(IncidenciaLinea);
  const recepcionPedidoRepo = dataSource.getRepository(RecepcionPedido);

  const MAX_INCIDENCIA = process.env.NODE_ENV === 'test' ? 1 : 5;

  const recepcionPedidos = await recepcionPedidoRepo.find({
    relations: ['recepcion', 'pedido', 'pedido.pedidoProductos'],
  });

  if (recepcionPedidos.length === 0) {
    console.warn(SeederI18nHelper.getError('NO_RECEPCIONES'));
    return;
  }

  const incidencias: Incidencia[] = [];

  for (let i = 0; i < Math.min(MAX_INCIDENCIA, recepcionPedidos.length); i++) {
    const rp = recepcionPedidos[i];

    const ppArr = rp.pedido.pedidoProductos as any[];
    if (!ppArr || ppArr.length === 0) continue;

    const numDiffs = faker.number.int({ min: 1, max: ppArr.length });
    const ppsToDiff = faker.helpers.arrayElements(ppArr, numDiffs);

    const lineas = ppsToDiff.map((pp) => {
      const cantidadEsperada = Number(pp.cantidad);
      const cantidadRecibida = faker.number.int({
        min: 0,
        max: cantidadEsperada - 1,
      });

      return incidenciaLineaRepo.create({
        pedidoProducto: pp,
        cantidadEsperada,
        cantidadRecibida,
        diferencia: cantidadRecibida - cantidadEsperada,
        tipoDiferencia: TipoDiferencia.FALTANTE,
        estadoReclamacion: EstadoReclamacion.PENDIENTE,
        observaciones: faker.helpers.maybe(() => faker.lorem.sentence()),
      });
    });

    const incidencia = incidenciaRepo.create({
      recepcion: rp.recepcion,
      pedido: rp.pedido,
      observacionesRecepcion: faker.helpers.maybe(() =>
        faker.lorem.paragraph()
      ),
      observacionesResolucion: faker.helpers.maybe(() =>
        faker.lorem.paragraph()
      ),
      lineas: lineas,
    });

    incidencias.push(incidencia);
  }

  await incidenciaRepo.save(incidencias);

  console.log(
    SeederI18nHelper.getSeederSuccess('incidencias', {
      count: incidencias.length,
    })
  );
};
