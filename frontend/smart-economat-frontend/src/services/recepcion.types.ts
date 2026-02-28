export enum EstadoRecepcion {
    PENDIENTE = 'Pendiente',
    COMPLETADO = 'Completado',
    CANCELADO = 'Cancelado'
}

export interface Recepcion {
    id: string;
    fecha: string;
    proveedorId: string;
    proveedor?: { id: string; nombre: string };
    estado: EstadoRecepcion;
    albaran?: string;
    notas?: string;
    lineas?: any[]; // Reemplazar any[] con RecepcionLinea después
}
