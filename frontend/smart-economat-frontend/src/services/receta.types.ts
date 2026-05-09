import { ProductoAlergeno } from './producto.types';

/** Catálogo de valores enumerados (DificultadReceta) dentro de smart-economat-frontend (SPA). */
export enum DificultadReceta {
  FACIL = 'Fácil',
  MEDIA = 'Media',
  DIFICIL = 'Difícil',
}

/** Catálogo de valores enumerados (UnidadIngrediente) dentro de smart-economat-frontend (SPA). */
export enum UnidadIngrediente {
  GRAMO = 'g',
  KILOGRAMO = 'kg',
  LITRO = 'l',
  MILILITRO = 'ml',
  PIEZA = 'pieza',
  CUCHARADA = 'cda',
  CUCHARADITA = 'cdta',
}

/** Contrato de tipos público (RecetaIngrediente). Contexto: smart-economat-frontend (SPA). */
export interface RecetaIngrediente {
  id: string;
  productoId?: string;
  cantidad: number;
  unidad: UnidadIngrediente;
  mermaAplicada?: number;
  proveedorFavoritoId?: string;
  proveedorFavorito?: {
    id: string;
    nombre: string;
  } | null;
  producto?: {
    id: string;
    nombre: string;
    alergenos?: ProductoAlergeno[];
  } | null;
}

/** Contrato de tipos público (RecetaIngredientePayload). Contexto: smart-economat-frontend (SPA). */
export interface RecetaIngredientePayload {
  productoId: string;
  cantidad: number;
  unidad: UnidadIngrediente;
  mermaAplicada?: number;
  proveedorFavoritoId?: string;
}

/** Contrato de tipos público (RecetaPreviewCostPayload). Contexto: smart-economat-frontend (SPA). */
export interface RecetaPreviewCostPayload {
  ingredientes: RecetaIngredientePayload[];
  rendimiento?: number;
}

/** Contrato de tipos público (RecetaCostBreakdown). Contexto: smart-economat-frontend (SPA). */
export interface RecetaCostBreakdown {
  productoId: string;
  productoNombre: string;
  cantidad: number;
  cantidadReal: number;
  unidad: UnidadIngrediente;
  precioUnitario: number;
  costoIngrediente: number;
}

/** Contrato de tipos público (RecetaCostResponse). Contexto: smart-economat-frontend (SPA). */
export interface RecetaCostResponse {
  recetaId: string;
  recetaNombre: string;
  costoTotal: number;
  costoUnitarioEstimado?: number;
  desglosePorIngrediente: RecetaCostBreakdown[];
}

/** Contrato de tipos público (Receta). Contexto: smart-economat-frontend (SPA). */
export interface Receta {
  id: string;
  nombre: string;
  instrucciones: string;
  tiempoEstimadoMinutos: number;
  dificultad: DificultadReceta;
  rendimiento?: number;
  unidadResultado?: UnidadIngrediente;
  diasCaducidad?: number;
  costeUnitarioEstimado?: number;
  pathImg?: string;
  pathImgOptimized?: string;
  ingredientes?: RecetaIngrediente[];
  raciones?: number;
  tamanioRacion?: number;
}

/** Alias público (RecetaPayload) para simplificar payloads o props en smart-economat-frontend (SPA). */
export type RecetaPayload = Omit<Partial<Receta>, 'ingredientes'> & {
  ingredientes?: RecetaIngredientePayload[];
};
