/**
 * @module seeders/receta
 * Direct database seeder that inserts recipe records with ingredients using
 * deterministic data from the recipe template catalog.
 */
import { SeedContext } from './seed-context';
import { Receta } from '../modules/receta/receta.entity/receta.entity';
import { RecetaIngrediente } from '../modules/receta/receta-ingrediente.entity/receta-ingrediente.entity';
import { Producto } from '../modules/producto/producto.entity/producto.entity';
import {
  UnidadIngrediente,
  getTiempoRecetaMinutos,
} from '../modules/receta/enums/receta.enums';
import { SeederI18nHelper } from '../common/helpers/seeder-i18n.helper';
import { deterministicFloat } from './deterministic.seed-data';
import {
  type SeedRecipeIngredientSlot,
  pickSeedRecipeTemplate,
} from './seed-recipes.catalog';
import type { DataSource, Repository } from 'typeorm';

/**
 * Maps a product unit string to its corresponding ingredient unit enum value.
 * Defaults to {@link UnidadIngrediente.PIEZA} for unrecognised unit strings.
 * @param {Producto['unidad']} unidad - The raw unit value from the Producto entity.
 * @returns {UnidadIngrediente} The mapped ingredient unit.
 */
function mapUnidadProducto(unidad: Producto['unidad']): UnidadIngrediente {
  switch (String(unidad).toUpperCase()) {
    case 'G':
      return UnidadIngrediente.GRAMO;
    case 'KG':
      return UnidadIngrediente.KILOGRAMO;
    case 'L':
      return UnidadIngrediente.LITRO;
    case 'ML':
      return UnidadIngrediente.MILILITRO;
    default:
      return UnidadIngrediente.PIEZA;
  }
}

function buildCantidadIngrediente(
  slot: SeedRecipeIngredientSlot,
  unidad: UnidadIngrediente,
  seedIndex: number
): number {
  const variacion = deterministicFloat(
    0.9,
    1.1,
    3,
    seedIndex,
    'receta-cantidad'
  );
  const base = slot.cantidadBase * variacion;

  if (unidad === UnidadIngrediente.PIEZA) {
    return Math.max(1, Math.round(base));
  }

  return Number(base.toFixed(3));
}

const NUM_RECETAS = process.env.NODE_ENV === 'test' ? 2 : 10;

export const runSeeder = async (context: SeedContext) => {
  const dataSource = context.getDataSource() as DataSource;
  const recetaRepo: Repository<Receta> = dataSource.getRepository(Receta);
  const ingredienteRepo: Repository<RecetaIngrediente> =
    dataSource.getRepository(RecetaIngrediente);
  const productoRepo: Repository<Producto> = dataSource.getRepository(Producto);

  const productos = await productoRepo.find();
  if (productos.length === 0) {
    console.warn(SeederI18nHelper.getError('NO_PRODUCTOS'));
    return;
  }

  const productosOrdenados = [...productos].sort((a, b) =>
    a.id.localeCompare(b.id)
  );

  for (let i = 0; i < NUM_RECETAS; i++) {
    const template = pickSeedRecipeTemplate(i);
    const raciones = template.raciones;
    const tamanioRacion = template.tamanioRacion;
    const rendimiento = Number((raciones * tamanioRacion).toFixed(3));

    const receta = recetaRepo.create({
      nombre: template.nombre,
      instrucciones: template.instrucciones.join(' '),
      tiempoEstimadoMinutos: getTiempoRecetaMinutos(template.tiempo),
      dificultad: template.dificultad,
      rendimiento,
      unidadResultado: template.unidadResultado,
      raciones,
      tamanioRacion,
      diasCaducidad: template.diasCaducidad,
      costeUnitarioEstimado: deterministicFloat(1.5, 8.5, 1, i, 'receta-coste'),
    });

    const recetaGuardada = await recetaRepo.save(receta);

    const ingredientes: RecetaIngrediente[] = template.ingredientes.map(
      (slot, index) => {
        const producto =
          productosOrdenados[
            (i * template.ingredientes.length + index) %
              productosOrdenados.length
          ];
        const unidad = mapUnidadProducto(producto.unidad);
        const unidadSeleccionada = slot.unidades.includes(unidad)
          ? unidad
          : slot.unidades[0] || unidad;
        const cantidad = buildCantidadIngrediente(
          slot,
          unidadSeleccionada,
          i + index + 1
        );

        return ingredienteRepo.create({
          receta: recetaGuardada,
          producto,
          cantidad,
          unidad: unidadSeleccionada,
          mermaAplicada: slot.merma,
        });
      }
    );

    await ingredienteRepo.save(ingredientes);
  }

  console.log(SeederI18nHelper.getSeederSuccess('recetas'));
};
