"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuthModule", {
    enumerable: true,
    get: function() {
        return AuthModule;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _jwt = require("@nestjs/jwt");
const _passport = require("@nestjs/passport");
const _config = require("@nestjs/config");
const _authservice = require("../auth.service/auth.service");
const _mailservice = require("../mail.service");
const _jwtstrategy = require("../strategies/jwt.strategy");
const _authcontroller = require("../controller/auth.controller");
const _jwtauthguard = require("../guards/jwt-auth.guard");
const _roleguard = require("../guards/role.guard");
const _usuarioentity = require("../../usuario/usuario.entity/usuario.entity");
const _authorizationmodule = require("../../authorization/authorization.module");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let AuthModule = class AuthModule {
};
AuthModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _usuarioentity.Usuario
            ]),
            _passport.PassportModule.register({
                defaultStrategy: 'jwt'
            }),
            _jwt.JwtModule.registerAsync({
                inject: [
                    _config.ConfigService
                ],
                useFactory: (config)=>({
                        secret: config.getOrThrow('JWT_SECRET'),
                        signOptions: {
                            expiresIn: config.getOrThrow('JWT_EXPIRATION')
                        }
                    })
            }),
            (0, _common.forwardRef)(()=>_authorizationmodule.AuthorizationModule)
        ],
        controllers: [
            _authcontroller.AuthController
        ],
        providers: [
            _authservice.AuthService,
            _mailservice.MailService,
            _jwtstrategy.JwtStrategy,
            _jwtauthguard.JwtAuthGuard,
            _roleguard.RolesGuard
        ],
        exports: [
            _passport.PassportModule,
            _jwt.JwtModule,
            _jwtauthguard.JwtAuthGuard,
            _roleguard.RolesGuard
        ]
    })
], AuthModule);

//# sourceMappingURL=auth.module.js.map