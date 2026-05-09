/** Relación pivote entre un albarán y la recepción-pedido que cubre. */
export interface AlbaranPedidoRecepcion {
  /** UUID del registro. */
  id: string;
  /** UUID del albarán principal. */
  albaranId: string;
  /** UUID de la relación recepcion-pedido vinculada. */
  recepcionPedidoId: string;
  /** Datos de la relación recepcion-pedido, si se cargó. */
  recepcion?: AlbaranRecepcionPedido;
  /** Fecha de creación ISO. */
  createdAt?: string;
}

/** Relación pivote entre una recepción y un pedido. */
export interface AlbaranRecepcionPedido {
  /** UUID del registro. */
  id: string;
  /** UUID de la recepción. */
  recepcionId: string;
  /** UUID del pedido. */
  pedidoId: string;
  /** Datos de la recepción, si se cargó. */
  recepcion?: AlbaranRecepcion;
}

/** Snapshot de recepción embebido en el contexto de un albarán. */
export interface AlbaranRecepcion {
  /** UUID de la recepción. */
  id: string;
  /** Fecha en que se realizó la recepción física. */
  fechaRecepcion?: string;
  /** Estado actual del proceso de recepción. */
  estado?: string;
  /** Indica si existen incidencias detectadas en esta recepción. */
  incidencia?: boolean;
  /** Productos recibidos en la recepción. */
  recepcionProductos?: AlbaranRecepcionProducto[];
}

/** Producto individual recibido en el contexto de un albarán. */
export interface AlbaranRecepcionProducto {
  /** UUID del registro. */
  id: string;
  /** UUID de la línea de pedido-producto asociada. */
  pedidoProductoId: string;
  /** Cantidad efectivamente recibida de este producto. */
  cantidadRecibida?: number;
  /** Estado del producto recibido (correcto, defectuoso, etc.). */
  estadoProducto?: string;
  /** Observaciones del receptor. */
  observaciones?: string;
  /** Datos del pedido-producto, si se cargó. */
  pedidoProducto?: AlbaranPedidoProducto;
}

/** Línea de pedido-producto embebida en el albarán. */
export interface AlbaranPedidoProducto {
  /** UUID de la línea de pedido. */
  id: string;
  /** Cantidad pedida originalmente. */
  cantidad?: number;
  /** Precio unitario acordado. */
  precioUnitario?: number;
  /** Datos de la relación producto-proveedor. */
  productoProveedor?: AlbaranProductoProveedor;
}

/** Relación producto-proveedor embebida en el albarán. */
export interface AlbaranProductoProveedor {
  /** UUID de la relación. */
  id: string;
  /** Datos del producto. */
  producto?: AlbaranProducto;
  /** Datos del proveedor. */
  proveedor?: AlbaranProveedor;
}

/** Producto resumido para contexto de albarán. */
export interface AlbaranProducto {
  /** UUID del producto. */
  id: string;
  /** Nombre comercial del producto. */
  nombre?: string;
  /** Unidad de medida (kg, unidad, etc.). */
  unidad?: string;
}

/** Proveedor resumido para contexto de albarán. */
export interface AlbaranProveedor {
  /** UUID del proveedor. */
  id: string;
  /** Nombre fiscal o comercial del proveedor. */
  nombre?: string;
}

/** Albarán de entrega que certifica la recepción de mercancía. */
export interface Albaran {
  /** UUID del albarán. */
  id: string;
  /** Número de referencia del albarán del proveedor. */
  nAlbaran: string;
  /** Indica si el albarán coincide con lo pedido/recibido. */
  concordancia?: boolean;
  /** Fecha del albarán del proveedor (ISO). */
  fecha?: string;
  /** URL del documento escaneado. */
  documentoUrl?: string;
  /** Nombre original del fichero subido. */
  documentoNombre?: string;
  /** MIME type del documento. */
  documentoMimeType?: string;
  /** Tamaño del fichero en bytes. */
  documentoTamano?: number;
  /** Relaciones pivote con recepciones. */
  albaranPedidoRecepcion?: AlbaranPedidoRecepcion[];
  /** Fecha de creación del registro. */
  createdAt: string;
  /** Fecha de última actualización. */
  updatedAt: string;
  /** Fecha de borrado lógico, si aplica. */
  deletedAt?: string;
}

/** DTO para crear un nuevo albarán. */
export interface CreateAlbaranDto {
  /** Número de albarán del proveedor. */
  nAlbaran: string;
  /** Si se ha verificado la concordancia con el pedido. */
  concordancia?: boolean;
  /** Fecha del albarán. */
  fecha?: string;
}

/** DTO para actualizar un albarán existente (todos los campos opcionales). */
export type UpdateAlbaranDto = Partial<CreateAlbaranDto>;

/** Parámetros de consulta para el listado paginado de albaranes. */
export interface AlbaranQueryParams {
  /** Número de página (1-based). */
  page?: number;
  /** Elementos por página. */
  limit?: number;
  /** Término de búsqueda por referencia. */
  searchTerm?: string;
  /** Campo de ordenación. */
  sortBy?: string;
  /** Dirección de la ordenación. */
  order?: 'ASC' | 'DESC';
}
