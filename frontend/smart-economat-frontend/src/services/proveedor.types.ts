/**
 * Documentación en español.
 */
export interface ProductoDelProveedor {
  /**
   * Documentación en español.
   */
  id: string;
  /**
   * Documentación en español.
   */
  marca?: string;
  /**
   * Documentación en español.
   */
  codigoBarras?: string;
  /**
   * Documentación en español.
   */
  precioUnitario: number;
}

/**
 * Documentación en español.
 */
export interface Proveedor {
  /**
   * Documentación en español.
   */
  id: string;
  /**
   * Documentación en español.
   */
  nombre: string;
  /**
   * Documentación en español.
   */
  contacto?: string;
  /**
   * Documentación en español.
   */
  telefono?: string;
  /**
   * Documentación en español.
   */
  email?: string;
  /**
   * Documentación en español.
   */
  direccion?: string;
  /**
   * Documentación en español.
   */
  nif?: string;
  /**
   * Documentación en español.
   */
  productos?: ProductoDelProveedor[];
}
