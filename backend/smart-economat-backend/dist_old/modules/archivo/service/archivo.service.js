"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ArchivoService", {
    enumerable: true,
    get: function() {
        return ArchivoService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _config = require("@nestjs/config");
const _archivoentity = require("../archivo.entity/archivo.entity");
const _usuarioenums = require("../../usuario/enums/usuario.enums");
const _i18nhelper = require("../../../common/helpers/i18n.helper");
const _fs = /*#__PURE__*/ _interop_require_wildcard(require("fs"));
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
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let ArchivoService = class ArchivoService {
    async uploadFile(file, user) {
        if (!file) {
            throw new _common.BadRequestException(_i18nhelper.I18nHelper.getError('FILE_REQUIRED'));
        }
        let fileUrl = '';
        if (this.storageType === 'local') {
            fileUrl = `/api/v1/archivos/content/${file.filename}`;
        } else {
            fileUrl = file.path;
        }
        const newArchivo = this.archivoRepository.create({
            nombre: file.originalname,
            url: fileUrl,
            tamano: file.size,
            mimeType: file.mimetype,
            usuario: user
        });
        return await this.archivoRepository.save(newArchivo);
    }
    async findAll(filterDto) {
        const { page = 1, limit = 20, usuarioId, mimeType } = filterDto;
        const queryBuilder = this.archivoRepository.createQueryBuilder('archivo').leftJoinAndSelect('archivo.usuario', 'usuario').where('archivo.isDeleted = :isDeleted', {
            isDeleted: false
        });
        if (usuarioId) {
            queryBuilder.andWhere('usuario.id = :usuarioId', {
                usuarioId
            });
        }
        if (mimeType) {
            queryBuilder.andWhere('archivo.mimeType = :mimeType', {
                mimeType
            });
        }
        queryBuilder.skip((page - 1) * limit).take(limit).orderBy('archivo.createdAt', 'DESC');
        const [items, total] = await queryBuilder.getManyAndCount();
        return {
            data: items,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }
    async findOne(id) {
        const archivo = await this.archivoRepository.findOne({
            where: {
                id,
                isDeleted: false
            },
            relations: [
                'usuario'
            ]
        });
        if (!archivo) {
            throw new _common.NotFoundException(_i18nhelper.I18nHelper.getError('FILE_NOT_FOUND'));
        }
        return archivo;
    }
    getFileContent(filename) {
        if (this.storageType === 'local') {
            const uploadDirResolved = _path.resolve(this.uploadDir);
            const filePath = _path.resolve(this.uploadDir, filename);
            if (!filePath.startsWith(uploadDirResolved + _path.sep)) {
                throw new _common.BadRequestException(_i18nhelper.I18nHelper.getError('INVALID_FILE_PATH'));
            }
            if (!_fs.existsSync(filePath)) {
                throw new _common.NotFoundException(_i18nhelper.I18nHelper.getError('FILE_NOT_FOUND_PHYSICAL'));
            }
            return filePath;
        }
        throw new _common.BadRequestException(_i18nhelper.I18nHelper.getError('STORAGE_TYPE_LOCAL_ONLY'));
    }
    async remove(id, user) {
        const archivo = await this.findOne(id);
        if (archivo.usuario?.id !== user.id && user.rol !== _usuarioenums.rolUsuario.ADMINISTRADOR) {
            throw new _common.ForbiddenException(_i18nhelper.I18nHelper.getError('FILE_DELETE_FORBIDDEN'));
        }
        archivo.isDeleted = true;
        await this.archivoRepository.save(archivo);
        await this.archivoRepository.softRemove(archivo);
    }
    constructor(archivoRepository, configService){
        this.archivoRepository = archivoRepository;
        this.configService = configService;
        this.storageType = this.configService.get('STORAGE_TYPE', 'local');
        this.uploadDir = this.configService.get('LOCAL_STORAGE_PATH', './uploads');
    }
};
ArchivoService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_archivoentity.Archivo)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], ArchivoService);

//# sourceMappingURL=archivo.service.js.map