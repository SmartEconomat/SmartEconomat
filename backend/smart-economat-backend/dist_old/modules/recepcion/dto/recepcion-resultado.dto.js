"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RecepcionResultadoDto", {
    enumerable: true,
    get: function() {
        return RecepcionResultadoDto;
    }
});
const _swagger = require("@nestjs/swagger");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let IncidenciaGeneradaDto = class IncidenciaGeneradaDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: 'docs.UUID_DE_LA_INCIDENCIA',
        example: 'uuid-incidencia'
    }),
    _ts_metadata("design:type", String)
], IncidenciaGeneradaDto.prototype, "id", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: 'docs.ESTADO_INICIAL_DE_LA_INCIDENCIA_SIEMPRE',
        example: 'PENDIENTE DE RESOLUCIÓN'
    }),
    _ts_metadata("design:type", String)
], IncidenciaGeneradaDto.prototype, "estado", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: 'docs.DATOS_INMUTABLES_CAPTURADOS_EN_EL_MOMENT',
        example: {
            productos: [
                {
                    idPedidoProducto: 'uuid-pp',
                    nombreProducto: 'Tomate Frito',
                    cantidadPedida: 20,
                    cantidadRecibida: 18,
                    diferencia: -2,
                    tipo: 'FALTA'
                }
            ]
        }
    }),
    _ts_metadata("design:type", Object)
], IncidenciaGeneradaDto.prototype, "datosOriginales", void 0);
let PedidoActualizadoDto = class PedidoActualizadoDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: 'docs.UUID_DEL_PEDIDO',
        example: 'uuid-pedido'
    }),
    _ts_metadata("design:type", String)
], PedidoActualizadoDto.prototype, "id", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: 'docs.ESTADO_ANTERIOR_ANTES_DE_LA_RECEPCI_N',
        example: 'en_proceso'
    }),
    _ts_metadata("design:type", String)
], PedidoActualizadoDto.prototype, "estadoAnterior", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: 'docs.ESTADO_RESULTANTE_TRAS_LA_RECEPCI_N',
        example: 'recibido'
    }),
    _ts_metadata("design:type", String)
], PedidoActualizadoDto.prototype, "estadoNuevo", void 0);
let ProductoCreadoDto = class ProductoCreadoDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: 'docs.UUID_DEL_PRODUCTO_CREADO',
        example: 'uuid-prod'
    }),
    _ts_metadata("design:type", String)
], ProductoCreadoDto.prototype, "id", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: 'docs.NOMBRE_DEL_PRODUCTO',
        example: 'Aceite de Girasol Bio'
    }),
    _ts_metadata("design:type", String)
], ProductoCreadoDto.prototype, "nombre", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: 'docs.C_DIGO_DE_BARRAS',
        example: '8410188009999'
    }),
    _ts_metadata("design:type", String)
], ProductoCreadoDto.prototype, "codigoBarras", void 0);
let RecepcionResultadoDto = class RecepcionResultadoDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: 'docs.UUID_DE_LA_NUEVA_RECEPCI_N',
        example: 'uuid-recepcion'
    }),
    _ts_metadata("design:type", String)
], RecepcionResultadoDto.prototype, "id", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: 'docs.FECHA_DE_RECEPCI_N',
        example: '2023-10-15T12:00:00Z'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], RecepcionResultadoDto.prototype, "fechaRecepcion", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: 'docs.INCIDENCIAS_GENERADAS_AUTOM_TICAMENTE_PO',
        type: [
            IncidenciaGeneradaDto
        ]
    }),
    _ts_metadata("design:type", Array)
], RecepcionResultadoDto.prototype, "incidencias", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: 'docs.CAMBIOS_DE_ESTADO_APLICADOS_A_LOS_PEDIDO',
        type: [
            PedidoActualizadoDto
        ]
    }),
    _ts_metadata("design:type", Array)
], RecepcionResultadoDto.prototype, "pedidosActualizados", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: 'docs.TOTAL_DE_MOVIMIENTOS_DE_INVENTARIO_GENER',
        example: 3
    }),
    _ts_metadata("design:type", Number)
], RecepcionResultadoDto.prototype, "movimientosGenerados", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: 'docs.TOTAL_DE_LOTES_DE_INVENTARIO_CREADOS_FEF',
        example: 3
    }),
    _ts_metadata("design:type", Number)
], RecepcionResultadoDto.prototype, "inventariosCreados", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: 'docs.PRODUCTOS_QUE_FUERON_CREADOS_DURANTE_EST',
        type: [
            ProductoCreadoDto
        ]
    }),
    _ts_metadata("design:type", Array)
], RecepcionResultadoDto.prototype, "productosCreados", void 0);

//# sourceMappingURL=recepcion-resultado.dto.js.map