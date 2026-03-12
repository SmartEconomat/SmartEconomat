import { decodeUUIDv7 } from './uuid';

/**
 * Utilidad para generar identificadores legibles (Friendly IDs) a partir de UUIDs.
 */

/**
 * Genera un ID amigable basado en el tipo de entidad y su UUID v7.
 * Formato: PREFIJO-AAMM-SUFIJO (ej: MOV-2403-F82D)
 * 
 * @param type Tipo de entidad o prefijo deseado (ej: 'movimiento', 'PED', 'PROD')
 * @param uuid UUID v7 de la entidad
 * @returns String con el ID amigable o el UUID original si no se puede formatear
 */
export const generateFriendlyId = (type: string, uuid: string): string => {
    if (!uuid) return '';

    const decoded = decodeUUIDv7(uuid);
    if (!decoded) return uuid;

    // Obtener prefijo (primeras 3 letras en mayúsculas)
    const prefix = type.substring(0, 3).toUpperCase();

    // Obtener año (2 dígitos) y mes (2 dígitos)
    const year = decoded.date.getFullYear().toString().slice(-2);
    const month = (decoded.date.getMonth() + 1).toString().padStart(2, '0');

    // Obtener sufijo (últimos 4 caracteres del UUID)
    const suffix = uuid.slice(-4).toUpperCase();

    return `${prefix}-${year}${month}-${suffix}`;
};

/**
 * Mapeo de nombres de entidad a prefijos comunes.
 */
export const EntityPrefix: Record<string, string> = {
    movimiento: 'MOV',
    pedido: 'PED',
    producto: 'PRD',
    proveedor: 'PRO',
    usuario: 'USR',
    inventario: 'INV',
    recepcion: 'REC',
};
