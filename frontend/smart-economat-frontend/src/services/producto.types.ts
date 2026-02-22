export interface Producto {
    id: string;
    nombre: string;
    marca?: string;
    descripcion?: string;
    tipo?: string;
    unidad?: string;
    codigoBarras?: string;
    contenido: number;
}
