/**
 * Catálogo centralizado de permisos del sistema.
 *
 * Cada módulo agrupa sus acciones disponibles.
 * Los valores siguen el formato `modulo:accion` y son inmutables (`as const`).
 *
 * Usar siempre estas constantes en `@RequirePermissions()` y en seeds/migraciones.
 */
export const PERMISSIONS = {
  usuarios: {
    listar: 'usuarios:listar',
    ver: 'usuarios:ver',
    crear: 'usuarios:crear',
    editar: 'usuarios:editar',
    eliminar: 'usuarios:eliminar',
    activar_desactivar: 'usuarios:activar_desactivar',
    resetear_password: 'usuarios:resetear_password',
  },
  productos: {
    listar: 'productos:listar',
    ver: 'productos:ver',
    crear: 'productos:crear',
    editar: 'productos:editar',
    eliminar: 'productos:eliminar',
    generar_ean13: 'productos:generar_ean13',
  },
  proveedores: {
    listar: 'proveedores:listar',
    crear: 'proveedores:crear',
    editar: 'proveedores:editar',
    eliminar: 'proveedores:eliminar',
  },
  pedidos: {
    listar: 'pedidos:listar',
    ver: 'pedidos:ver',
    crear: 'pedidos:crear',
    editar: 'pedidos:editar',
    cancelar: 'pedidos:cancelar',
    restaurar: 'pedidos:restaurar',
    eliminar: 'pedidos:eliminar',
  },
  recepciones: {
    listar: 'recepciones:listar',
    ver: 'recepciones:ver',
    crear: 'recepciones:crear',
    editar: 'recepciones:editar',
    eliminar: 'recepciones:eliminar',
  },
  incidencias: {
    listar: 'incidencias:listar',
    ver: 'incidencias:ver',
    crear: 'incidencias:crear',
    editar: 'incidencias:editar',
    eliminar: 'incidencias:eliminar',
    resolver: 'incidencias:resolver',
  },
  albaranes: {
    listar: 'albaranes:listar',
    ver: 'albaranes:ver',
    crear: 'albaranes:crear',
    editar: 'albaranes:editar',
    eliminar: 'albaranes:eliminar',
  },
  distribuciones: {
    listar: 'distribuciones:listar',
    ver: 'distribuciones:ver',
    crear: 'distribuciones:crear',
    confirmar: 'distribuciones:confirmar',
    cancelar: 'distribuciones:cancelar',
  },
  ubicaciones: {
    listar: 'ubicaciones:listar',
    ver: 'ubicaciones:ver',
    crear: 'ubicaciones:crear',
    editar: 'ubicaciones:editar',
    eliminar: 'ubicaciones:eliminar',
    restaurar: 'ubicaciones:restaurar',
  },
  inventario: {
    listar: 'inventario:listar',
    ver: 'inventario:ver',
    crear: 'inventario:crear',
    editar: 'inventario:editar',
    eliminar: 'inventario:eliminar',
    ajustar_stock: 'inventario:ajustar_stock',
  },
  recetas: {
    listar: 'recetas:listar',
    ver: 'recetas:ver',
    crear: 'recetas:crear',
    editar: 'recetas:editar',
    eliminar: 'recetas:eliminar',
    duplicar: 'recetas:duplicar',
    cocinar: 'recetas:cocinar',
  },
  merma: {
    listar: 'merma:listar',
    ver: 'merma:ver',
    crear: 'merma:crear',
    stats: 'merma:stats',
  },
  movimientos: {
    listar: 'movimientos:listar',
  },
  archivos: {
    listar: 'archivos:listar',
    ver: 'archivos:ver',
    subir: 'archivos:subir',
    eliminar: 'archivos:eliminar',
  },
  profesor: {
    gestionar_slots: 'profesor:gestionar_slots',
    gestionar_alumnos: 'profesor:gestionar_alumnos',
    ver_alumnos: 'profesor:ver_alumnos',
  },
  alumno: {
    cambiar_profesor: 'alumno:cambiar_profesor',
  },
  dashboard: {
    ver_estadisticas: 'dashboard:ver_estadisticas',
  },
  roles: {
    listar: 'roles:listar',
    ver: 'roles:ver',
    crear: 'roles:crear',
    editar: 'roles:editar',
    eliminar: 'roles:eliminar',
  },
  permisos: {
    listar: 'permisos:listar',
    ver: 'permisos:ver',
    crear: 'permisos:crear',
    editar: 'permisos:editar',
    eliminar: 'permisos:eliminar',
  },
} as const;

/** Unión de todos los códigos de permiso del sistema. */
export type PermissionCode =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS][keyof (typeof PERMISSIONS)[keyof typeof PERMISSIONS]] extends infer V
    ? V extends string
      ? V
      : never
    : never;

/** Nombres de módulos del catálogo de permisos. */
export type PermissionModule = keyof typeof PERMISSIONS;

/** Todos los códigos de permiso como array plano (útil para seeds). */
export const ALL_PERMISSION_CODES: PermissionCode[] = Object.values(
  PERMISSIONS
).flatMap((mod) => Object.values(mod)) as PermissionCode[];
