'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
function _export(target, all) {
  for (var name in all)
    Object.defineProperty(target, name, {
      enumerable: true,
      get: Object.getOwnPropertyDescriptor(all, name).get,
    });
}
_export(exports, {
  get CreateRecepcionDto() {
    return CreateRecepcionDto;
  },
  get PedidoRecepcionDto() {
    return PedidoRecepcionDto;
  },
  get ProductoNuevoDto() {
    return ProductoNuevoDto;
  },
  get ProductoNuevoRecepcionDto() {
    return ProductoNuevoRecepcionDto;
  },
  get RecepcionLineDto() {
    return RecepcionLineDto;
  },
});
const _classvalidator = require('class-validator');
const _classtransformer = require('class-transformer');
const _swagger = require('@nestjs/swagger');
const _estadovisualenum = require('../enums/estado-visual.enum');
const _productoenums = require('../../producto/enums/producto.enums');
const _trimstringtransformer = require('../../../common/transformers/trim-string.transformer');
const _stringtodatetransformer = require('../../../common/transformers/string-to-date.transformer');
const _stringtobooleantransformer = require('../../../common/transformers/string-to-boolean.transformer');
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
let ProductoNuevoDto = class ProductoNuevoDto {};
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.INDICA_SI_ESTE_PRODUCTO_DEBE_CREARSE_EN',
      example: true,
    }),
    (0, _classvalidator.IsBoolean)(),
    _ts_metadata('design:type', Boolean),
  ],
  ProductoNuevoDto.prototype,
  'pendienteCreacion',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.C_DIGO_DE_BARRAS_ESCANEADO',
      example: '8410188003028',
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata('design:type', String),
  ],
  ProductoNuevoDto.prototype,
  'codigoBarras',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.NOMBRE_INTRODUCIDO_POR_EL_OPERARIO',
      example: 'Tomate frito',
    }),
    (0, _classtransformer.Transform)(
      _trimstringtransformer.TrimStringTransformer.transform
    ),
    (0, _classvalidator.IsString)(),
    _ts_metadata('design:type', String),
  ],
  ProductoNuevoDto.prototype,
  'nombre',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'docs.MARCA_OPCIONAL',
      example: 'Orlando',
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(
      _trimstringtransformer.TrimStringTransformer.transform
    ),
    (0, _classvalidator.IsString)(),
    _ts_metadata('design:type', String),
  ],
  ProductoNuevoDto.prototype,
  'marca',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.UNIDAD_DE_MEDIDA',
      enum: _productoenums.UnidadMedida,
    }),
    (0, _classvalidator.IsEnum)(_productoenums.UnidadMedida),
    _ts_metadata(
      'design:type',
      typeof _productoenums.UnidadMedida === 'undefined'
        ? Object
        : _productoenums.UnidadMedida
    ),
  ],
  ProductoNuevoDto.prototype,
  'unidad',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.TIPO_DE_PRODUCTO',
      enum: _productoenums.TipoProducto,
    }),
    (0, _classvalidator.IsEnum)(_productoenums.TipoProducto),
    _ts_metadata(
      'design:type',
      typeof _productoenums.TipoProducto === 'undefined'
        ? Object
        : _productoenums.TipoProducto
    ),
  ],
  ProductoNuevoDto.prototype,
  'tipo',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.CONTENIDO_NETO_PESO_VOLUMEN',
      example: 400,
    }),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0),
    _ts_metadata('design:type', Number),
  ],
  ProductoNuevoDto.prototype,
  'contenido',
  void 0
);
let RecepcionLineDto = class RecepcionLineDto {};
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.ID_DE_LA_L_NEA_ORIGINAL_DEL_PEDIDO',
      example: 'uuid-string',
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata('design:type', String),
  ],
  RecepcionLineDto.prototype,
  'pedidoProductoId',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.CANTIDAD_REALMENTE_RECIBIDA',
      example: 10,
      minimum: 0,
    }),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0),
    _ts_metadata('design:type', Number),
  ],
  RecepcionLineDto.prototype,
  'cantidadRecibida',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'docs.CANTIDAD_CONTADA_O_REPORTADA_EN_EL_ALBAR',
      example: 10,
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0),
    _ts_metadata('design:type', Number),
  ],
  RecepcionLineDto.prototype,
  'cantidadAlbaran',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'docs.ESTADO_EXTERIOR_VISUAL_CON_EL_QUE_LLEGA',
      enum: _estadovisualenum.EstadoVisualProducto,
      example: _estadovisualenum.EstadoVisualProducto.OPTIMO,
    }),
    (0, _classvalidator.IsEnum)(_estadovisualenum.EstadoVisualProducto),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata(
      'design:type',
      typeof _estadovisualenum.EstadoVisualProducto === 'undefined'
        ? Object
        : _estadovisualenum.EstadoVisualProducto
    ),
  ],
  RecepcionLineDto.prototype,
  'estadoVisual',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'docs.FECHA_DE_CADUCIDAD_DEL_LOTE_F_SICO_RECIB',
      example: '2026-10-15T00:00:00.000Z',
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(() => Date),
    (0, _classtransformer.Transform)(
      _stringtodatetransformer.StringToDateTransformer.transform
    ),
    _ts_metadata('design:type', typeof Date === 'undefined' ? Object : Date),
  ],
  RecepcionLineDto.prototype,
  'fechaCaducidad',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'Observaciones de la línea (e.g. "Caja abollada")',
      example: 'Sin daños',
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(
      _trimstringtransformer.TrimStringTransformer.transform
    ),
    (0, _classvalidator.IsString)(),
    _ts_metadata('design:type', String),
  ],
  RecepcionLineDto.prototype,
  'observaciones',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'docs.INDICA_SI_EL_PESO_SE_OBTUVO_DESDE_LA_B_S',
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(
      _stringtobooleantransformer.StringToBooleanTransformer.transform
    ),
    (0, _classvalidator.IsBoolean)(),
    _ts_metadata('design:type', Boolean),
  ],
  RecepcionLineDto.prototype,
  'isWeighedWithScale',
  void 0
);
let ProductoNuevoRecepcionDto = class ProductoNuevoRecepcionDto extends ProductoNuevoDto {};
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.CANTIDAD_REALMENTE_RECIBIDA_DEL_NUEVO_PR',
      example: 10,
      minimum: 0,
    }),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0),
    _ts_metadata('design:type', Number),
  ],
  ProductoNuevoRecepcionDto.prototype,
  'cantidadRecibida',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'docs.OBSERVACIONES_DEL_NUEVO_PRODUCTO',
      example: 'Caja abollada',
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(
      _trimstringtransformer.TrimStringTransformer.transform
    ),
    (0, _classvalidator.IsString)(),
    _ts_metadata('design:type', String),
  ],
  ProductoNuevoRecepcionDto.prototype,
  'observaciones',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'docs.INDICA_SI_EL_PESO_SE_OBTUVO_DESDE_LA_B_S',
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(
      _stringtobooleantransformer.StringToBooleanTransformer.transform
    ),
    (0, _classvalidator.IsBoolean)(),
    _ts_metadata('design:type', Boolean),
  ],
  ProductoNuevoRecepcionDto.prototype,
  'isWeighedWithScale',
  void 0
);
let PedidoRecepcionDto = class PedidoRecepcionDto {};
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.ID_DEL_PEDIDO_AL_QUE_PERTENECE_LA_RECEPC',
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata('design:type', String),
  ],
  PedidoRecepcionDto.prototype,
  'pedidoId',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'docs.N_DE_ALBAR_N_REFERENCIADO_EN_EL_PEDIDO',
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(
      _trimstringtransformer.TrimStringTransformer.transform
    ),
    (0, _classvalidator.IsString)(),
    _ts_metadata('design:type', String),
  ],
  PedidoRecepcionDto.prototype,
  'nAlbaran',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'docs.FIRMA_OBSERVACIONES_GENERALES_PARA_EL_PE',
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(
      _trimstringtransformer.TrimStringTransformer.transform
    ),
    (0, _classvalidator.IsString)(),
    _ts_metadata('design:type', String),
  ],
  PedidoRecepcionDto.prototype,
  'observaciones',
  void 0
);
let CreateRecepcionDto = class CreateRecepcionDto {};
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'docs.IDS_DE_PEDIDOS_VINCULADOS_A_ESTA_RECEPCI',
      type: [String],
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.IsString)({
      each: true,
    }),
    _ts_metadata('design:type', Array),
  ],
  CreateRecepcionDto.prototype,
  'pedidoIds',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'docs.PEDIDOS_CON_SU_ALBAR_N_INDIVIDUAL',
      type: [PedidoRecepcionDto],
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.ValidateNested)({
      each: true,
    }),
    (0, _classtransformer.Type)(() => PedidoRecepcionDto),
    _ts_metadata('design:type', Array),
  ],
  CreateRecepcionDto.prototype,
  'pedidos',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'docs.N_MERO_DE_ALBAR_N_GENERAL_DE_ENTREGA',
      example: 'ALB-2023-001',
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(
      _trimstringtransformer.TrimStringTransformer.transform
    ),
    (0, _classvalidator.IsString)(),
    _ts_metadata('design:type', String),
  ],
  CreateRecepcionDto.prototype,
  'nAlbaran',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'docs.FECHA_DE_RECEPCI_N_POR_DEFECTO_CURRENT_T',
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(() => Date),
    (0, _classtransformer.Transform)(
      _stringtodatetransformer.StringToDateTransformer.transform
    ),
    _ts_metadata('design:type', typeof Date === 'undefined' ? Object : Date),
  ],
  CreateRecepcionDto.prototype,
  'fechaRecepcion',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'docs.OBSERVACIONES_GENERALES_O_FIRMA_DE_RECEP',
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(
      _trimstringtransformer.TrimStringTransformer.transform
    ),
    (0, _classvalidator.IsString)(),
    _ts_metadata('design:type', String),
  ],
  CreateRecepcionDto.prototype,
  'observaciones',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.L_NEAS_VINCULADAS_A_PEDIDOS',
      type: [RecepcionLineDto],
    }),
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.ValidateNested)({
      each: true,
    }),
    (0, _classtransformer.Type)(() => RecepcionLineDto),
    _ts_metadata('design:type', Array),
  ],
  CreateRecepcionDto.prototype,
  'productos',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'docs.PRODUCTOS_NUEVOS_A_CREAR_EN_LA_MISMA_TRA',
      type: [ProductoNuevoRecepcionDto],
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.ValidateNested)({
      each: true,
    }),
    (0, _classtransformer.Type)(() => ProductoNuevoRecepcionDto),
    _ts_metadata('design:type', Array),
  ],
  CreateRecepcionDto.prototype,
  'productosNuevos',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.ID_DEL_USUARIO_OPERARIO_USUALMENTE_SACAD',
      example: 'uuid-string',
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata('design:type', String),
  ],
  CreateRecepcionDto.prototype,
  'usuarioId',
  void 0
);
