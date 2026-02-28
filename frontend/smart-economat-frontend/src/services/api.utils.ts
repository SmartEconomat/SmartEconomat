/**
 * Campos de metadatos de BaseEntity que el backend genera automáticamente
 * y no deben enviarse en los requests de creación/actualización.
 */
const BASE_ENTITY_FIELDS = ['id', 'createdAt', 'updatedAt', 'deletedAt', 'deletedBy', 'version'];

/**
 * Elimina los campos de metadatos de BaseEntity de un objeto
 * antes de enviarlo al backend como payload de creación/actualización.
 */
export function cleanPayload<T extends Record<string, any>>(data: T): Partial<T> {
    const cleaned = { ...data };
    BASE_ENTITY_FIELDS.forEach(field => {
        delete cleaned[field];
    });
    return cleaned as Partial<T>;
}
