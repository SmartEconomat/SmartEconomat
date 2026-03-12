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
    get UserStatus () {
        return UserStatus;
    },
    get rolUsuario () {
        return rolUsuario;
    }
});
var rolUsuario = /*#__PURE__*/ function(rolUsuario) {
    rolUsuario["ADMINISTRADOR"] = "ADMIN";
    rolUsuario["PROFESOR"] = "PROFESOR";
    rolUsuario["ALUMNO"] = "ALUMNO";
    return rolUsuario;
}({});
var UserStatus = /*#__PURE__*/ function(UserStatus) {
    UserStatus["INACTIVE"] = "INACTIVE";
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["BLOCKED"] = "BLOCKED";
    return UserStatus;
}({});

//# sourceMappingURL=usuario.enums.js.map