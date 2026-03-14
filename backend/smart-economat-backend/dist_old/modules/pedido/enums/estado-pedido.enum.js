'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'EstadoPedido', {
  enumerable: true,
  get: function () {
    return EstadoPedido;
  },
});
var EstadoPedido = /*#__PURE__*/ (function (EstadoPedido) {
  /**
   * Pedido recién creado, aún en borrador o pendiente de autorización.
   */ EstadoPedido['PENDIENTE'] = 'pendiente';
  /**
   * Pedido autorizado y tramitado con el proveedor.
   */ EstadoPedido['EN_PROCESO'] = 'en_proceso';
  /**
   * Pedido recibido y verificado correctamente.
   * Inventario actualizado sin discrepancias.
   */ EstadoPedido['RECIBIDO'] = 'recibido';
  /**
   * Pedido recibido pero con discrepancias que han generado incidencias.
   * Requiere gestión adicional (devolución, reclamación, etc.).
   */ EstadoPedido['INCIDENCIA'] = 'incidencia';
  /**
   * Pedido anulado antes de ser servido completamente.
   */ EstadoPedido['CANCELADO'] = 'cancelado';
  /**
   * Pedido recibido parcialmente.
   */ EstadoPedido['PARCIAL'] = 'parcial';
  return EstadoPedido;
})({});
