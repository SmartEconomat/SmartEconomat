import { ProductoAlergeno } from './producto.types';

export enum DificultadReceta {
  FACIL = 'Fácil',
  MEDIA = 'Media',
  DIFICIL = 'Difícil',
}

export enum TiempoReceta {
  MIN_10 = '10 min',
  MIN_20 = '20 min',
  MIN_30 = '30 min',
  MIN_45 = '45 min',
  MIN_60 = '60 min',
}

export enum UnidadIngrediente {
  GRAMO = 'g',
  KILOGRAMO = 'kg',
  LITRO = 'l',
  MILILITRO = 'ml',
  PIEZA = 'pieza',
  CUCHARADA = 'cda',
  CUCHARADITA = 'cdta',
}

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

export interface RecetaIngredientePayload {
  productoId: string;
  cantidad: number;
  unidad: UnidadIngrediente;
  mermaAplicada?: number;
  proveedorFavoritoId?: string;
}

export interface Receta {
  id: string;
  nombre: string;
  instrucciones: string;
        /**
     * Documentación en español.
     */
  tiempo?: TiempoReceta;
        /**
     * Documentación en español.
     */
  tiempoPreparacion?: string;
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

export type RecetaPayload = Omit<Partial<Receta>, 'ingredientes'> & {
  ingredientes?: RecetaIngredientePayload[];
};
