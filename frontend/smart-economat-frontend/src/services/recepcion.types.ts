import { ProductoNuevoDto } from './producto.types';

export enum EstadoRecepcion {
  PENDIENTE = 'PENDIENTE',
  EN_PROCESO = 'EN_PROCESO',
  PARCIAL = 'PARCIAL',
  COMPLETADA = 'COMPLETADA',
  CON_INCIDENCIAS = 'CON_INCIDENCIAS',
  CANCELADA = 'CANCELADA',
}

export enum EstadoVisualProducto {
  OPTIMO = 'OPTIMO',
  ROTO = 'ROTO',
  DEFECTUOSO = 'DEFECTUOSO',
}

export type PasoWizard =
  | 'SELECCION_PEDIDOS'
  | 'ESCANEO_LOTE'
  | 'REVISION_FINAL'
  | 'RESULTADO';

export interface RecepcionLineDto {
  pedidoProductoId: string;
  cantidadRecibida: number;
  cantidadAlbaran?: number;
  estadoVisual: EstadoVisualProducto;
  fechaCaducidad?: Date;
  observaciones?: string;
  isWeighedWithScale?: boolean;
}

export interface ProductoNuevoRecepcionDto extends ProductoNuevoDto {
  cantidadRecibida: number;
  cantidadAlbaran?: number;
  observaciones?: string;
  isWeighedWithScale?: boolean;
}

export interface PedidoRecepcionDto {
  pedidoId: string;
  nAlbaran?: string;
  observaciones?: string;
}

export interface CreateRecepcionDto {
  pedidos?: PedidoRecepcionDto[];
  pedidoIds?: string[];
  nAlbaran?: string;
  fechaRecepcion?: string;
  observaciones?: string;
  productos: RecepcionLineDto[];
  productosNuevos?: ProductoNuevoRecepcionDto[];
  usuarioId?: string;
}

// ==========================================
// Tipos para el Wizard del Frontend (Draft)
// ==========================================

export interface LineaDraft {
  pedidoProductoId: string | null; // null si es producto espontáneo
  idProducto?: string;
  codigoBarras?: string;
  nombreProducto: string;
  unidad: string;
  cantidadPedida: number; // 0 si no venía en ningún pedido

  // ── Producto nuevo (pendiente de crear en BD) ──────
  productoNuevo?: {
    pendienteCreacion: true;
    codigoBarras: string;
    nombre: string;
    marca?: string;
    unidad: string;
    tipo: string;
    contenido: number;
    cantidadRecibida: number;
    observaciones?: string;
    isWeighedWithScale?: boolean;
  };

  // ── Campos editables ───────────────────────────────
  cantidadAlbaran: number | '';
  cantidadRecibida: number | '';
  isWeighedWithScale: boolean;
  estadoVisual: EstadoVisualProducto;
  fechaCaducidad?: string; // Formato YYYY-MM-DD
  observaciones: string;

  // ── Estado visual ──────────────────────────────────
  estado:
    | 'escaneado'
    | 'sin_rellenar'
    | 'valida'
    | 'error'
    | 'parcial'
    | 'rechazada'
    | 'exceso'
    | 'OK'
    | 'Parcial'
    | 'Exceso'
    | 'No entregado'
    | 'Nuevo';
}

export interface PedidoDraft {
  id: string;
  descripcion: string;
  proveedor: string;
  lineas: LineaDraft[];
  nAlbaran?: string;
  observaciones?: string;
}

export interface RecepcionDraft {
  // ── Meta ───────────────────────────────────────────
  version: number;
  creadoEn: string;
  modificadoEn: string;
  serverVersion?: number | null;
  serverUpdatedAt?: string | null;

  // ── Cabecera ───────────────────────────────────────
  observaciones: string;
  nAlbaran: string;

  // ── Pedidos vinculados (≥1) ────────────────────────
  pedidosSeleccionados: PedidoDraft[];

  // ── Productos escaneados sin pedido previo ─────────
  productosEspontaneos: LineaDraft[];

  // ── Control de UI ──────────────────────────────────
  paso: PasoWizard;
  erroresPorLinea: Record<string, string[]>;
  enviando: boolean;
}

export interface RecepcionDraftEnvelope {
  id?: string;
  version: number;
  source: 'redis' | 'database';
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  payload: RecepcionDraft;
}

// ==========================================
// Tipos del Resultado Enriquecido
// ==========================================

export interface IncidenciaGeneradaDto {
  id: string;
  estado: string;
  datosOriginales: {
    productos: {
      idPedidoProducto: string;
      nombreProducto: string;
      cantidadPedida: number;
      cantidadRecibida: number;
      diferencia: number;
      tipo: 'FALTA' | 'EXCESO' | 'NO_ENTREGADO';
    }[];
  };
}

export interface PedidoActualizadoDto {
  id: string;
  estadoAnterior: string;
  estadoNuevo: string;
}

export interface ProductoCreadoDto {
  id: string;
  nombre: string;
  codigoBarras: string;
}

export interface RecepcionResultado {
  id: string;
  fechaRecepcion: string;
  incidencias: IncidenciaGeneradaDto[];
  pedidosActualizados: PedidoActualizadoDto[];
  movimientosGenerados: number;
  inventariosCreados: number;
  productosCreados: ProductoCreadoDto[];
}
