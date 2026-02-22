export enum EstadoPedido {
  /**
   * Pedido recién creado, aún en borrador o pendiente de autorización.
   */
  PENDIENTE = 'pendiente',

  /**
   * Pedido autorizado y tramitado con el proveedor.
   */
  EN_PROCESO = 'en_proceso',

  /**
   * Pedido recibido y verificado correctamente.
   * Inventario actualizado sin discrepancias.
   */
  RECIBIDO = 'recibido',

  /**
   * Pedido recibido pero con discrepancias que han generado incidencias.
   * Requiere gestión adicional (devolución, reclamación, etc.).
   */
  INCIDENCIA = 'incidencia',

  /**
   * Pedido anulado antes de ser servido completamente.
   */
  CANCELADO = 'cancelado',

  /**
   * Pedido recibido parcialmente.
   */
  PARCIAL = 'parcial',
}
