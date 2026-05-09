/** Catálogo de valores enumerados (TipoMovimiento) dentro de smart-economat-frontend (SPA). */
export enum TipoMovimiento {
  ENTRADA = 'entrada',
  SALIDA = 'salida',
  AJUSTE = 'ajuste',
  PEDIDO = 'pedido',
  ENTRADA_COMPRA = 'entrada_compra',
  SALIDA_DISTRIBUCION = 'salida_distribucion',
  ENTRADA_DISTRIBUCION = 'entrada_distribucion',
  SALIDA_ELABORACION = 'salida_elaboracion',
}

/** Contrato de tipos público (UsuarioBasico). Contexto: smart-economat-frontend (SPA). */
export interface UsuarioBasico {
  id: string;
  nombre?: string | null;
  username?: string | null;
  email?: string | null;
}

/** Contrato de tipos público (Movimiento). Contexto: smart-economat-frontend (SPA). */
export interface Movimiento {
  id: string;
  tipo: TipoMovimiento;
  cantidad: number;
  entidad: string;
  entidadId: string;
  createdAt: string;
  descripcion?: string;
  usuario?: UsuarioBasico;
  productoProveedor?: {
    id: string;
    producto?: {
      nombre: string;
    };
  };
  inventario?: {
    id: string;
    lote?: string;
    productoProveedor?: {
      producto?: {
        nombre: string;
      };
    };
  };
}
/** Contrato de tipos público (MovimientosQueryParams). Contexto: smart-economat-frontend (SPA). */
export interface MovimientosQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  type?: TipoMovimiento | TipoMovimiento[];
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}
