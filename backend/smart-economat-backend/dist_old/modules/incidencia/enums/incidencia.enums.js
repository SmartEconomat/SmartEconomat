'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
function _export(target, all) {
  for (var name in all)
    Object.defineProperty(target, name, {
      enumerable: true,
      get: Object.getOwnPropertyDescriptor(all, name).get,
    });
}
_export(exports, {
  get TIPOS_RESOLUCION_DISPONIBLES() {
    return TIPOS_RESOLUCION_DISPONIBLES;
  },
  get TipoIncidencia() {
    return TipoIncidencia;
  },
  get TipoResolucion() {
    return TipoResolucion;
  },
});
var TipoResolucion = /*#__PURE__*/ (function (TipoResolucion) {
  TipoResolucion['ACEPTADA'] = 'aceptada';
  TipoResolucion['RECHAZADA'] = 'rechazada';
  TipoResolucion['PARCIAL'] = 'parcial';
  TipoResolucion['DEVOLUCION'] = 'devolucion';
  TipoResolucion['ABONO'] = 'abono';
  TipoResolucion['CAMBIO'] = 'cambio';
  return TipoResolucion;
})({});
var TipoIncidencia = /*#__PURE__*/ (function (TipoIncidencia) {
  TipoIncidencia['ROTURA'] = 'rotura';
  TipoIncidencia['CADUCADO'] = 'caducado';
  TipoIncidencia['FALTA_PRODUCTO'] = 'falta_producto';
  TipoIncidencia['EXCESO_PRODUCTO'] = 'exceso_producto';
  TipoIncidencia['OTRO'] = 'otro';
  return TipoIncidencia;
})({});
const TIPOS_RESOLUCION_DISPONIBLES = Object.values(TipoResolucion);
