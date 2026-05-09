/** Relación producto-proveedor resumida dentro del contexto de un proveedor. */
export interface ProductoDelProveedor {
  /** UUID de la relación producto-proveedor. */
  id: string;
  /** Marca específica de este proveedor para el producto. */
  marca?: string;
  /** Código de barras del proveedor para este producto. */
  codigoBarras?: string;
  /** Precio unitario acordado. */
  precioUnitario: number;
}

/** Proveedor de mercancía registrado en el sistema. */
export interface Proveedor {
  /** UUID del proveedor. */
  id: string;
  /** Nombre fiscal o comercial del proveedor. */
  nombre: string;
  /** Persona de contacto. */
  contacto?: string;
  /** Teléfono de contacto. */
  telefono?: string;
  /** Correo electrónico de contacto. */
  email?: string;
  /** Dirección postal. */
  direccion?: string;
  /** NIF/CIF del proveedor. */
  nif?: string;
  /** Productos catalogados de este proveedor. */
  productos?: ProductoDelProveedor[];
  deletedAt?: string | null;
  deletedBy?: string | null;
}
