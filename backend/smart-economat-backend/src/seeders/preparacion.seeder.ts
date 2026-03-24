import { faker } from '@faker-js/faker';
import { DataSource } from 'typeorm';
import { Preparacion } from '../modules/preparacion/preparacion.entity/preparacion.entity';
import { Receta } from '../modules/receta/receta.entity/receta.entity';
import { Usuario } from '../modules/usuario/usuario.entity/usuario.entity';
import { Ubicacion } from '../modules/ubicacion/ubicacion.entity/ubicacion.entity';
import { PreparacionEstado } from '../modules/preparacion/enums/preparacion.enums';
import { ProduccionLote } from '../modules/receta/produccion-lote.entity/produccion-lote.entity';
import { EstadoLote } from '../modules/receta/enums/receta.enums';
import { SeederI18nHelper } from '../common/helpers/seeder-i18n.helper';

export const runSeeder = async (dataSource: DataSource) => {
  
  const preparacionRepo = dataSource.getRepository(Preparacion);
  const produccionLoteRepo = dataSource.getRepository(ProduccionLote);
  const recetaRepo = dataSource.getRepository(Receta);
  const usuarioRepo = dataSource.getRepository(Usuario);
  const ubicacionRepo = dataSource.getRepository(Ubicacion);

  const recetas = await recetaRepo.find({ take: 50 });
  const usuarios = await usuarioRepo.find({ take: 10 });
  const ubicaciones = await ubicacionRepo.find({ take: 10 });

  if (recetas.length === 0) {
    console.warn('No hay recetas para generar preparaciones. Saltando...');
    return;
  }

  const preparaciones: Preparacion[] = [];
  const numPreparaciones = process.env.NODE_ENV === 'test' ? 5 : 20;

  for (let i = 0; i < numPreparaciones; i++) {
    const receta = faker.helpers.arrayElement(recetas);
    const usuario = faker.helpers.arrayElement(usuarios);
    const ubicacion = faker.helpers.arrayElement(ubicaciones);
    const estado = faker.helpers.arrayElement(Object.values(PreparacionEstado));

    const fechaProg = faker.date.soon({ days: 7 });
    let fechaInicio: Date | null = null;
    let fechaFin: Date | null = null;

    if (estado !== PreparacionEstado.PENDIENTE) {
      fechaInicio = faker.date.between({
        from: fechaProg,
        to: new Date(fechaProg.getTime() + 3600000),
      });
    }
    if (estado === PreparacionEstado.COMPLETADA) {
      fechaFin = faker.date.between({
        from: fechaInicio!,
        to: new Date(fechaInicio!.getTime() + 7200000),
      });
    }

    const prep = preparacionRepo.create({
      receta: receta,
      usuario: usuario,
      ubicacionDestinoId: ubicacion.id,
      cantidadAProducir:
        faker.number.int({ min: 1, max: 10 }) * (receta.rendimiento || 1),
      estado: estado,
      fechaProgramada: fechaProg,
      fechaInicio: fechaInicio,
      fechaFinalizacion: fechaFin,
      observaciones: faker.datatype.boolean()
        ? faker.lorem.sentence()
        : undefined,
    });

    preparaciones.push(prep);
  }

  const savedPreps = await preparacionRepo.save(preparaciones);

  const producciones: ProduccionLote[] = [];
  for (const prep of savedPreps) {
    if (prep.estado === PreparacionEstado.COMPLETADA) {
      const receta = prep.receta;
      const fechaFin = prep.fechaFinalizacion || new Date();

      const racionesReceta = receta?.raciones || 1;
      const porciones =
        receta?.tamanioRacion && receta.tamanioRacion > 0
          ? Number(
              (prep.cantidadAProducir / Number(receta.tamanioRacion)).toFixed(3)
            )
          : Number(
              (
                (prep.cantidadAProducir / (receta?.rendimiento || 1)) *
                racionesReceta
              ).toFixed(3)
            );

      producciones.push(
        produccionLoteRepo.create({
          recetaId: prep.recetaId,
          usuarioId: prep.usuarioId,
          preparacionId: prep.id,
          cantidadProducida: prep.cantidadAProducir,
          fechaProduccion: fechaFin,
          costeTotalReal:
            (Number(receta?.costeUnitarioEstimado) || 0) *
            prep.cantidadAProducir,
          fechaCaducidad: new Date(
            fechaFin.getTime() +
              (receta?.diasCaducidad || 3) * 24 * 60 * 60 * 1000
          ),
          porcionesProducidas: porciones,
          porcionesRestantes: porciones,
          estado: EstadoLote.DISPONIBLE,
        })
      );
    }
  }

  if (producciones.length > 0) {
    await produccionLoteRepo.save(producciones);
  }

  console.log(SeederI18nHelper.getSeederSuccess('preparaciones'));
};
