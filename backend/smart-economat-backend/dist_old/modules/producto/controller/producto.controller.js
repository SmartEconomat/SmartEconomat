'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'ProductoController', {
  enumerable: true,
  get: function () {
    return ProductoController;
  },
});
const _common = require('@nestjs/common');
const _productoservice = require('../service/producto.service');
const _swagger = require('@nestjs/swagger');
const _productfilterdto = require('../dto/product-filter.dto');
const _createproductodto = require('../dto/create-producto.dto');
const _updateproductodto = require('../dto/update-producto.dto');
const _productoentity = require('../producto.entity/producto.entity');
const _jwtauthguard = require('../../auth/guards/jwt-auth.guard');
const _requirepermissionsdecorator = require('../../../common/decorators/require-permissions.decorator');
const _permisosguard = require('../../authorization/guards/permisos.guard');
function _ts_decorate(decorators, target, key, desc) {
  var c = arguments.length,
    r =
      c < 3
        ? target
        : desc === null
          ? (desc = Object.getOwnPropertyDescriptor(target, key))
          : desc,
    d;
  if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
    r = Reflect.decorate(decorators, target, key, desc);
  else
    for (var i = decorators.length - 1; i >= 0; i--)
      if ((d = decorators[i]))
        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return (c > 3 && r && Object.defineProperty(target, key, r), r);
}
function _ts_metadata(k, v) {
  if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
    return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
  return function (target, key) {
    decorator(target, key, paramIndex);
  };
}
let ProductoController = class ProductoController {
  async generarEan13() {
    const codigo_barras = await this.productoService.generateUniqueEan13();
    return {
      codigo_barras,
    };
  }
  create(createProductoDto, req) {
    const userId = req.user?.sub;
    return this.productoService.create(createProductoDto, userId);
  }
  findAll(query) {
    return this.productoService.findAll(query);
  }
  findOne(id) {
    return this.productoService.findOne(id);
  }
  update(id, updateProductoDto, req) {
    const userId = req.user?.sub;
    return this.productoService.update(id, updateProductoDto, userId);
  }
  remove(id, req) {
    const userId = req.user?.sub;
    return this.productoService.remove(id, userId);
  }
  constructor(productoService) {
    this.productoService = productoService;
  }
};
_ts_decorate(
  [
    (0, _common.Get)('generar-ean13'),
    (0, _requirepermissionsdecorator.RequirePermissions)('productos:crear'),
    (0, _swagger.ApiOperation)({
      summary: 'Generar un código EAN-13 único',
    }),
    (0, _swagger.ApiResponse)({
      status: 200,
      description: 'docs.C_DIGO_GENERADO_CORRECTAMENTE',
    }),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', []),
    _ts_metadata('design:returntype', Promise),
  ],
  ProductoController.prototype,
  'generarEan13',
  null
);
_ts_decorate(
  [
    (0, _common.Post)(),
    (0, _requirepermissionsdecorator.RequirePermissions)('productos:crear'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    (0, _swagger.ApiOperation)({
      summary:
        'Crear un nuevo producto con opcionalmente alérgenos y proveedores',
    }),
    (0, _swagger.ApiResponse)({
      status: 201,
      description: 'docs.PRODUCTO_CREADO_CORRECTAMENTE',
      type: _productoentity.Producto,
    }),
    (0, _swagger.ApiResponse)({
      status: 400,
      description: 'docs.DATOS_INV_LIDOS_O_C_DIGO_DE_BARRAS_DUPLI',
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _createproductodto.CreateProductoDto === 'undefined'
        ? Object
        : _createproductodto.CreateProductoDto,
      Object,
    ]),
    _ts_metadata(
      'design:returntype',
      typeof Promise === 'undefined' ? Object : Promise
    ),
  ],
  ProductoController.prototype,
  'create',
  null
);
_ts_decorate(
  [
    (0, _common.Get)(),
    (0, _requirepermissionsdecorator.RequirePermissions)('productos:listar'),
    (0, _swagger.ApiOperation)({
      summary: 'Listar productos con filtros y paginación',
    }),
    (0, _swagger.ApiQuery)({
      name: 'page',
      required: false,
      type: Number,
    }),
    (0, _swagger.ApiQuery)({
      name: 'limit',
      required: false,
      type: Number,
    }),
    (0, _swagger.ApiQuery)({
      name: 'searchTerm',
      required: false,
      type: String,
    }),
    (0, _swagger.ApiQuery)({
      name: 'codigoBarras',
      required: false,
      type: String,
    }),
    _ts_param(0, (0, _common.Query)()),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _productfilterdto.ProductFilterDto === 'undefined'
        ? Object
        : _productfilterdto.ProductFilterDto,
    ]),
    _ts_metadata(
      'design:returntype',
      typeof Promise === 'undefined' ? Object : Promise
    ),
  ],
  ProductoController.prototype,
  'findAll',
  null
);
_ts_decorate(
  [
    (0, _common.Get)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('productos:ver'),
    (0, _swagger.ApiOperation)({
      summary: 'Obtener un producto por ID',
    }),
    (0, _swagger.ApiParam)({
      name: 'id',
      description: 'docs.UUID_DEL_PRODUCTO',
    }),
    (0, _swagger.ApiResponse)({
      status: 200,
      type: _productoentity.Producto,
    }),
    (0, _swagger.ApiResponse)({
      status: 404,
      description: 'docs.PRODUCTO_NO_ENCONTRADO',
    }),
    _ts_param(0, (0, _common.Param)('id', _common.ParseUUIDPipe)),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [String]),
    _ts_metadata(
      'design:returntype',
      typeof Promise === 'undefined' ? Object : Promise
    ),
  ],
  ProductoController.prototype,
  'findOne',
  null
);
_ts_decorate(
  [
    (0, _common.Patch)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('productos:editar'),
    (0, _swagger.ApiOperation)({
      summary: 'Actualizar un producto',
    }),
    (0, _swagger.ApiResponse)({
      status: 200,
      type: _productoentity.Producto,
    }),
    _ts_param(0, (0, _common.Param)('id', _common.ParseUUIDPipe)),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Request)()),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      String,
      typeof _updateproductodto.UpdateProductoDto === 'undefined'
        ? Object
        : _updateproductodto.UpdateProductoDto,
      Object,
    ]),
    _ts_metadata(
      'design:returntype',
      typeof Promise === 'undefined' ? Object : Promise
    ),
  ],
  ProductoController.prototype,
  'update',
  null
);
_ts_decorate(
  [
    (0, _common.Delete)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('productos:eliminar'),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    (0, _swagger.ApiOperation)({
      summary: 'Eliminar un producto',
    }),
    (0, _swagger.ApiResponse)({
      status: 204,
      description: 'docs.PRODUCTO_ELIMINADO',
    }),
    _ts_param(0, (0, _common.Param)('id', _common.ParseUUIDPipe)),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [String, Object]),
    _ts_metadata(
      'design:returntype',
      typeof Promise === 'undefined' ? Object : Promise
    ),
  ],
  ProductoController.prototype,
  'remove',
  null
);
ProductoController = _ts_decorate(
  [
    (0, _swagger.ApiTags)('Productos'),
    (0, _common.UseGuards)(
      _jwtauthguard.JwtAuthGuard,
      _permisosguard.PermisosGuard
    ),
    (0, _common.Controller)('productos'),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _productoservice.ProductoService === 'undefined'
        ? Object
        : _productoservice.ProductoService,
    ]),
  ],
  ProductoController
);
