"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "JwtStrategy", {
    enumerable: true,
    get: function() {
        return JwtStrategy;
    }
});
const _common = require("@nestjs/common");
const _passport = require("@nestjs/passport");
const _passportjwt = require("passport-jwt");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _config = require("@nestjs/config");
const _usuarioentity = require("../../usuario/usuario.entity/usuario.entity");
const _usuarioenums = require("../../usuario/enums/usuario.enums");
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
const cookieExtractor = (req)=>{
    let token = null;
    if (req && req.cookies) {
        token = req.cookies['access_token'];
    }
    return token;
};
let JwtStrategy = class JwtStrategy extends (0, _passport.PassportStrategy)(_passportjwt.Strategy) {
    async validate(payload) {
        const user = await this.usuarioRepo.findOne({
            where: {
                id: payload.sub,
                status: _usuarioenums.UserStatus.ACTIVE
            }
        });
        if (!user) throw new _common.UnauthorizedException();
        return {
            id: user.id,
            username: user.username,
            rol: user.rol
        };
    }
    constructor(usuarioRepo, configService){
        super({
            jwtFromRequest: _passportjwt.ExtractJwt.fromExtractors([
                cookieExtractor,
                _passportjwt.ExtractJwt.fromAuthHeaderAsBearerToken()
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow('JWT_SECRET')
        }), this.usuarioRepo = usuarioRepo;
    }
};
JwtStrategy = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_usuarioentity.Usuario)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], JwtStrategy);

//# sourceMappingURL=jwt.strategy.js.map