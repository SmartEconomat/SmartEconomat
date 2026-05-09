/**
 * Rol logístico del nodo dentro del catálogo de ubicaciones.
 * Valores persistidos en columna varchar (ubicacion.tipo).
 */
export enum TipoUbicacion {
  ALMACEN_GENERAL = 'almacen_general',
  AREA = 'area',
  PASILLO = 'pasillo',
  ESTANTERIA = 'estanteria',
  HUECO = 'hueco',
  NEVERA = 'nevera',
  CONGELADOR = 'congelador',
  MUELLE = 'muelle',
  TRANSITO_VIRTUAL = 'transito_virtual',
  OTRO = 'otro',
}
