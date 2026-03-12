"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AlumnoController", {
    enumerable: true,
    get: function() {
        return AlumnoController;
    }
});
const _common = require("@nestjs/common");
const _jwtauthguard = require("../../auth/guards/jwt-auth.guard");
const _getuserdecorator = require("../../auth/decorators/get-user.decorator");
const _usuarioentity = require("../../usuario/usuario.entity/usuario.entity");
const _alumnoservice = require("../service/alumno.service");
const _registeralumnodto = require("../dto/register-alumno.dto");
const _changeprofesordto = require("../dto/change-profesor.dto");
const _requirepermissionsdecorator = require("../../../common/decorators/require-permissions.decorator");
const _permisosguard = require("../../authorization/guards/permisos.guard");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let AlumnoController = class AlumnoController {
    async register(dto) {
        return this.alumnoService.register(dto);
    }
    async changeProfesor(user, dto) {
        return this.alumnoService.changeProfesor(user.id, user.id, user.rol, dto);
    }
    constructor(alumnoService){
        this.alumnoService = alumnoService;
    }
};
_ts_decorate([
    (0, _common.Post)('register'),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _registeralumnodto.RegisterAlumnoDto === "undefined" ? Object : _registeralumnodto.RegisterAlumnoDto
    ]),
    _ts_metadata("design:returntype", Promise)
], AlumnoController.prototype, "register", null);
_ts_decorate([
    (0, _common.Patch)('change-profesor'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _permisosguard.PermisosGuard),
    (0, _requirepermissionsdecorator.RequirePermissions)('alumno:cambiar_profesor'),
    _ts_param(0, (0, _getuserdecorator.GetUser)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _usuarioentity.Usuario === "undefined" ? Object : _usuarioentity.Usuario,
        typeof _changeprofesordto.ChangeProfesorDto === "undefined" ? Object : _changeprofesordto.ChangeProfesorDto
    ]),
    _ts_metadata("design:returntype", Promise)
], AlumnoController.prototype, "changeProfesor", null);
AlumnoController = _ts_decorate([
    (0, _common.Controller)('alumnos'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _alumnoservice.AlumnoService === "undefined" ? Object : _alumnoservice.AlumnoService
    ])
], AlumnoController);

//# sourceMappingURL=alumno.controller.js.map