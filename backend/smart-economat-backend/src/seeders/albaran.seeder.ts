import { DataSource } from 'typeorm';
import { Albaran } from '../albaran/albaran.entity';
import { PedidoRecepcion } from './pedido-recepcion.entity';

export const seedAlbaranes = async (dataSource: DataSource) => {
  const albaranRepo = dataSource.getRepository(Albaran);
  const pedidoRecepcionRepo = dataSource.getRepository(PedidoRecepcion);

  const pedidosRecepcion = await pedidoRecepcionRepo.find();

  if (!pedidosRecepcion.length) return;

  const alb1 = await albaranRepo.save({
    n_albaran: 'ALB-2025-001',
    concordancia: true,
  });

  const alb2 = await albaranRepo.save({
    n_albaran: 'ALB-2025-002',
    concordancia: false,
  });

  pedidosRecepcion[0].albaranes = [alb1, alb2];
  await pedidoRecepcionRepo.save(pedidosRecepcion[0]);
};
