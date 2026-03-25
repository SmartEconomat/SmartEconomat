export interface AlbaranPedidoRecepcion {
  id: string;
  albaranId: string;
  recepcionPedidoId: string;
  createdAt?: string;
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
