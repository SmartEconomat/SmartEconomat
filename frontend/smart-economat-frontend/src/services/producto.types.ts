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

export enum UnidadMedida {
  KG = 'KG',
  G = 'G',
  L = 'L',
  ML = 'ML',
  UNIDAD = 'UNIDAD',
  PAQ = 'PAQ',
}

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

export type BackendAlergeno = (typeof BACKEND_ALLERGENS)[number];

export function normalizeUnidadMedida(
  value?: string | null
): UnidadMedida | undefined {
  if (!value) return undefined;
  return value.toUpperCase() as UnidadMedida;
}

export function normalizeAlergeno(
  value?: string | null
): BackendAlergeno | undefined {
  if (!value) return undefined;
  return value.toUpperCase() as BackendAlergeno;
}

export interface ProductoAlergeno {
  id_producto: string;
  alergeno: string;
}

export interface ProductoProveedor {
  id: string;
  nombre?: string;
  marca?: string;
  codigoBarras?: string;
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
}

export interface HistorialPrecio {
  id: string;
  precio: number;
  cantidad?: number;
  documentoOrigen?: string;
  recepcionId?: string;
  fecha: string;
  productoProveedor: ProductoProveedor;
}

export interface ProductoNuevoDto {
  pendienteCreacion: boolean;
  codigoBarras: string;
  nombre: string;
  marca?: string;
  unidad: UnidadMedida;
  tipo: CategoriaProducto;
  contenido: number;
}

export interface ProductosQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  codigoBarras?: string;
  tipo?: CategoriaProducto;
  categorias?: string[];
  alergenos?: string[];
}
