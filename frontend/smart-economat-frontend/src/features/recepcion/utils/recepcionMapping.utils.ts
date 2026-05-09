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
 * Mapea pedido to draft lines al formato de dominio esperado.
 *
 * @param pedido Parámetro de entrada para la operación.
 * @returns Valor resultante de la operación.
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
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Expone "mapPurchaseBatchToRecepcionDraft" en smart-economat-frontend (SPA).
 * @undefined {PurchaseBatch} batch - Entrada efectiva esperada por el contrato.
 * @undefined {RecepcionDraft} Datos efectivos después de ejecutar la operación.
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
