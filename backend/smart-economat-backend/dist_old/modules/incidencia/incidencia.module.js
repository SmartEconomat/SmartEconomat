"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "IncidenciaModule", {
    enumerable: true,
    get: function() {
        return IncidenciaModule;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _incidenciaentity = require("./incidencia.entity/incidencia.entity");
const _incidencialineaentity = require("./incidencia-linea.entity/incidencia-linea.entity");
const _incidenciaresueltaentity = require("./incidencia-resuelta.entity/incidencia-resuelta.entity");
const _incidenciarepository = require("./repository/incidencia.repository");
const _incidenciaresueltarepository = require("./repository/incidencia-resuelta.repository");
const _recepcionentity = require("../recepcion/recepcion.entity/recepcion.entity");
const _movimientomodule = require("../movimiento/movimiento.module");
const _movimientohelper = require("../../common/helpers/movimiento.helper");
const _incidenciaservice = require("./service/incidencia.service");
const _incidenciaresueltaservice = require("./service/incidencia-resuelta.service");
const _incidenciacontroller = require("./controller/incidencia.controller");
const _incidenciaresueltacontroller = require("./controller/incidencia-resuelta.controller");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let IncidenciaModule = class IncidenciaModule {
};
IncidenciaModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _incidenciaentity.Incidencia,
                _incidencialineaentity.IncidenciaLinea,
                _incidenciaresueltaentity.IncidenciaResuelta,
                _recepcionentity.Recepcion
            ]),
            _movimientomodule.MovimientoModule
        ],
        controllers: [
            _incidenciacontroller.IncidenciaController,
            _incidenciaresueltacontroller.IncidenciaResuelaController
        ],
        providers: [
            _incidenciaservice.IncidenciaService,
            _incidenciarepository.IncidenciaRepository,
            _incidenciaresueltaservice.IncidenciaResuelaService,
            _incidenciaresueltarepository.IncidenciaResuelaRepository,
            _movimientohelper.MovimientoHelper
        ],
        exports: [
            _incidenciaservice.IncidenciaService,
            _incidenciaresueltaservice.IncidenciaResuelaService
        ]
    })
], IncidenciaModule);

//# sourceMappingURL=incidencia.module.js.map