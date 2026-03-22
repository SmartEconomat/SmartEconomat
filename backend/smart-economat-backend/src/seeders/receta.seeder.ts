import { DataSource } from 'typeorm';
import { Receta } from '../modules/receta/receta.entity/receta.entity';
import { RecetaIngrediente } from '../modules/receta/receta-ingrediente.entity/receta-ingrediente.entity';
import { Producto } from '../modules/producto/producto.entity/producto.entity';
import {
  UnidadIngrediente,
  DificultadReceta,
} from '../modules/receta/enums/receta.enums';
import { SeederI18nHelper } from '../common/helpers/seeder-i18n.helper';

const NUM_RECETAS = process.env.NODE_ENV === 'test' ? 2 : 10;

export const runSeeder = async (dataSource: DataSource) => {
  const { faker } = await import('@faker-js/faker');

  const recetaRepo = dataSource.getRepository(Receta);
  const ingredienteRepo = dataSource.getRepository(RecetaIngrediente);
  const productoRepo = dataSource.getRepository(Producto);

  const productos = await productoRepo.find();
  if (productos.length === 0) {
    throw new Error(SeederI18nHelper.getError('NO_PRODUCTOS'));
  }

  for (let i = 0; i < NUM_RECETAS; i++) {
    const raciones = faker.number.int({ min: 1, max: 8 });
    const tamanioRacion = faker.number.float({
      min: 0.1,
      max: 0.5,
      multipleOf: 0.05,
    });
    const rendimiento = Number((raciones * tamanioRacion).toFixed(3));

    const receta = recetaRepo.create({
      nombre: faker.commerce.productName(),
      instrucciones: faker.lorem.paragraphs(3),
      tiempoEstimadoMinutos: faker.number.int({ min: 15, max: 150 }),
      dificultad: faker.helpers.arrayElement(Object.values(DificultadReceta)),
      rendimiento,
      unidadResultado: faker.helpers.arrayElement([
        UnidadIngrediente.KILOGRAMO,
        UnidadIngrediente.LITRO,
      ]),
      raciones,
      tamanioRacion,
      diasCaducidad: faker.number.int({ min: 2, max: 7 }),
      costeUnitarioEstimado: faker.number.float({
        min: 1.5,
        max: 8.5,
        multipleOf: 0.1,
      }),
    });

    const recetaGuardada = await recetaRepo.save(receta);

    const numIngredientes = faker.number.int({ min: 2, max: 5 });
    const productosAleatorios = faker.helpers.arrayElements(
      productos,
      numIngredientes
    );

    const mapUnidad = (u: any): UnidadIngrediente => {
      const val = String(u).toUpperCase();
      if (val === 'G') return UnidadIngrediente.GRAMO;
      if (val === 'KG') return UnidadIngrediente.KILOGRAMO;
      if (val === 'L') return UnidadIngrediente.LITRO;
      if (val === 'ML') return UnidadIngrediente.MILILITRO;
      return UnidadIngrediente.KILOGRAMO;
    };

    const ingredientes: RecetaIngrediente[] = productosAleatorios.map(
      (producto) => {
        const unidad = mapUnidad(producto.unidad);
        let cantidad = 0;
        if (
          unidad === UnidadIngrediente.GRAMO ||
          unidad === UnidadIngrediente.MILILITRO
        ) {
          cantidad = faker.number.float({ min: 10, max: 100, multipleOf: 1 });
        } else {
          cantidad = faker.number.float({
            min: 0.05,
            max: 0.5,
            multipleOf: 0.01,
          });
        }

        return ingredienteRepo.create({
          receta: recetaGuardada,
          producto,
          cantidad,
          unidad,
          mermaAplicada: faker.number.int({ min: 0, max: 15 }),
        });
      }
    );

    await ingredienteRepo.save(ingredientes);
  }

  console.log(SeederI18nHelper.getSeederSuccess('recetas'));
};
