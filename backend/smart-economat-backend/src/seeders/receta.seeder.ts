import { DataSource } from 'typeorm';
import { Receta } from '../modules/receta/receta.entity/receta.entity';
import { RecetaIngrediente } from '../modules/receta/receta-ingrediente.entity/receta-ingrediente.entity';
import { Producto } from '../modules/producto/producto.entity/producto.entity';
import {
  UnidadIngrediente,
  DificultadReceta,
  TiempoReceta,
} from '../modules/receta/enums/receta.enums';
import { SeederI18nHelper } from '../common/helpers/seeder-i18n.helper';

const NUM_RECETAS = 10;

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
    const receta = recetaRepo.create({
      nombre: faker.commerce.productName(),
      instrucciones: faker.lorem.paragraphs(2).slice(0, 2000),
      tiempo: faker.helpers.arrayElement(Object.values(TiempoReceta)),
      dificultad: faker.helpers.arrayElement(Object.values(DificultadReceta)),
      tiempoPreparacion: `${faker.number.int({ min: 10, max: 60 })} min`,
    });

    const recetaGuardada = await recetaRepo.save(receta);

    const numIngredientes = faker.number.int({ min: 2, max: 5 });
    const productosAleatorios = faker.helpers.arrayElements(
      productos,
      numIngredientes
    );

    const ingredientes: RecetaIngrediente[] = productosAleatorios.map(
      (producto) =>
        ingredienteRepo.create({
          receta: recetaGuardada,
          producto,
          cantidad: faker.number.float({ min: 50, max: 500, multipleOf: 0.5 }),
          unidad: faker.helpers.arrayElement(Object.values(UnidadIngrediente)),
        })
    );

    await ingredienteRepo.save(ingredientes);
  }

  console.log(SeederI18nHelper.getSeederSuccess('recetas'));
};
