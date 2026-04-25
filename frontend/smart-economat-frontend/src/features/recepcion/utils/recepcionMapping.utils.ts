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
import { formatPedidoListNumber } from '../../pedidos/utils/pedidoFormatters';

const calculateEstado = (rec: number, ped: number): LineaDraft['estado'] => {
  if (rec === 0) return 'No entregado';
  if (rec === ped) return 'OK';
  if (rec < ped) return 'Parcial';
  return 'Exceso';
};

/**
 * @description Maps the product lines of a Pedido into RecepcionDraft LineaDraft objects.
 * Initialises all reception quantities to zero and sets the initial estado via calculateEstado.
 * Logs a warning when the pedido has no product lines.
 * @param pedido - The Pedido whose pedidoProductos should be mapped
 * @returns Array of LineaDraft objects ready for use in a RecepcionDraft
 */
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
    intervenida: false,
    estado: calculateEstado(0, Number(pp.cantidad)),
    unidad: pp.productoProveedor?.producto?.unidad || UnidadMedida.UNIDAD,
  }));
};

/**
 * @description Creates a RecepcionDraft from a PurchaseBatch, pre-selecting only the pedidos
 * that are in a receivable state (POR_RECEPCIONAR).
 * @param batch - The PurchaseBatch to convert into a reception draft
 * @returns A fully initialised RecepcionDraft ready to be persisted and resumed in the reception flow
 */
export const mapPurchaseBatchToRecepcionDraft = (
  batch: PurchaseBatch
): RecepcionDraft => {
  const now = new Date().toISOString();
  const receivableStatuses = new Set<string>([EstadoPedido.POR_RECEPCIONAR]);

  return {
    version: 2,
    creadoEn: now,
    modificadoEn: now,
    serverVersion: null,
    serverUpdatedAt: null,
    observaciones: batch.observaciones || '',
    nAlbaran: '',
    pedidosSeleccionados: (batch.pedidos || [])
      .filter((pedido) => receivableStatuses.has(String(pedido.estado)))
      .map((pedido) => ({
        id: pedido.id,
        descripcion: `Pedido ${formatPedidoListNumber(pedido, 'pedido-proveedor')} - ${
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
