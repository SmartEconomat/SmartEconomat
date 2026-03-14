"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get TIPOS_DISPONIBLES () {
        return TIPOS_DISPONIBLES;
    },
    get TipoMovimiento () {
        return TipoMovimiento;
    }
});
var TipoMovimiento = /*#__PURE__*/ function(TipoMovimiento) {
    TipoMovimiento["ENTRADA"] = "entrada";
    TipoMovimiento["SALIDA"] = "salida";
    TipoMovimiento["AJUSTE"] = "ajuste";
    TipoMovimiento["PEDIDO"] = "pedido";
    TipoMovimiento["ENTRADA_COMPRA"] = "entrada_compra";
    TipoMovimiento["SALIDA_ELABORACION"] = "salida_elaboracion";
    TipoMovimiento["PRODUCCION_CONSUMO"] = "produccion_consumo";
    TipoMovimiento["PRODUCCION_RESULTADO"] = "produccion_resultado";
    TipoMovimiento["SALIDA_AJUSTE"] = "salida_ajuste";
    return TipoMovimiento;
}({});
const TIPOS_DISPONIBLES = Object.values(TipoMovimiento);

//# sourceMappingURL=movimiento.enums.js.map