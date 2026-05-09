/** Catálogo de valores enumerados (CategoriaProducto) dentro de smart-economat-frontend (SPA). */
export enum CategoriaProducto {
  VERDURA = 'verdura',
  FRUTA = 'fruta',
  CARNE = 'carne',
  PESCADO = 'pescado',
  MARISCO = 'marisco',
  LACTEO = 'lacteo',
  HUEVO = 'huevo',
  CEREAL = 'cereal',
  LEGUMBRE = 'legumbre',
  FRUTO_SECO = 'fruto_seco',
  CONDIMENTO = 'condimento',
  ACEITE = 'aceite',
  AZUCAR = 'azucar',
  BEBIDA = 'bebida',
  OTRO = 'otro',
}

/** Catálogo de valores enumerados (UnidadMedida) dentro de smart-economat-frontend (SPA). */
export enum UnidadMedida {
  KG = 'KG',
  G = 'G',
  L = 'L',
  ML = 'ML',
  UNIDAD = 'UNIDAD',
  PAQ = 'PAQ',
}

/** Constantes públicas (BACKEND_ALLERGENS) expuestas en smart-economat-frontend (SPA). */
export const BACKEND_ALLERGENS = [
  'GLUTEN',
  'CRUSTACEOS',
  'HUEVOS',
  'PESCADO',
  'CACAHUETES',
  'SOJA',
  'LACTEOS',
  'FRUTOS_CON_CASCARA',
  'APIO',
  'MOSTAZA',
  'SESAMO',
  'SULFITO',
  'ALTRAMUCES',
  'MOLUSCOS',
] as const;

/** Alias público (BackendAlergeno) para simplificar payloads o props en smart-economat-frontend (SPA). */
export type BackendAlergeno = (typeof BACKEND_ALLERGENS)[number];

/**
 * Expone "normalizeUnidadMedida" en smart-economat-frontend (SPA).
 * @undefined {string | null | undefined} value - Entrada efectiva esperada por el contrato.
 * @undefined {UnidadMedida | undefined} Datos efectivos después de ejecutar la operación.
 */
export function normalizeUnidadMedida(
  value?: string | null
): UnidadMedida | undefined {
  if (!value) return undefined;
  return value.toUpperCase() as UnidadMedida;
}

/**
 * Expone "normalizeAlergeno" en smart-economat-frontend (SPA).
 * @undefined {string | null | undefined} value - Entrada efectiva esperada por el contrato.
 * @undefined {"GLUTEN" | "CRUSTACEOS" | "HUEVOS" | "PESCADO" | "CACAHUETES" | "SOJA" | "LACTEOS" | "FRUTOS_CON_CASCARA" | "APIO" | "MOSTAZA" | "SESAMO" | "SULFITO" | "ALTRAMUCES" | "MOLUSCOS" | undefined} Datos efectivos después de ejecutar la operación.
 */
export function normalizeAlergeno(
  value?: string | null
): BackendAlergeno | undefined {
  if (!value) return undefined;
  return value.toUpperCase() as BackendAlergeno;
}

/** Contrato de tipos público (ProductoAlergeno). Contexto: smart-economat-frontend (SPA). */
export interface ProductoAlergeno {
  id_producto: string;
  alergeno: string;
}

/** Contrato de tipos público (ProductoProveedor). Contexto: smart-economat-frontend (SPA). */
export interface ProductoProveedor {
  id: string;
  proveedorId?: string;
  nombre?: string;
  marca?: string;
  codigoBarras?: string;
  effectiveBarcode?: string;
  precioUnitario?: number;
  mermaEsperada?: number;
  costeEfectivoUnitario?: number;
  esOptimo?: boolean;
  ahorroAbsoluto?: number;
  ahorroAbsolutoPct?: number;
  proveedor?: {
    id: string;
    nombre: string;
  };
}

/** Contrato de tipos público (Producto). Contexto: smart-economat-frontend (SPA). */
export interface Producto {
  id: string;
  nombre: string;
  marca?: string;
  descripcion?: string;
  tipo?: CategoriaProducto;
  unidad?: UnidadMedida;
  codigoBarras?: string;
  contenido: number;
  alergenos?: ProductoAlergeno[];
  pathImg?: string;
  fechaCaducidad?: string;
  proveedores?: ProductoProveedor[];
  pmp?: number;
  /** false: fuera del catálogo sin soft-delete; se lista en «Eliminados». */
  activo?: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Contrato de tipos público (HistorialPrecio). Contexto: smart-economat-frontend (SPA). */
export interface HistorialPrecio {
  id: string;
  precio: number;
  cantidad?: number;
  documentoOrigen?: string;
  recepcionId?: string;
  fecha: string;
  productoProveedor: ProductoProveedor;
}

/** Contrato de tipos público (ProductoNuevoDto). Contexto: smart-economat-frontend (SPA). */
export interface ProductoNuevoDto {
  pendienteCreacion: boolean;
  codigoBarras: string;
  nombre: string;
  marca?: string;
  unidad: UnidadMedida;
  tipo: CategoriaProducto;
  contenido: number;
}

/** Contrato de tipos público (ProductosQueryParams). Contexto: smart-economat-frontend (SPA). */
export interface ProductosQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  codigoBarras?: string;
  tipo?: CategoriaProducto;
  categorias?: string[];
  alergenos?: string[];
  sortBy?: string;
  order?: 'ASC' | 'DESC' | 'asc' | 'desc';
  /** true = pestaña «Eliminados»: solo productos con soft-delete (`deletedAt`). */
  soloEliminados?: boolean;
}
