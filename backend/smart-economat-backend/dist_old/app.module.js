"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AppModule", {
    enumerable: true,
    get: function() {
        return AppModule;
    }
});
const _common = require("@nestjs/common");
const _setup = require("@sentry/nestjs/setup");
const _config = require("@nestjs/config");
const _appcontroller = require("./app.controller");
const _appservice = require("./app.service");
const _typeorm = require("@nestjs/typeorm");
const _pedidomodule = require("./modules/pedido/pedido.module");
const _productomodule = require("./modules/producto/producto.module");
const _proveedormodule = require("./modules/proveedor/proveedor.module");
const _movimientomodule = require("./modules/movimiento/movimiento.module");
const _databaseconfig = require("./config/database.config");
const _i18nmodule = require("./config/i18n.module");
const _recepcionmodule = require("./modules/recepcion/recepcion.module");
const _usuariomodule = require("./modules/usuario/usuario.module");
const _recetamodule = require("./modules/receta/receta.module");
const _dashboardmodule = require("./modules/dashboard/dashboard.module");
const _inventariomodule = require("./modules/inventario/inventario.module");
const _albaranmodule = require("./modules/albaran/albaran.module");
const _ubicacionmodule = require("./modules/ubicacion/ubicacion.module");
const _incidenciamodule = require("./modules/incidencia/incidencia.module");
const _archivomodule = require("./modules/archivo/archivo.module");
const _profesormodule = require("./modules/profesor/profesor.module");
const _alumnomodule = require("./modules/alumno/alumno.module");
const _adminmodule = require("./modules/admin/admin.module");
const _permisosmodule = require("./modules/permisos/permisos.module");
const _authorizationmodule = require("./modules/authorization/authorization.module");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let AppModule = class AppModule {
};
AppModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _setup.SentryModule.forRoot(),
            _config.ConfigModule.forRoot({
                isGlobal: true
            }),
            _typeorm.TypeOrmModule.forRoot(_databaseconfig.typeOrmConfig),
            _i18nmodule.I18nConfigModule,
            _usuariomodule.UsuarioModule,
            _pedidomodule.PedidoModule,
            _productomodule.ProductoModule,
            _movimientomodule.MovimientoModule,
            _recepcionmodule.RecepcionModule,
            _recetamodule.RecetaModule,
            _proveedormodule.ProveedorModule,
            _dashboardmodule.DashboardModule,
            _inventariomodule.InventarioModule,
            _albaranmodule.AlbaranModule,
            _ubicacionmodule.UbicacionModule,
            _incidenciamodule.IncidenciaModule,
            _archivomodule.ArchivoModule,
            _profesormodule.ProfesorModule,
            _alumnomodule.AlumnoModule,
            _adminmodule.AdminModule,
            _permisosmodule.PermisosModule,
            _authorizationmodule.AuthorizationModule
        ],
        controllers: [
            _appcontroller.AppController
        ],
        providers: [
            _appservice.AppService
        ]
    })
], AppModule);

//# sourceMappingURL=app.module.js.map