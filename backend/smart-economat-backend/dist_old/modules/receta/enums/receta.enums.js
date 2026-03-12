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
    get DificultadReceta () {
        return DificultadReceta;
    },
    get TiempoReceta () {
        return TiempoReceta;
    },
    get UnidadIngrediente () {
        return UnidadIngrediente;
    }
});
var UnidadIngrediente = /*#__PURE__*/ function(UnidadIngrediente) {
    UnidadIngrediente["GRAMO"] = "g";
    UnidadIngrediente["KILOGRAMO"] = "kg";
    UnidadIngrediente["LITRO"] = "l";
    UnidadIngrediente["MILILITRO"] = "ml";
    UnidadIngrediente["PIEZA"] = "pieza";
    UnidadIngrediente["CUCHARADA"] = "cda";
    UnidadIngrediente["CUCHARADITA"] = "cdta";
    return UnidadIngrediente;
}({});
var DificultadReceta = /*#__PURE__*/ function(DificultadReceta) {
    DificultadReceta["FACIL"] = "Fácil";
    DificultadReceta["MEDIA"] = "Media";
    DificultadReceta["DIFICIL"] = "Difícil";
    return DificultadReceta;
}({});
var TiempoReceta = /*#__PURE__*/ function(TiempoReceta) {
    TiempoReceta["MIN_10"] = "10 min";
    TiempoReceta["MIN_20"] = "20 min";
    TiempoReceta["MIN_30"] = "30 min";
    TiempoReceta["MIN_45"] = "45 min";
    TiempoReceta["MIN_60"] = "60 min";
    return TiempoReceta;
}({});

//# sourceMappingURL=receta.enums.js.map