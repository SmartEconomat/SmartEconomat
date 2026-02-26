export enum CategoriaProducto {
    PERECEDERO = 'PERECEDERO',
    LACTEO = 'LACTEO',
    LIMPIEZA = 'LIMPIEZA',
    NO_PERECEDERO = 'NO_PERECEDERO',
    OTROS = 'OTROS'
}

export enum UnidadMedida {
    KILOGRAMO = 'KILOGRAMO',
    LITRO = 'LITRO',
    UNIDAD = 'UNIDAD'
}

export interface Producto {
    id: string;
    nombre: string;
    marca?: string;
    descripcion?: string;
    tipo?: CategoriaProducto;
    unidad?: UnidadMedida;
    codigoBarras?: string;
    contenido: number;
}
