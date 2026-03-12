"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "runSeeder", {
    enumerable: true,
    get: function() {
        return runSeeder;
    }
});
const _usuarioentity = require("../modules/usuario/usuario.entity/usuario.entity");
const _profesorentity = require("../modules/profesor/profesor.entity/profesor.entity");
const _alumnoentity = require("../modules/alumno/alumno.entity/alumno.entity");
const _alumnoslotentity = require("../modules/profesor/profesor.entity/alumno-slot.entity");
const _usuarioenums = require("../modules/usuario/enums/usuario.enums");
const _seederi18nhelper = require("../common/helpers/seeder-i18n.helper");
const _bcrypt = /*#__PURE__*/ _interop_require_wildcard(require("bcrypt"));
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
const runSeeder = async (dataSource)=>{
    const { faker } = await Promise.resolve().then(()=>/*#__PURE__*/ _interop_require_wildcard(require("@faker-js/faker")));
    await dataSource.transaction(async (manager)=>{
        const defaultPassword = await _bcrypt.hash('SmartEconomat2026!', 10);
        let adminUser = await manager.findOne(_usuarioentity.Usuario, {
            where: {
                username: 'admin'
            }
        });
        if (!adminUser) {
            adminUser = manager.create(_usuarioentity.Usuario, {
                username: 'admin',
                password: defaultPassword,
                email: 'admin@smarteconomat.com',
                rol: _usuarioenums.rolUsuario.ADMINISTRADOR,
                status: _usuarioenums.UserStatus.ACTIVE
            });
            await manager.save(adminUser);
        }
        const professorsToCreate = [
            {
                username: 'profesor1',
                email: 'profesor1@smarteconomat.com',
                cial: 'CIAL-11111'
            },
            {
                username: 'profesor2',
                email: 'profesor2@smarteconomat.com',
                cial: 'CIAL-22222'
            },
            {
                username: 'profesor3',
                email: 'profesor3@smarteconomat.com',
                cial: 'CIAL-33333'
            }
        ];
        const aulas = [
            'Aula A',
            'Aula B',
            'Aula C'
        ];
        for (const profData of professorsToCreate){
            let profUser = await manager.findOne(_usuarioentity.Usuario, {
                where: {
                    username: profData.username
                }
            });
            let profEntity;
            if (!profUser) {
                profUser = manager.create(_usuarioentity.Usuario, {
                    username: profData.username,
                    password: defaultPassword,
                    email: profData.email,
                    rol: _usuarioenums.rolUsuario.PROFESOR,
                    status: _usuarioenums.UserStatus.ACTIVE,
                    activo: true
                });
                await manager.save(profUser);
                profEntity = manager.create(_profesorentity.Profesor, {
                    user: profUser,
                    cial: profData.cial
                });
                await manager.save(profEntity);
            } else {
                profEntity = await manager.findOne(_profesorentity.Profesor, {
                    where: {
                        user: {
                            id: profUser.id
                        }
                    }
                });
            }
            if (!profEntity) continue;
            for (const aulaName of aulas){
                for(let i = 1; i <= 5; i++){
                    const numeroClase = i;
                    let slot = await manager.findOne(_alumnoslotentity.AlumnoSlot, {
                        where: {
                            profesor: {
                                id: profEntity.id
                            },
                            aula: aulaName,
                            numeroClase
                        },
                        relations: [
                            'alumno'
                        ]
                    });
                    if (!slot) {
                        slot = manager.create(_alumnoslotentity.AlumnoSlot, {
                            profesor: profEntity,
                            aula: aulaName,
                            numeroClase
                        });
                        await manager.save(slot);
                    }
                    if (slot.alumno) continue;
                    const firstName = faker.person.firstName();
                    const lastName = faker.person.lastName();
                    const username = faker.internet.username({
                        firstName,
                        lastName
                    }).toLowerCase() + faker.number.int(999);
                    const studentEmail = faker.internet.email({
                        firstName,
                        lastName
                    }).toLowerCase();
                    const statusValue = faker.helpers.arrayElement([
                        _usuarioenums.UserStatus.ACTIVE,
                        _usuarioenums.UserStatus.INACTIVE
                    ]);
                    const studentUser = manager.create(_usuarioentity.Usuario, {
                        username,
                        password: defaultPassword,
                        email: studentEmail,
                        rol: _usuarioenums.rolUsuario.ALUMNO,
                        status: statusValue,
                        activo: statusValue === _usuarioenums.UserStatus.ACTIVE
                    });
                    await manager.save(studentUser);
                    const alumnoEntity = manager.create(_alumnoentity.Alumno, {
                        user: studentUser,
                        slot: slot
                    });
                    await manager.save(alumnoEntity);
                }
            }
        }
        console.log(_seederi18nhelper.SeederI18nHelper.getSeederSuccess('usuarios, profesores, aulas y alumnos detallados'));
    });
};

//# sourceMappingURL=usuario.seeder.js.map