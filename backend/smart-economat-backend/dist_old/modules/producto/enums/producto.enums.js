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
    get Alergeno () {
        return Alergeno;
    },
    get TipoProducto () {
        return TipoProducto;
    },
    get UnidadMedida () {
        return UnidadMedida;
    }
});
var UnidadMedida = /*#__PURE__*/ function(UnidadMedida) {
    UnidadMedida["KG"] = "KG";
    UnidadMedida["G"] = "G";
    UnidadMedida["L"] = "L";
    UnidadMedida["ML"] = "ML";
    UnidadMedida["UNIDAD"] = "UNIDAD";
    UnidadMedida["PAQ"] = "PAQ";
    return UnidadMedida;
}({});
var Alergeno = /*#__PURE__*/ function(Alergeno) {
    Alergeno["GLUTEN"] = "GLUTEN";
    Alergeno["CRUSTACEOS"] = "CRUSTACEOS";
    Alergeno["HUEVOS"] = "HUEVOS";
    Alergeno["PESCADO"] = "PESCADO";
    Alergeno["CACAHUETES"] = "CACAHUETES";
    Alergeno["SOJA"] = "SOJA";
    Alergeno["LACTEOS"] = "LACTEOS";
    Alergeno["FRUTOS_CON_CASCARA"] = "FRUTOS_CON_CASCARA";
    Alergeno["APIO"] = "APIO";
    Alergeno["MOSTAZA"] = "MOSTAZA";
    Alergeno["SESAMO"] = "SESAMO";
    Alergeno["SULFITO"] = "SULFITO";
    Alergeno["ALTRAMUCES"] = "ALTRAMUCES";
    Alergeno["MOLUSCOS"] = "MOLUSCOS";
    return Alergeno;
}({});
var TipoProducto = /*#__PURE__*/ function(TipoProducto) {
    TipoProducto["VERDURA"] = "verdura";
    TipoProducto["FRUTA"] = "fruta";
    TipoProducto["CARNE"] = "carne";
    TipoProducto["PESCADO"] = "pescado";
    TipoProducto["MARISCO"] = "marisco";
    TipoProducto["LACTEO"] = "lacteo";
    TipoProducto["HUEVO"] = "huevo";
    TipoProducto["CEREAL"] = "cereal";
    TipoProducto["LEGUMBRE"] = "legumbre";
    TipoProducto["FRUTO_SECO"] = "fruto_seco";
    TipoProducto["CONDIMENTO"] = "condimento";
    TipoProducto["ACEITE"] = "aceite";
    TipoProducto["AZUCAR"] = "azucar";
    TipoProducto["BEBIDA"] = "bebida";
    TipoProducto["OTRO"] = "otro";
    return TipoProducto;
}({});

//# sourceMappingURL=producto.enums.js.map