/**
 * Associates an albaran with a specific reception-pedido pair.
 */
export interface AlbaranPedidoRecepcion {
  /** Unique identifier. */
  id: string;
  /** Foreign key referencing the parent albaran. */
  albaranId: string;
  /** Foreign key referencing the recepcion-pedido junction record. */
  recepcionPedidoId: string;
  /** Optional populated recepcion-pedido relation. */
  recepcionPedido?: AlbaranRecepcionPedido;
  /** ISO timestamp when the association was created. */
  createdAt?: string;
}

/**
 * Junction record linking a recepcion with a pedido.
 */
export interface AlbaranRecepcionPedido {
  /** Unique identifier. */
  id: string;
  /** Foreign key referencing the recepcion. */
  recepcionId: string;
  /** Foreign key referencing the pedido. */
  pedidoId: string;
  /** Optional populated recepcion relation. */
  recepcion?: AlbaranRecepcion;
}

/**
 * Minimal recepcion data embedded in albaran relations.
 */
export interface AlbaranRecepcion {
  /** Unique identifier. */
  id: string;
  /** ISO date when the reception took place. */
  fechaRecepcion?: string;
  /** Current status of the reception. */
  estado?: string;
  /** Whether an incident was raised during this reception. */
  incidencia?: boolean;
  /** Line items received during this reception. */
  recepcionProductos?: AlbaranRecepcionProducto[];
}

/**
 * A single product line within a reception record.
 */
export interface AlbaranRecepcionProducto {
  /** Unique identifier. */
  id: string;
  /** Foreign key referencing the pedido product. */
  pedidoProductoId: string;
  /** Quantity actually received. */
  cantidadRecibida?: number;
  /** Visual status of the received product. */
  estadoProducto?: string;
  /** Free-text observations about this line. */
  observaciones?: string;
  /** Optional populated pedido product relation. */
  pedidoProducto?: AlbaranPedidoProducto;
}

/**
 * Minimal pedido product information used inside albaran line items.
 */
export interface AlbaranPedidoProducto {
  /** Unique identifier. */
  id: string;
  /** Ordered quantity. */
  cantidad?: number;
  /** Unit price at time of order. */
  precioUnitario?: number;
  /** Optional populated product-supplier relation. */
  productoProveedor?: AlbaranProductoProveedor;
}

/**
 * Product-supplier pairing embedded in albaran line items.
 */
export interface AlbaranProductoProveedor {
  /** Unique identifier. */
  id: string;
  /** Optional populated product. */
  producto?: AlbaranProducto;
  /** Optional populated supplier. */
  proveedor?: AlbaranProveedor;
}

/**
 * Minimal product data used inside albaran relations.
 */
export interface AlbaranProducto {
  /** Unique identifier. */
  id: string;
  /** Product name. */
  nombre?: string;
  /** Unit of measure (e.g. KG, UNIDAD). */
  unidad?: string;
}

/**
 * Minimal supplier data used inside albaran relations.
 */
export interface AlbaranProveedor {
  /** Unique identifier. */
  id: string;
  /** Supplier name. */
  nombre?: string;
}

/**
 * Represents a delivery note (albarán) entity as returned by the API.
 */
export interface Albaran {
  /** Unique identifier. */
  id: string;
  /** Delivery note reference number provided by the supplier. */
  nAlbaran: string;
  /** Whether the albaran quantities match the corresponding order. */
  concordancia?: boolean;
  /** ISO date of the delivery note. */
  fecha?: string;
  /** URL of the scanned or uploaded document. */
  documentoUrl?: string;
  /** Original filename of the uploaded document. */
  documentoNombre?: string;
  /** MIME type of the uploaded document. */
  documentoMimeType?: string;
  /** File size of the uploaded document in bytes. */
  documentoTamano?: number;
  /** Associated reception-pedido relations. */
  albaranPedidoRecepcion?: AlbaranPedidoRecepcion[];
  /** ISO timestamp when the record was created. */
  createdAt: string;
  /** ISO timestamp of the last update. */
  updatedAt: string;
  /** ISO timestamp when the record was soft-deleted, if applicable. */
  deletedAt?: string;
}

/**
 * Payload for creating a new albaran.
 */
export interface CreateAlbaranDto {
  /** Supplier's delivery note reference number. */
  nAlbaran: string;
  /** Whether the delivered quantities match the order. */
  concordancia?: boolean;
  /** ISO date of the delivery. */
  fecha?: string;
}

/**
 * Payload for partially updating an existing albaran.
 * All fields are optional.
 */
export type UpdateAlbaranDto = Partial<CreateAlbaranDto>;

/**
 * Query parameters accepted by the paginated albaranes list endpoint.
 */
export interface AlbaranQueryParams {
  /** Page number (1-based). */
  page?: number;
  /** Number of items per page. */
  limit?: number;
  /** Free-text search term. */
  searchTerm?: string;
  /** Field name to sort by. */
  sortBy?: string;
  /** Sort direction. */
  order?: 'ASC' | 'DESC';
}
