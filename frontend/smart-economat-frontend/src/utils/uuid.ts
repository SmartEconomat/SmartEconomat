/**
 * Utilidad para manejar y decodificar los UUIDs utilizados en la aplicación.
 * Específicamente maneja UUID v7, que contiene un timestamp de 48 bits.
 */

export interface UUIDv7Info {
    timestamp: number;
    date: Date;
    version: number;
    variant: string;
}

/**
 * Valida si una cadena tiene un formato UUID válido.
 */
export const isValidUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};

/**
 * Extrae metadatos de un UUID v7.
 * Estructura UUID v7 (128 bits):
 * - timestamp: 48 bits (alto)
 * - version: 4 bits (0111 = 7)
 * - variant: 2 bits (10 = RFC4122)
 * - random: 74 bits
 * 
 * @param uuid El string del UUID a decodificar
 * @returns Objeto UUIDv7Info o null si es inválido o no es v7
 */
export const decodeUUIDv7 = (uuid: string): UUIDv7Info | null => {
    if (!uuid || !isValidUUID(uuid)) return null;

    // Quitar guiones para facilitar el procesamiento
    const cleanUuid = uuid.replace(/-/g, '');
    
    // La versión es el 13º carácter hex (índice 12)
    const version = parseInt(cleanUuid.charAt(12), 16);
    if (version !== 7) return null;

    // El timestamp son los primeros 48 bits (primeros 12 caracteres hex)
    const timestampHex = cleanUuid.substring(0, 12);
    const timestamp = parseInt(timestampHex, 16);
    const date = new Date(timestamp);

    // La variante es el 17º carácter hex (índice 16)
    // La variante RFC4122 empieza con 8, 9, A o B
    const variantHex = cleanUuid.charAt(16).toUpperCase();

    return {
        timestamp,
        date,
        version,
        variant: variantHex
    };
};

/**
 * Formatea la fecha de creación desde un UUID v7 si es posible.
 */
export const formatUUIDv7Date = (uuid: string, locale: string = 'es-ES'): string | null => {
    const info = decodeUUIDv7(uuid);
    if (!info) return null;
    
    return info.date.toLocaleString(locale);
};

