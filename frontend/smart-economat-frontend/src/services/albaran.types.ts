/**
 * Documentación en español.
 */
export interface AlbaranPedidoRecepcion {
        /**
     * Documentación en español.
     */
  id: string;
        /**
     * Documentación en español.
     */
  albaranId: string;
        /**
     * Documentación en español.
     */
  recepcionPedidoId: string;
        /**
     * Documentación en español.
     */
  recepcionPedido?: AlbaranRecepcionPedido;
        /**
     * Documentación en español.
     */
  createdAt?: string;
}

/**
 * Documentación en español.
 */
export interface AlbaranRecepcionPedido {
        /**
     * Documentación en español.
     */
  id: string;
        /**
     * Documentación en español.
     */
  recepcionId: string;
        /**
     * Documentación en español.
     */
  pedidoId: string;
        /**
     * Documentación en español.
     */
  recepcion?: AlbaranRecepcion;
}

/**
 * Documentación en español.
 */
export interface AlbaranRecepcion {
        /**
     * Documentación en español.
     */
  id: string;
        /**
     * Documentación en español.
     */
  fechaRecepcion?: string;
        /**
     * Documentación en español.
     */
  estado?: string;
        /**
     * Documentación en español.
     */
  incidencia?: boolean;
        /**
     * Documentación en español.
     */
  recepcionProductos?: AlbaranRecepcionProducto[];
}

/**
 * Documentación en español.
 */
export interface AlbaranRecepcionProducto {
        /**
     * Documentación en español.
     */
  id: string;
        /**
     * Documentación en español.
     */
  pedidoProductoId: string;
        /**
     * Documentación en español.
     */
  cantidadRecibida?: number;
        /**
     * Documentación en español.
     */
  estadoProducto?: string;
        /**
     * Documentación en español.
     */
  observaciones?: string;
        /**
     * Documentación en español.
     */
  pedidoProducto?: AlbaranPedidoProducto;
}

/**
 * Documentación en español.
 */
export interface AlbaranPedidoProducto {
        /**
     * Documentación en español.
     */
  id: string;
        /**
     * Documentación en español.
     */
  cantidad?: number;
        /**
     * Documentación en español.
     */
  precioUnitario?: number;
        /**
     * Documentación en español.
     */
  productoProveedor?: AlbaranProductoProveedor;
}

/**
 * Documentación en español.
 */
export interface AlbaranProductoProveedor {
        /**
     * Documentación en español.
     */
  id: string;
        /**
     * Documentación en español.
     */
  producto?: AlbaranProducto;
        /**
     * Documentación en español.
     */
  proveedor?: AlbaranProveedor;
}

/**
 * Documentación en español.
 */
export interface AlbaranProducto {
        /**
     * Documentación en español.
     */
  id: string;
        /**
     * Documentación en español.
     */
  nombre?: string;
        /**
     * Documentación en español.
     */
  unidad?: string;
}

/**
 * Documentación en español.
 */
export interface AlbaranProveedor {
        /**
     * Documentación en español.
     */
  id: string;
        /**
     * Documentación en español.
     */
  nombre?: string;
}

/**
 * Documentación en español.
 */
export interface Albaran {
        /**
     * Documentación en español.
     */
  id: string;
        /**
     * Documentación en español.
     */
  nAlbaran: string;
        /**
     * Documentación en español.
     */
  concordancia?: boolean;
        /**
     * Documentación en español.
     */
  fecha?: string;
        /**
     * Documentación en español.
     */
  documentoUrl?: string;
        /**
     * Documentación en español.
     */
  documentoNombre?: string;
        /**
     * Documentación en español.
     */
  documentoMimeType?: string;
        /**
     * Documentación en español.
     */
  documentoTamano?: number;
        /**
     * Documentación en español.
     */
  albaranPedidoRecepcion?: AlbaranPedidoRecepcion[];
        /**
     * Documentación en español.
     */
  createdAt: string;
        /**
     * Documentación en español.
     */
  updatedAt: string;
        /**
     * Documentación en español.
     */
  deletedAt?: string;
}

/**
 * Documentación en español.
 */
export interface CreateAlbaranDto {
        /**
     * Documentación en español.
     */
  nAlbaran: string;
        /**
     * Documentación en español.
     */
  concordancia?: boolean;
        /**
     * Documentación en español.
     */
  fecha?: string;
}

/**
 * Documentación en español.
 */
export type UpdateAlbaranDto = Partial<CreateAlbaranDto>;

/**
 * Documentación en español.
 */
export interface AlbaranQueryParams {
        /**
     * Documentación en español.
     */
  page?: number;
        /**
     * Documentación en español.
     */
  limit?: number;
        /**
     * Documentación en español.
     */
  searchTerm?: string;
        /**
     * Documentación en español.
     */
  sortBy?: string;
        /**
     * Documentación en español.
     */
  order?: 'ASC' | 'DESC';
}
