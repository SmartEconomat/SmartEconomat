"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
require("./instrument");
const _core = require("@nestjs/core");
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _nestjsi18n = require("nestjs-i18n");
const _appmodule = require("./app.module");
const _transforminterceptor = require("./common/interceptors/transform.interceptor");
const _globalexceptionfilter = require("./common/filters/global-exception.filter");
const _cookieparser = /*#__PURE__*/ _interop_require_default(require("cookie-parser"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
async function bootstrap() {
    const app = await _core.NestFactory.create(_appmodule.AppModule);
    app.setGlobalPrefix('api/v1');
    app.use((0, _cookieparser.default)());
    const config = new _swagger.DocumentBuilder().setTitle('SmartEconomat API').setDescription('API para la gestión de economato y stock').setVersion('1.0').addTag('SmartEconomat').build();
    const document = _swagger.SwaggerModule.createDocument(app, config);
    _swagger.SwaggerModule.setup('docs', app, document);
    app.useGlobalPipes(new _nestjsi18n.I18nValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true
        }
    }));
    app.useGlobalFilters(new _globalexceptionfilter.GlobalExceptionFilter());
    app.useGlobalInterceptors(new _common.ClassSerializerInterceptor(app.get(_core.Reflector)), new _transforminterceptor.TransformInterceptor());
    await app.listen(process.env.BACKEND_PORT ?? 3000);
}
void bootstrap();

//# sourceMappingURL=main.js.map