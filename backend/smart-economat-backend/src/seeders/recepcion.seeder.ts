import { DataSource } from 'typeorm';
import { Recepcion } from 'src/modules/recepcion/recepcion.entity/recepcion.entity';
import { PedidoRecepcion } from 'src/modules/pedidos/pedido-recepcion.entity/pedido-recepcion.entity';

export const seedRecepciones = async (dataSource: DataSource) => {
  const recepcionRepo = dataSource.getRepository(Recepcion);
  const pedidoRecepcionRepo = dataSource.getRepository(PedidoRecepcion);

  const pedidosRecepcion = await pedidoRecepcionRepo.find();

  if (!pedidosRecepcion.length) {
    console.warn('No hay pedidos de recepción para asociar recepciones.');
    return;
  }

  const ejemplos = [
    {
      descripcion: 'Manzanas',
      cantidad: 50,
      unidad: 'kg',
      calidad: 'Excelente',
      observacion: 'Frescas y bien empaquetadas',
    },
    {
      descripcion: 'Leche',
      cantidad: 200,
      unidad: 'litros',
      calidad: 'Buena',
      observacion: 'Refrigerada correctamente',
    },
    {
      descripcion: 'Huevos',
      cantidad: 300,
      unidad: 'unidades',
      calidad: 'Regular',
      observacion: 'Algunos con cáscara rota',
    },
    {
      descripcion: 'Pan',
      cantidad: 100,
      unidad: 'unidades',
      calidad: 'Excelente',
      observacion: 'Recién horneado',
    },
    {
      descripcion: 'Aceite de oliva',
      cantidad: 75,
      unidad: 'litros',
      calidad: 'Buena',
      observacion: 'Botellas sin fugas',
    },
  ];

  const recepciones = ejemplos.map((data) =>
    recepcionRepo.create({
      ...data,
      pedidoRecepcion: pedidosRecepcion[0],
    })
  );

  await recepcionRepo.save(recepciones);
  console.log('Seeder de recepciones ejecutado correctamente.');
};
