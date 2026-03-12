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
    get AppDataSource () {
        return AppDataSource;
    },
    get dbConfig () {
        return dbConfig;
    },
    get typeOrmConfig () {
        return typeOrmConfig;
    }
});
const _typeorm = require("typeorm");
const _dotenv = /*#__PURE__*/ _interop_require_wildcard(require("dotenv"));
const _path = require("path");
const _fs = require("fs");
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
const envPaths = [
    (0, _path.join)(process.cwd(), '.env'),
    (0, _path.join)(process.cwd(), '../../.env'),
    (0, _path.join)(process.cwd(), '../../.env.dev')
];
for (const path of envPaths){
    if ((0, _fs.existsSync)(path)) {
        _dotenv.config({
            path
        });
        console.log(`Loaded environment from ${path}`);
        break;
    }
}
const isDocker = (0, _fs.existsSync)('/.dockerenv');
const dbHost = process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost';
const finalHost = !isDocker && dbHost === 'db' ? 'localhost' : dbHost;
const dbConfig = {
    type: 'postgres',
    host: finalHost,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || process.env.POSTGRES_USER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || process.env.POSTGRES_DB || 'smart_economat',
    synchronize: process.env.DB_SYNC === 'true' || process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test',
    logging: process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test',
    entities: [
        (0, _path.join)(__dirname, '../**/*.entity.{ts,js}')
    ],
    migrations: [
        (0, _path.join)(__dirname, '../migrations/*.{ts,js}')
    ],
    subscribers: []
};
if (process.env.NODE_ENV !== 'production') {
    console.log('Database Config:', {
        ...dbConfig,
        password: '*****'
    });
}
const AppDataSource = new _typeorm.DataSource(dbConfig);
const typeOrmConfig = {
    ...dbConfig,
    autoLoadEntities: true
};

//# sourceMappingURL=database.config.js.map