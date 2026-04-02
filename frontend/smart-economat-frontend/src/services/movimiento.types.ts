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

export interface UsuarioBasico {
  id: string;
  nombre: string;
  email: string;
}

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
