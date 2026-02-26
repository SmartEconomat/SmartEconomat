export interface ProductoDelProveedor {
    id: string;
    marca?: string;
    codigoBarras?: string;
    precioUnitario: number;
}

export interface Proveedor {
    id: string;
    nombre: string;
    contacto?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    nif?: string;
    productos?: ProductoDelProveedor[];
}
