import { Pedido } from './pedido.types';
import { ProductoNuevoDto } from './producto.types';

export enum EstadoRecepcion {
  PENDIENTE = 'PENDIENTE',
  EN_PROCESO = 'EN_PROCESO',
  PARCIAL = 'PARCIAL',
  COMPLETADA = 'COMPLETADA',
  CON_INCIDENCIAS = 'CON_INCIDENCIAS',
  CANCELADA = 'CANCELADA',
}

export type PasoWizard =
  | 'SELECCION_PEDIDOS'
  | 'ESCANEO_LOTE'
  | 'REVISION_FINAL'
  | 'RESULTADO';

export interface RecepcionLineDto {
    pedidoProductoId: string; 
    cantidadRecibida: number;  
    observaciones?: string;    
}

export interface ProductoNuevoRecepcionDto extends ProductoNuevoDto {
    cantidadRecibida: number;
    observaciones?: string;
}

export interface CreateRecepcionDto {
    pedidoIds: string[];
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
  pedidoProductoId: string | null;  // null si es producto espontáneo
  idProducto?: string;
  codigoBarras?: string;
  nombreProducto: string;
  unidad: string;
  cantidadPedida: number;           // 0 si no venía en ningún pedido

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
  };

  // ── Campos editables ───────────────────────────────
  cantidadRecibida: number | '';
  observaciones: string;

  // ── Estado visual ──────────────────────────────────
  estado: 'escaneado' | 'sin_rellenar' | 'valida' | 'error' | 'parcial' | 'rechazada' | 'exceso' | '✅ OK' | '⚠️ Parcial' | '🔵 Exceso' | '❌ No entregado' | '🆕 Nuevo';
}

export interface PedidoDraft {
  id: string;
  descripcion: string;
  proveedor: string;
  lineas: LineaDraft[];
}

export interface RecepcionDraft {
  // ── Meta ───────────────────────────────────────────
  version: number;            
  creadoEn: string;           
  modificadoEn: string;       

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
