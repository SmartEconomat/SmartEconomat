export enum CategoriaProducto {
    VERDURA = 'verdura',
    FRUTA = 'fruta',
    CARNE = 'carne',
    PESCADO = 'pescado',
    MARISCO = 'marisco',
    LACTEO = 'lacteo',
    HUEVO = 'huevo',
    CEREAL = 'cereal',
    LEGUMBRE = 'legumbre',
    FRUTO_SECO = 'fruto_seco',
    CONDIMENTO = 'condimento',
    ACEITE = 'aceite',
    AZUCAR = 'azucar',
    BEBIDA = 'bebida',
    OTRO = 'otro',
}

export enum UnidadMedida {
    KG = 'KG',
    G = 'G',
    L = 'L',
    ML = 'ML',
    UNIDAD = 'UNIDAD',
    PAQ = 'PAQ',
}

export interface ProductoAlergeno {
    id_producto: string;
    alergeno: string;
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
    alergenos?: ProductoAlergeno[];
    pathImg?: string;
    fechaCaducidad?: string;
    proveedores?: { id: string; proveedor?: { id: string; nombre: string } }[];
}

export interface ProductoNuevoDto {
    pendienteCreacion: boolean;
    codigoBarras: string;
    nombre: string;
    marca?: string;
    unidad: UnidadMedida;
    tipo: CategoriaProducto;
    contenido: number;
}

export interface ProductosQueryParams {
    page?: number;
    limit?: number;
    searchTerm?: string;
    codigoBarras?: string;
    tipo?: CategoriaProducto;
    categorias?: string[];
    alergenos?: string[];
}
