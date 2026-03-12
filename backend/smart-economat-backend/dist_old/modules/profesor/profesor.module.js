"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ProfesorModule", {
    enumerable: true,
    get: function() {
        return ProfesorModule;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _profesorentity = require("./profesor.entity/profesor.entity");
const _alumnoslotentity = require("./profesor.entity/alumno-slot.entity");
const _profesorcontroller = require("./controller/profesor.controller");
const _profesorservice = require("./service/profesor.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let ProfesorModule = class ProfesorModule {
};
ProfesorModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _profesorentity.Profesor,
                _alumnoslotentity.AlumnoSlot
            ])
        ],
        controllers: [
            _profesorcontroller.ProfesorController
        ],
        providers: [
            _profesorservice.ProfesorService
        ],
        exports: [
            _profesorservice.ProfesorService
        ]
    })
], ProfesorModule);

//# sourceMappingURL=profesor.module.js.map