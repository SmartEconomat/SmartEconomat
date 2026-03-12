"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "I18nConfigModule", {
    enumerable: true,
    get: function() {
        return I18nConfigModule;
    }
});
const _common = require("@nestjs/common");
const _nestjsi18n = require("nestjs-i18n");
const _path = /*#__PURE__*/ _interop_require_wildcard(require("path"));
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
/**
 * Módulo de configuración para la internacionalización (i18n) de la aplicación.
 * Configura `nestjs-i18n` para manejar múltiples idiomas, resolvers y archivos de traducción.
 *
 * Configuración principal:
 * - **Idioma por defecto:** Español ('es').
 * - **Ubicación de archivos:** `src/i18n/` (dev) o `dist/i18n/` (prod).
 * - **Resolvers:**
 *   1. Query param: `?lang=en`
 *   2. Header estándar: `Accept-Language`
 *   3. Header personalizado: `x-custom-lang`
 *
 * @module I18nConfigModule
 */ const isProduction = process.env.NODE_ENV === 'production';
const i18nPath = isProduction ? _path.join(__dirname, '../i18n/') : _path.join(process.cwd(), 'src/i18n/');
let I18nConfigModule = class I18nConfigModule {
};
I18nConfigModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _nestjsi18n.I18nModule.forRoot({
                fallbackLanguage: 'es',
                loaderOptions: {
                    path: i18nPath,
                    watch: !isProduction && process.env.NODE_ENV !== 'test'
                },
                resolvers: [
                    {
                        use: _nestjsi18n.QueryResolver,
                        options: [
                            'lang'
                        ]
                    },
                    _nestjsi18n.AcceptLanguageResolver,
                    new _nestjsi18n.HeaderResolver([
                        'x-custom-lang'
                    ])
                ]
            })
        ],
        exports: [
            _nestjsi18n.I18nModule
        ]
    })
], I18nConfigModule);

//# sourceMappingURL=i18n.module.js.map