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
    get dataSource () {
        return dataSource;
    },
    get runAllSeeders () {
        return runAllSeeders;
    },
    get runSeederByName () {
        return runSeederByName;
    }
});
require("reflect-metadata");
const _typeorm = require("typeorm");
const _fs = require("fs");
const _path = require("path");
const _dotenv = /*#__PURE__*/ _interop_require_wildcard(require("dotenv"));
const _seederi18nhelper = require("../common/helpers/seeder-i18n.helper");
const _databaseconfig = require("../config/database.config");
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
/* 
  dotenv.config({ path: join(__dirname, '../../../../.env.prod') }); 
  ⚠️ ADVERTENCIA: Esto solo debe usarse si entiendes perfectamente las implicaciones. 
  Nunca usar en producción real. 
  Solo habilitar en entornos de desarrollo controlados para pruebas específicas.
*/ _dotenv.config({
    path: (0, _path.join)(__dirname, '../../../../.env')
});
if (process.env.NODE_ENV === 'production') {
    console.error('No se permite ejecutar seeders en producción');
    process.exit(1);
}
const dataSource = new _typeorm.DataSource({
    ..._databaseconfig.dbConfig,
    entities: [
        (0, _path.join)(__dirname, '../**/*.entity.{ts,js}')
    ],
    migrations: [
        (0, _path.join)(__dirname, '../migrations/*.{ts,js}')
    ],
    synchronize: process.env.NODE_ENV === 'test' || process.argv.includes('reset'),
    dropSchema: process.argv.includes('reset')
});
async function runAllSeeders() {
    const seedersInOrder = [
        'roles-permisos.seeder',
        'usuario.seeder',
        'proveedor.seeder',
        'producto.seeder',
        'inventario.seeder',
        'pedido.seeder',
        'recepcion.seeder',
        'albaran.seeder',
        'historial-precio.seeder',
        'incidencia.seeder',
        'movimiento.seeder',
        'receta.seeder'
    ];
    for (const name of seedersInOrder){
        const fileTs = `${name}.ts`;
        const fileJs = `${name}.js`;
        const dirFiles = (0, _fs.readdirSync)(__dirname);
        const filePath = dirFiles.includes(fileTs) ? fileTs : dirFiles.includes(fileJs) ? fileJs : null;
        if (!filePath) {
            console.warn(`Seeder file not found for: ${name}`);
            continue;
        }
        const seederPath = (0, _path.join)(__dirname, filePath);
        const seeder = require(seederPath);
        if (typeof seeder.runSeeder === 'function') {
            console.log(_seederi18nhelper.SeederI18nHelper.getSeederMessage('running', {
                file: filePath
            }));
            await seeder.runSeeder(dataSource);
        }
    }
}
async function runSeederByName(name) {
    const fileTs = `${name}.seeder.ts`;
    const fileJs = `${name}.seeder.js`;
    const dirFiles = (0, _fs.readdirSync)(__dirname);
    const filePath = dirFiles.includes(fileTs) ? fileTs : dirFiles.includes(fileJs) ? fileJs : null;
    if (!filePath) {
        throw new Error(`${_seederi18nhelper.SeederI18nHelper.getError('SEEDER_NOT_FOUND')}: ${name}`);
    }
    const seeder = require((0, _path.join)(__dirname, filePath));
    if (typeof seeder.runSeeder !== 'function') {
        throw new Error(`${_seederi18nhelper.SeederI18nHelper.getError('RUN_SEEDER_NOT_FOUND')} ${filePath}`);
    }
    console.log(_seederi18nhelper.SeederI18nHelper.getSeederMessage('running', {
        file: filePath
    }));
    await seeder.runSeeder(dataSource);
}
if (require.main === module) {
    void (async ()=>{
        try {
            console.log('Iniciando seeders en entorno de desarrollo...');
            await dataSource.initialize();
            const [, , arg] = process.argv;
            if (!arg || arg === 'all' || arg === 'reset') {
                await runAllSeeders();
            } else {
                await runSeederByName(arg);
            }
            await dataSource.destroy();
            console.log('Seeder ejecutado correctamente en desarrollo.');
        } catch (err) {
            console.error('Error al ejecutar seeders: revisar usuario, password y base de datos de desarrollo', err);
            process.exit(1);
        }
    })();
}

//# sourceMappingURL=seed.js.map