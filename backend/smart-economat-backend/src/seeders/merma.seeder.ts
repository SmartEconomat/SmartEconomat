/**
 * @module seeders/merma
 * Direct database seeder that inserts waste (merma) records using deterministic data.
 */
import { SeedContext } from './seed-context';
import { SeederI18nHelper } from '../common/helpers/seeder-i18n.helper';
import { Merma } from '../modules/merma/merma.entity/merma.entity';
import { MotivoMerma } from '../modules/merma/enums/merma.enums';
import { Producto } from '../modules/producto/producto.entity/producto.entity';
import { Usuario } from '../modules/usuario/usuario.entity/usuario.entity';
import {
  DETERMINISTIC_SHORT_NOTES,
  deterministicBool,
  deterministicFloat,
  pickDeterministic,
} from './deterministic.seed-data';

const NUM_MERMAS = process.env.NODE_ENV === 'test' ? 3 : 20;

/**
 * Seeds merma (waste) records directly into the database using deterministic data.
 * Picks products and optionally associates a user with each waste entry.
 * @param {SeedContext} context - The active seed context providing repository access.
 * @returns {Promise<void>}
 * @example
 * await runSeeder(context);
 */
export const runSeeder = async (context: SeedContext) => {
  const dataSource = context.getDataSource();
  const mermaRepo = dataSource.getRepository(Merma);
  const productoRepo = dataSource.getRepository(Producto);
  const usuarioRepo = dataSource.getRepository(Usuario);

  const productos = await productoRepo.find();
  const usuarios = await usuarioRepo.find();

  if (productos.length === 0) {
    console.warn(SeederI18nHelper.getError('NO_PRODUCTOS'));
    return;
  }

  const motivos = Object.values(MotivoMerma);
  const productosOrdenados = [...productos].sort((a, b) =>
    a.id.localeCompare(b.id)
  );
  const usuariosOrdenados = [...usuarios].sort((a, b) =>
    a.id.localeCompare(b.id)
  );
  const mermas: Merma[] = [];

  for (let i = 0; i < NUM_MERMAS; i++) {
    const producto = pickDeterministic(productosOrdenados, i, 'merma-producto');
    const usuario =
      usuariosOrdenados.length > 0 && deterministicBool(i, 'merma-usuario')
        ? pickDeterministic(usuariosOrdenados, i, 'merma-usuario-pick')
        : undefined;

    const merma = mermaRepo.create({
      producto,
      usuario,
      cantidad: deterministicFloat(0.1, 50, 3, i, 'merma-cantidad'),
      motivo: pickDeterministic(motivos, i, 'merma-motivo'),
      notas: deterministicBool(i, 'merma-nota')
        ? pickDeterministic(DETERMINISTIC_SHORT_NOTES, i, 'merma-nota-texto')
        : undefined,
    });

    mermas.push(merma);
  }

  await mermaRepo.save(mermas);

  console.log(
    SeederI18nHelper.getSeederSuccess('mermas', { count: mermas.length })
  );
};
