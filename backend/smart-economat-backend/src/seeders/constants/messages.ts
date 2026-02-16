/**
 * Colección de mensajes de error **hardcodeados** para uso exclusivo en Seeders.
 *
 * @constant
 * @type {object}
 * @description
 * Los seeders se ejecutan fuera del contexto de inyección de dependencias de NestJS y del ciclo de vida de peticiones HTTP.
 * Por lo tanto, no tienen acceso al contexto `I18nContext` para determinar el idioma automáticamente.
 *
 * Estos mensajes sirven principalmente para depuración y validación de orden de ejecución (dependencias entre seeders).
 *
 * @example
 * if (!users.length) {
 *   console.error(SEEDER_MESSAGES.errors.NO_USUARIOS);
 * }
 */
export const SEEDER_MESSAGES = {
  errors: {
    NO_PROVEEDORES: 'No hay proveedores. Ejecuta proveedor.seeder.ts primero.',
    NO_USUARIOS: 'No hay usuarios en la base de datos',
    NO_PRODUCTOS_PROVEEDOR: 'No hay productos con proveedor',
    NO_RECEPCIONES: 'No se han creado recepciones',
    NO_PEDIDOS: 'Faltan pedidos. Ejecuta su seeder primero.',
    NO_RECEPCIONES_PRODUCTOS: 'No hay recepciones de productos disponibles',
    SEEDER_NOT_FOUND: 'Seeder no encontrado',
    RUN_SEEDER_NOT_FOUND: 'No se encontró runSeeder en el archivo',
    NO_PRODUCTOS: 'No hay productos disponibles.',
  },
} as const;
