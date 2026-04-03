export interface AlbaranPedidoRecepcion {
  id: string;
  albaranId: string;
  recepcionPedidoId: string;
  recepcionPedido?: AlbaranRecepcionPedido;
  createdAt?: string;
}

export interface AlbaranRecepcionPedido {
  id: string;
  recepcionId: string;
  pedidoId: string;
  recepcion?: AlbaranRecepcion;
}

export interface AlbaranRecepcion {
  id: string;
  fechaRecepcion?: string;
  estado?: string;
  incidencia?: boolean;
  recepcionProductos?: AlbaranRecepcionProducto[];
}

export interface AlbaranRecepcionProducto {
  id: string;
  pedidoProductoId: string;
  cantidadRecibida?: number;
  estadoProducto?: string;
  observaciones?: string;
  pedidoProducto?: AlbaranPedidoProducto;
}

export interface AlbaranPedidoProducto {
  id: string;
  cantidad?: number;
  precioUnitario?: number;
  productoProveedor?: AlbaranProductoProveedor;
}

export interface AlbaranProductoProveedor {
  id: string;
  producto?: AlbaranProducto;
  proveedor?: AlbaranProveedor;
}

export interface AlbaranProducto {
  id: string;
  nombre?: string;
  unidad?: string;
}

export interface AlbaranProveedor {
  id: string;
  nombre?: string;
}

export interface Albaran {
  id: string;
  nAlbaran: string;
  concordancia?: boolean;
  fecha?: string;
  documentoUrl?: string;
  documentoNombre?: string;
  documentoMimeType?: string;
  documentoTamano?: number;
  albaranPedidoRecepcion?: AlbaranPedidoRecepcion[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateAlbaranDto {
  nAlbaran: string;
  concordancia?: boolean;
  fecha?: string;
}

export type UpdateAlbaranDto = Partial<CreateAlbaranDto>;

export interface AlbaranQueryParams {
  page?: number;
  limit?: number;
  searchTerm?: string;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}
