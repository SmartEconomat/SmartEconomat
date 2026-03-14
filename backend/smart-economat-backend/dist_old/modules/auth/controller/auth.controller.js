"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AuthController", {
    enumerable: true,
    get: function() {
        return AuthController;
    }
});
const _i18nhelper = require("../../../common/helpers/i18n.helper");
const _common = require("@nestjs/common");
const _authservice = require("../auth.service/auth.service");
const _registeruserdto = require("../dto/register-user.dto");
const _loginuserdto = require("../dto/login-user.dto");
const _forgotpassworddto = require("../dto/forgot-password.dto");
const _resetpassworddto = require("../dto/reset-password.dto");
const _changepassworddto = require("../dto/change-password.dto");
const _jwtauthguard = require("../guards/jwt-auth.guard");
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
let AuthController = class AuthController {
    async register(dto, res) {
        const tokenData = await this.authService.register(dto);
        res.cookie('access_token', tokenData.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 1000 * 60 * 60 * 24 * 7
        });
        return tokenData;
    }
    async login(dto, res) {
        const result = await this.authService.login(dto);
        if (result.access_token) {
            res.cookie('access_token', result.access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 1000 * 60 * 60 * 24 * 7
            });
        }
        return result;
    }
    async forgotPassword(dto) {
        await this.authService.forgotPassword(dto.email);
        return {
            message: _i18nhelper.I18nHelper.translate('messages.SI_EL_CORREO_EST_REGISTRADO_RECIBIR_S_UN')
        };
    }
    async resetPassword(dto) {
        await this.authService.resetPassword(dto.token, dto.newPassword);
        return {
            message: _i18nhelper.I18nHelper.translate('messages.CONTRASE_A_RESTABLECIDA_CORRECTAMENTE')
        };
    }
    async changePassword(req, dto) {
        const user = req.user;
        await this.authService.changePassword(user.id, dto.currentPassword, dto.newPassword);
        return {
            message: _i18nhelper.I18nHelper.translate('messages.CONTRASE_A_CAMBIADA_CORRECTAMENTE')
        };
    }
    constructor(authService){
        this.authService = authService;
    }
};
_ts_decorate([
    (0, _common.Post)('register'),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Res)({
        passthrough: true
    })),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _registeruserdto.RegisterUserDto === "undefined" ? Object : _registeruserdto.RegisterUserDto,
        typeof Response === "undefined" ? Object : Response
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
_ts_decorate([
    (0, _common.Post)('login'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Res)({
        passthrough: true
    })),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _loginuserdto.LoginUserDto === "undefined" ? Object : _loginuserdto.LoginUserDto,
        typeof Response === "undefined" ? Object : Response
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
_ts_decorate([
    (0, _common.Post)('forgot-password'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _forgotpassworddto.ForgotPasswordDto === "undefined" ? Object : _forgotpassworddto.ForgotPasswordDto
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
_ts_decorate([
    (0, _common.Post)('reset-password'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _resetpassworddto.ResetPasswordDto === "undefined" ? Object : _resetpassworddto.ResetPasswordDto
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Post)('change-password'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof Request === "undefined" ? Object : Request,
        typeof _changepassworddto.ChangePasswordDto === "undefined" ? Object : _changepassworddto.ChangePasswordDto
    ]),
    _ts_metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
AuthController = _ts_decorate([
    (0, _common.Controller)('auth'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _authservice.AuthService === "undefined" ? Object : _authservice.AuthService
    ])
], AuthController);

//# sourceMappingURL=auth.controller.js.map