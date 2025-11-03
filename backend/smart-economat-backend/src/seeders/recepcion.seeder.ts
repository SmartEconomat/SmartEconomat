import { DataSource } from 'typeorm';
import { Recepcion } from './recepcion.entity';
import { PedidoRecepcion } from './pedido-recepcion.entity';

export const seedRecepciones = async (dataSource: DataSource) => {
  const recepcionRepo = dataSource.getRepository(Recepcion);
  const pedidoRecepcionRepo = dataSource.getRepository(PedidoRecepcion);

  const pedidosRecepcion = await pedidoRecepcionRepo.find();

  if (!pedidosRecepcion.length) return;

  await recepcionRepo.save([
    {
      id_pedido_recepcion: pedidosRecepcion[0].id_pedido_recepcion,
      descripcion: 'Recepción de leche entera',
      cantidad: 100,
      unidad: 'litros',
      calidad: 'Excelente',
      observacion: 'Temperatura adecuada y sin fugas',
    },
    {
      id_pedido_recepcion: pedidosRecepcion[0].id_pedido_recepcion,
      descripcion: 'Recepción de harina de trigo',
      cantidad: 80,
      unidad: 'kg',
      calidad: 'Buena',
      observacion: 'Algunos sacos con pequeñas roturas',
    },
  ]);
};
