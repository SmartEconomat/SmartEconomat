import {
  RecepcionDraft,
  LineaDraft,
  EstadoVisualProducto,
} from '../../../services/recepcion.types';
import {
  EstadoPedido,
  Pedido,
  PedidoProducto,
  PurchaseBatch,
} from '../../../services/pedido.types';
import { UnidadMedida } from '../../../services/producto.types';

const calculateEstado = (rec: number, ped: number): LineaDraft['estado'] => {
  if (rec === 0) return 'No entregado';
  if (rec === ped) return 'OK';
  if (rec < ped) return 'Parcial';
  return 'Exceso';
};

export const mapPedidoToDraftLines = (pedido: Pedido): LineaDraft[] => {
  const lineas = pedido.pedidoProductos || [];
  if (lineas.length === 0) {
    console.warn(
      `[mapPedidoToDraftLines] El pedido ${pedido.id} no tiene lineas de producto.`
    );
  }

  return lineas.map((pp: PedidoProducto) => ({
    pedidoProductoId: pp.id,
    idProducto: pp.productoProveedor?.producto?.id,
    codigoBarras: pp.productoProveedor?.producto?.codigoBarras,
    nombreProducto: pp.productoProveedor?.producto?.nombre || 'Producto',
    cantidadPedida: Number(pp.cantidad),
    cantidadYaRecibida: Number(
      (pp as unknown as { cantidadRecibida?: number }).cantidadRecibida || 0
    ),
    cantidadAlbaran: '',
    cantidadRecibida: 0,
    isWeighedWithScale: false,
    estadoVisual: EstadoVisualProducto.OPTIMO,
    fechaCaducidad: '',
    observaciones: '',
    estado: calculateEstado(0, Number(pp.cantidad)),
    unidad: pp.productoProveedor?.producto?.unidad || UnidadMedida.UNIDAD,
  }));
};

export const mapPurchaseBatchToRecepcionDraft = (
  batch: PurchaseBatch
): RecepcionDraft => {
  const now = new Date().toISOString();

  return {
    version: 2,
    creadoEn: now,
    modificadoEn: now,
    serverVersion: null,
    serverUpdatedAt: null,
    observaciones: batch.observaciones || '',
    nAlbaran: '',
    pedidosSeleccionados: (batch.pedidos || [])
      .filter((pedido) => pedido.estado !== EstadoPedido.CANCELADO)
      .map((pedido) => ({
        id: pedido.id,
        descripcion: `Pedido ${pedido.id.substring(0, 8)} - ${
          pedido.proveedor?.nombre
        }`,
        proveedor: pedido.proveedor?.nombre || 'Desconocido',
        estadoPedido: pedido.estado,
        lineas: mapPedidoToDraftLines(pedido),
      })),
    productosEspontaneos: [],
    paso: 'ESCANEO_LOTE',
    erroresPorLinea: {},
    enviando: false,
  };
};
