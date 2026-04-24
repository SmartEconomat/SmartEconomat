/**
 * Minimal product information as seen from a supplier's product list.
 */
export interface ProductoDelProveedor {
  /** Unique identifier of the product-supplier relation. */
  id: string;
  /** Optional brand name of the product for this supplier. */
  marca?: string;
  /** Optional barcode associated with this supplier's product. */
  codigoBarras?: string;
  /** Unit price charged by this supplier. */
  precioUnitario: number;
}

/**
 * Represents a supplier (proveedor) entity as returned by the API.
 */
export interface Proveedor {
  /** Unique identifier. */
  id: string;
  /** Legal or commercial name of the supplier. */
  nombre: string;
  /** Name of the contact person at the supplier. */
  contacto?: string;
  /** Contact phone number. */
  telefono?: string;
  /** Contact email address. */
  email?: string;
  /** Postal address of the supplier. */
  direccion?: string;
  /** Tax identification number (NIF/CIF). */
  nif?: string;
  /** Products supplied, if loaded with the relation. */
  productos?: ProductoDelProveedor[];
}
