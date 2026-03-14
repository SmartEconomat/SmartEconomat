"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RecepcionStockService", {
    enumerable: true,
    get: function() {
        return RecepcionStockService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("typeorm");
const _albaranpedidorecepcionentity = require("../../albaran/albaran-pedido-recepcion.entity/albaran-pedido-recepcion.entity");
const _inventarioentity = require("../../inventario/inventario.entity/inventario.entity");
const _movimientoentity = require("../../movimiento/movimiento.entity/movimiento.entity");
const _pedidoentity = require("../../pedido/pedido.entity/pedido.entity");
const _movimientoenums = require("../../movimiento/enums/movimiento.enums");
const _estadopedidoenum = require("../../pedido/enums/estado-pedido.enum");
const _recepcionentity = require("../recepcion.entity/recepcion.entity");
const _recepcionpedidoentity = require("../recepcion-pedido.entity/recepcion-pedido.entity");
const _recepcionproductoentity = require("../recepcion-productos.entity/recepcion-producto.entity");
const _incidenciaentity = require("../../incidencia/incidencia.entity/incidencia.entity");
const _albaranentity = require("../../albaran/albaran.entity/albaran.entity");
const _ubicacionentity = require("../../ubicacion/ubicacion.entity/ubicacion.entity");
const _estadorecepcionenum = require("../enums/estado-recepcion.enum");
const _estadovisualenum = require("../enums/estado-visual.enum");
const _i18nhelper = require("../../../common/helpers/i18n.helper");
const _usuarioentity = require("../../usuario/usuario.entity/usuario.entity");
const _productoentity = require("../../producto/producto.entity/producto.entity");
const _productoproveedorentity = require("../../producto/producto-proveedor.entity/producto-proveedor.entity");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let RecepcionStockService = class RecepcionStockService {
    async procesarRecepcionMasiva(dto, userId) {
        const usuario = await this.dataSource.manager.findOne(_usuarioentity.Usuario, {
            where: {
                id: userId
            }
        });
        if (!usuario) {
            throw new _common.NotFoundException(_i18nhelper.I18nHelper.getError('USER_NOT_FOUND'));
        }
        const pedido = await this.dataSource.manager.findOne(_pedidoentity.Pedido, {
            where: {
                id: dto.pedidoId
            },
            relations: [
                'pedidoProductos',
                'pedidoProductos.productoProveedor',
                'pedidoProductos.productoProveedor.producto',
                'proveedor'
            ]
        });
        if (!pedido) {
            throw new _common.NotFoundException(_i18nhelper.I18nHelper.getError('ORDER_NOT_FOUND'));
        }
        if (pedido.estado !== _estadopedidoenum.EstadoPedido.PENDIENTE && pedido.estado !== _estadopedidoenum.EstadoPedido.EN_PROCESO && pedido.estado !== _estadopedidoenum.EstadoPedido.PARCIAL) {
            throw new _common.BadRequestException(_i18nhelper.I18nHelper.getError('ORDER_NOT_RECEPTABLE'));
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            let movimientosGenerados = 0;
            let inventariosCreados = 0;
            const incidenciasGeneradas = [];
            let recepcionEstadoEnum = _estadorecepcionenum.EstadoRecepcion.COMPLETADA;
            let defaultUbicacion = await queryRunner.manager.findOne(_ubicacionentity.Ubicacion, {
                where: {
                    nombre: 'Almacén Principal'
                }
            });
            if (!defaultUbicacion) {
                defaultUbicacion = queryRunner.manager.create(_ubicacionentity.Ubicacion, {
                    nombre: 'Almacén Principal',
                    descripcion: 'Ubicación por defecto del economato'
                });
                defaultUbicacion = await queryRunner.manager.save(defaultUbicacion);
            }
            const recepcion = queryRunner.manager.create(_recepcionentity.Recepcion, {
                usuario: {
                    id: userId
                },
                fechaRecepcion: new Date(),
                observaciones: dto.observaciones,
                estado: _estadorecepcionenum.EstadoRecepcion.COMPLETADA
            });
            const savedRecepcion = await queryRunner.manager.save(recepcion);
            let rp = queryRunner.manager.create(_recepcionpedidoentity.RecepcionPedido, {
                recepcion: savedRecepcion,
                pedido: {
                    id: pedido.id
                }
            });
            rp = await queryRunner.manager.save(rp);
            if (dto.nAlbaran) {
                let albaran = await queryRunner.manager.findOne(_albaranentity.Albaran, {
                    where: {
                        nAlbaran: dto.nAlbaran
                    }
                });
                if (!albaran) {
                    albaran = queryRunner.manager.create(_albaranentity.Albaran, {
                        nAlbaran: dto.nAlbaran,
                        fecha: new Date()
                    });
                    albaran = await queryRunner.manager.save(albaran);
                }
                const apr = queryRunner.manager.create(_albaranpedidorecepcionentity.AlbaranPedidoRecepcion, {
                    albaran: albaran,
                    recepcionPedido: rp
                });
                await queryRunner.manager.save(apr);
            }
            const mapPedidoProductos = new Map();
            const ppArr = pedido.pedidoProductos;
            for (const pp of ppArr){
                mapPedidoProductos.set(pp.id, pp);
            }
            const sumadoRecibidoPorPP = new Map();
            const detallesRecibidos = new Map();
            const batchRecepcionProductos = [];
            const batchInventarios = [];
            const lineasConInventario = [];
            for (const linea of dto.productosRecibidos){
                const ppRef = mapPedidoProductos.get(linea.pedidoProductoId);
                if (!ppRef) {
                    throw new _common.BadRequestException(`PedidoProducto ${linea.pedidoProductoId} no pertenece al pedido seleccionado.`);
                }
                const valActual = sumadoRecibidoPorPP.get(ppRef.id) || 0;
                sumadoRecibidoPorPP.set(ppRef.id, valActual + Number(linea.cantidadRecibida));
                const detallesLinea = detallesRecibidos.get(ppRef.id) || [];
                detallesLinea.push(linea);
                detallesRecibidos.set(ppRef.id, detallesLinea);
                batchRecepcionProductos.push(queryRunner.manager.create(_recepcionproductoentity.RecepcionProducto, {
                    recepcion: savedRecepcion,
                    cantidadAlbaran: linea.cantidadAlbaran || null,
                    cantidadRecibida: linea.cantidadRecibida,
                    observaciones: linea.observaciones,
                    pedidoProducto: {
                        id: ppRef.id
                    },
                    isWeighedWithScale: linea.isWeighedWithScale || false
                }));
                if (linea.cantidadRecibida > 0) {
                    const defaultExpiration = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    const stockNuevo = queryRunner.manager.create(_inventarioentity.Inventario, {
                        productoProveedor: ppRef.productoProveedor,
                        cantidadActual: linea.cantidadRecibida,
                        cantidadMinima: 10,
                        fechaEntrada: new Date(),
                        ubicacion: defaultUbicacion,
                        fechaCaducidad: linea.fechaCaducidad ? new Date(linea.fechaCaducidad) : defaultExpiration
                    });
                    batchInventarios.push(stockNuevo);
                    lineasConInventario.push({
                        linea,
                        ppRef,
                        stockNuevo
                    });
                }
            }
            if (batchRecepcionProductos.length > 0) {
                await queryRunner.manager.save(batchRecepcionProductos);
            }
            if (batchInventarios.length > 0) {
                await queryRunner.manager.save(batchInventarios);
                inventariosCreados = batchInventarios.length;
                const batchMovimientos = [];
                for (const item of lineasConInventario){
                    batchMovimientos.push(queryRunner.manager.create(_movimientoentity.Movimiento, {
                        tipo: _movimientoenums.TipoMovimiento.ENTRADA_COMPRA,
                        cantidad: item.linea.cantidadRecibida,
                        entidadId: savedRecepcion.id,
                        entidad: 'Recepcion',
                        inventario: {
                            id: item.stockNuevo.id
                        },
                        descripcion: `Recepción Masiva Pedido ${item.ppRef.id} - Lote ${item.linea.estadoVisual || 'ÓPTIMO'} - Albarán ${dto.nAlbaran || 'N/A'}`,
                        usuario: {
                            id: userId
                        }
                    }));
                }
                await queryRunner.manager.save(batchMovimientos);
                movimientosGenerados = batchMovimientos.length;
            }
            const lineasIncidencia = [];
            for (const pp of ppArr){
                const cantPedida = Number(pp.cantidad);
                const lineasRecibidas = detallesRecibidos.get(pp.id) || [];
                let subCantOptima = 0;
                let subCantRotaDefectuosa = 0;
                for (const lr of lineasRecibidas){
                    if (lr.estadoVisual === _estadovisualenum.EstadoVisualProducto.OPTIMO) {
                        subCantOptima += Number(lr.cantidadRecibida);
                    } else {
                        subCantRotaDefectuosa += Number(lr.cantidadRecibida);
                    }
                }
                const cantRecibidaTotal = subCantOptima + subCantRotaDefectuosa;
                const difNumerica = cantRecibidaTotal - cantPedida;
                if (difNumerica !== 0) {
                    lineasIncidencia.push({
                        idPedidoProducto: pp.id,
                        nombreProducto: pp.productoProveedor?.producto?.nombre || 'Producto',
                        cantidadPedida: cantPedida,
                        cantidadRecibida: cantRecibidaTotal,
                        diferencia: difNumerica,
                        tipo: cantRecibidaTotal === 0 ? 'NO_ENTREGADO' : difNumerica < 0 ? 'FALTA' : 'EXCESO'
                    });
                }
                if (subCantRotaDefectuosa > 0) {
                    const observacionesMermas = lineasRecibidas.filter((lr)=>lr.estadoVisual !== _estadovisualenum.EstadoVisualProducto.OPTIMO).map((lr)=>lr.observaciones).filter(Boolean).join('; ');
                    lineasIncidencia.push({
                        idPedidoProducto: pp.id,
                        nombreProducto: pp.productoProveedor?.producto?.nombre || 'Producto',
                        cantidadPedida: cantPedida,
                        cantidadRecibida: subCantRotaDefectuosa,
                        diferencia: -subCantRotaDefectuosa,
                        tipo: 'DEFECTUOSO',
                        observaciones: observacionesMermas
                    });
                }
            }
            if (lineasIncidencia.length > 0) {
                recepcionEstadoEnum = _estadorecepcionenum.EstadoRecepcion.CON_INCIDENCIAS;
                const incidenciaRec = queryRunner.manager.create(_incidenciaentity.Incidencia, {
                    recepcion: savedRecepcion,
                    pedido: {
                        id: pedido.id
                    },
                    observacionesRecepcion: dto.observaciones || 'Generado vía Recepción Masiva con discrepancias.',
                    datosOriginales: {
                        productos: lineasIncidencia
                    }
                });
                const savedInci = await queryRunner.manager.save(incidenciaRec);
                incidenciasGeneradas.push({
                    id: savedInci.id,
                    estado: 'PENDIENTE DE RESOLUCIÓN',
                    datosOriginales: {
                        productos: lineasIncidencia
                    }
                });
            }
            savedRecepcion.estado = recepcionEstadoEnum;
            await queryRunner.manager.save(savedRecepcion);
            const estadoPasado = pedido.estado;
            const finalState = await this.actualizarEstadoPedido(pedido.id, queryRunner.manager);
            await queryRunner.commitTransaction();
            return {
                id: savedRecepcion.id,
                fechaRecepcion: savedRecepcion.fechaRecepcion,
                incidencias: incidenciasGeneradas,
                pedidosActualizados: [
                    {
                        id: pedido.id,
                        estadoAnterior: estadoPasado,
                        estadoNuevo: finalState
                    }
                ],
                movimientosGenerados,
                inventariosCreados,
                productosCreados: []
            };
        } catch (error) {
            if (queryRunner.isTransactionActive) {
                await queryRunner.rollbackTransaction();
            }
            const err = error;
            throw new _common.BadRequestException(_i18nhelper.I18nHelper.getError('RECEPTION_FAILED', {
                message: err.message
            }));
        } finally{
            await queryRunner.release();
        }
    }
    async procesarRecepcion(dto) {
        const usuario = await this.dataSource.manager.findOne(_usuarioentity.Usuario, {
            where: {
                id: dto.usuarioId
            }
        });
        if (!usuario) {
            throw new _common.NotFoundException(_i18nhelper.I18nHelper.getError('USER_NOT_FOUND'));
        }
        const listaPedidos = dto.pedidos || (dto.pedidoIds || []).map((id)=>({
                pedidoId: id,
                nAlbaran: dto.nAlbaran,
                observaciones: dto.observaciones
            }));
        const pedidoIdsList = listaPedidos.map((p)=>p.pedidoId);
        if (pedidoIdsList.length === 0) {
            throw new _common.BadRequestException(_i18nhelper.I18nHelper.getError('NO_SE_HAN_ESPECIFICADO_PEDIDOS'));
        }
        const uniquePedidoIds = [
            ...new Set(pedidoIdsList)
        ];
        const pedidosArr = await this.dataSource.manager.find(_pedidoentity.Pedido, {
            where: {
                id: (0, _typeorm.In)(uniquePedidoIds)
            },
            relations: [
                'pedidoProductos',
                'pedidoProductos.productoProveedor',
                'pedidoProductos.productoProveedor.producto',
                'proveedor'
            ]
        });
        if (pedidosArr.length !== uniquePedidoIds.length) {
            const foundIds = pedidosArr.map((p)=>p.id);
            const missingIds = uniquePedidoIds.filter((id)=>!foundIds.includes(id));
            throw new _common.NotFoundException(`${_i18nhelper.I18nHelper.getError('ORDER_NOT_FOUND')}: ${missingIds.join(', ')}`);
        }
        const pedidosInvalidos = pedidosArr.filter((p)=>p.estado !== _estadopedidoenum.EstadoPedido.PENDIENTE && p.estado !== _estadopedidoenum.EstadoPedido.EN_PROCESO && p.estado !== _estadopedidoenum.EstadoPedido.PARCIAL);
        if (pedidosInvalidos.length > 0) {
            const invalidIds = pedidosInvalidos.map((p)=>p.id);
            throw new _common.BadRequestException(`${_i18nhelper.I18nHelper.getError('ORDER_NOT_RECEPTABLE')}: ${invalidIds.join(', ')}`);
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            let movimientosGenerados = 0;
            let inventariosCreados = 0;
            const incidenciasGeneradas = [];
            const productosCreados = [];
            let recepcionEstadoEnum = _estadorecepcionenum.EstadoRecepcion.COMPLETADA;
            const defaultProvider = pedidosArr[0].proveedor;
            const observacionesGlobales = dto.observaciones || listaPedidos.map((p)=>p.observaciones).filter(Boolean).join(' | ');
            const recepcion = queryRunner.manager.create(_recepcionentity.Recepcion, {
                usuario: {
                    id: dto.usuarioId
                },
                fechaRecepcion: dto.fechaRecepcion || new Date(),
                observaciones: observacionesGlobales,
                estado: _estadorecepcionenum.EstadoRecepcion.COMPLETADA
            });
            const savedRecepcion = await queryRunner.manager.save(recepcion);
            let defaultUbicacion = await queryRunner.manager.findOne(_ubicacionentity.Ubicacion, {
                where: {
                    nombre: 'Almacén Principal'
                }
            });
            if (!defaultUbicacion) {
                defaultUbicacion = queryRunner.manager.create(_ubicacionentity.Ubicacion, {
                    nombre: 'Almacén Principal',
                    descripcion: 'Ubicación por defecto del economato'
                });
                defaultUbicacion = await queryRunner.manager.save(defaultUbicacion);
            }
            if (dto.productosNuevos && dto.productosNuevos.length > 0) {
                for (const pNew of dto.productosNuevos){
                    const prod = queryRunner.manager.create(_productoentity.Producto, {
                        nombre: pNew.nombre,
                        marca: pNew.marca,
                        unidad: pNew.unidad,
                        tipo: pNew.tipo,
                        codigoBarras: pNew.codigoBarras,
                        contenido: pNew.contenido,
                        categoria: pNew.tipo
                    });
                    const savedProd = await queryRunner.manager.save(prod);
                    const pp = queryRunner.manager.create(_productoproveedorentity.ProductoProveedor, {
                        producto: savedProd,
                        proveedor: defaultProvider,
                        marca: pNew.marca,
                        codigoBarras: pNew.codigoBarras
                    });
                    const savedPP = await queryRunner.manager.save(pp);
                    productosCreados.push({
                        id: savedProd.id,
                        nombre: savedProd.nombre,
                        codigoBarras: savedProd.codigoBarras || ''
                    });
                    if (pNew.cantidadRecibida > 0) {
                        const inv = queryRunner.manager.create(_inventarioentity.Inventario, {
                            productoProveedor: savedPP,
                            cantidadActual: pNew.cantidadRecibida,
                            cantidadMinima: 10,
                            fechaEntrada: new Date(),
                            ubicacion: defaultUbicacion,
                            fechaCaducidad: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                        });
                        const savedInv = await queryRunner.manager.save(inv);
                        inventariosCreados++;
                        await queryRunner.manager.save(_movimientoentity.Movimiento, {
                            tipo: _movimientoenums.TipoMovimiento.ENTRADA_COMPRA,
                            cantidad: pNew.cantidadRecibida,
                            entidadId: savedRecepcion.id,
                            entidad: 'Recepcion',
                            inventario: {
                                id: savedInv.id
                            },
                            descripcion: `Producto Nuevo ${savedProd.nombre} - Albarán ${dto.nAlbaran || 'N/A'}`,
                            usuario: {
                                id: dto.usuarioId
                            }
                        });
                        movimientosGenerados++;
                    }
                }
            }
            const savedRecepcionPedidos = [];
            for (const pRef of listaPedidos){
                let rp = queryRunner.manager.create(_recepcionpedidoentity.RecepcionPedido, {
                    recepcion: savedRecepcion,
                    pedido: {
                        id: pRef.pedidoId
                    }
                });
                rp = await queryRunner.manager.save(rp);
                savedRecepcionPedidos.push(rp);
                if (pRef.nAlbaran) {
                    let albaran = await queryRunner.manager.findOne(_albaranentity.Albaran, {
                        where: {
                            nAlbaran: pRef.nAlbaran
                        }
                    });
                    if (!albaran) {
                        albaran = queryRunner.manager.create(_albaranentity.Albaran, {
                            nAlbaran: pRef.nAlbaran,
                            fecha: new Date()
                        });
                        albaran = await queryRunner.manager.save(albaran);
                    }
                    const apr = queryRunner.manager.create(_albaranpedidorecepcionentity.AlbaranPedidoRecepcion, {
                        albaran: albaran,
                        recepcionPedido: rp
                    });
                    await queryRunner.manager.save(apr);
                }
            }
            const mapPedidoProductos = new Map();
            for (const p of pedidosArr){
                const ppArr = p.pedidoProductos;
                for (const pp of ppArr){
                    mapPedidoProductos.set(pp.id, pp);
                }
            }
            const sumadoRecibidoPorPP = new Map();
            const detallesRecibidos = new Map();
            for (const linea of dto.productos){
                const estadoVirtualDefault = linea.estadoVisual || _estadovisualenum.EstadoVisualProducto.OPTIMO;
                const ppRef = mapPedidoProductos.get(linea.pedidoProductoId);
                if (!ppRef) {
                    throw new _common.BadRequestException(`PedidoProducto ${linea.pedidoProductoId} no pertenece a los pedidos seleccionados.`);
                }
                const valActual = sumadoRecibidoPorPP.get(ppRef.id) || 0;
                sumadoRecibidoPorPP.set(ppRef.id, valActual + Number(linea.cantidadRecibida));
                const detallesLinea = detallesRecibidos.get(ppRef.id) || [];
                detallesLinea.push({
                    ...linea,
                    estadoVisual: estadoVirtualDefault
                });
                detallesRecibidos.set(ppRef.id, detallesLinea);
                const recepcionProducto = queryRunner.manager.create(_recepcionproductoentity.RecepcionProducto, {
                    recepcion: savedRecepcion,
                    cantidadAlbaran: linea.cantidadAlbaran || null,
                    cantidadRecibida: linea.cantidadRecibida,
                    observaciones: linea.observaciones,
                    pedidoProducto: {
                        id: ppRef.id
                    },
                    isWeighedWithScale: linea.isWeighedWithScale || false
                });
                await queryRunner.manager.save(recepcionProducto);
                if (linea.cantidadRecibida > 0) {
                    const defaultExpiration = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    const stockNuevo = queryRunner.manager.create(_inventarioentity.Inventario, {
                        productoProveedor: ppRef.productoProveedor,
                        cantidadActual: linea.cantidadRecibida,
                        cantidadMinima: 10,
                        fechaEntrada: new Date(),
                        ubicacion: defaultUbicacion,
                        fechaCaducidad: linea.fechaCaducidad ? new Date(linea.fechaCaducidad) : defaultExpiration
                    });
                    const savedStock = await queryRunner.manager.save(stockNuevo);
                    inventariosCreados++;
                    await queryRunner.manager.save(_movimientoentity.Movimiento, {
                        tipo: _movimientoenums.TipoMovimiento.ENTRADA_COMPRA,
                        cantidad: linea.cantidadRecibida,
                        entidadId: savedRecepcion.id,
                        entidad: 'Recepcion',
                        inventario: {
                            id: savedStock.id
                        },
                        descripcion: `Recepción Pedido ${ppRef.id} - Lote ${estadoVirtualDefault} - Albarán ${dto.nAlbaran || 'N/A'}`,
                        usuario: {
                            id: dto.usuarioId
                        }
                    });
                    movimientosGenerados++;
                }
            }
            for (const p of pedidosArr){
                const ppArr = p.pedidoProductos;
                const lineasIncidencia = [];
                for (const pp of ppArr){
                    const lineasRecibidas = detallesRecibidos.get(pp.id) || [];
                    const cantPedida = Number(pp.cantidad);
                    let subCantOptima = 0;
                    let subCantRotaDefectuosa = 0;
                    for (const lr of lineasRecibidas){
                        if (lr.estadoVisual === _estadovisualenum.EstadoVisualProducto.OPTIMO) {
                            subCantOptima += Number(lr.cantidadRecibida);
                        } else {
                            subCantRotaDefectuosa += Number(lr.cantidadRecibida);
                        }
                    }
                    const cantRecibidaTotal = subCantOptima + subCantRotaDefectuosa;
                    const difNumerica = cantRecibidaTotal - cantPedida;
                    if (difNumerica !== 0) {
                        lineasIncidencia.push({
                            idPedidoProducto: pp.id,
                            nombreProducto: pp.productoProveedor?.producto?.nombre || 'Producto',
                            cantidadPedida: cantPedida,
                            cantidadRecibida: cantRecibidaTotal,
                            diferencia: difNumerica,
                            tipo: cantRecibidaTotal === 0 ? 'NO_ENTREGADO' : difNumerica < 0 ? 'FALTA' : 'EXCESO'
                        });
                    }
                    if (subCantRotaDefectuosa > 0) {
                        const observacionesMermas = lineasRecibidas.filter((lr)=>lr.estadoVisual !== _estadovisualenum.EstadoVisualProducto.OPTIMO).map((lr)=>lr.observaciones).filter(Boolean).join('; ');
                        lineasIncidencia.push({
                            idPedidoProducto: pp.id,
                            nombreProducto: pp.productoProveedor?.producto?.nombre || 'Producto',
                            cantidadPedida: cantPedida,
                            cantidadRecibida: subCantRotaDefectuosa,
                            diferencia: -subCantRotaDefectuosa,
                            tipo: 'DEFECTUOSO',
                            observaciones: observacionesMermas
                        });
                    }
                }
                if (lineasIncidencia.length > 0) {
                    recepcionEstadoEnum = _estadorecepcionenum.EstadoRecepcion.CON_INCIDENCIAS;
                    const refPedido = listaPedidos.find((lp)=>lp.pedidoId === p.id);
                    const incidenciaRec = queryRunner.manager.create(_incidenciaentity.Incidencia, {
                        recepcion: savedRecepcion,
                        pedido: {
                            id: p.id
                        },
                        observacionesRecepcion: refPedido?.observaciones || observacionesGlobales,
                        datosOriginales: {
                            productos: lineasIncidencia
                        }
                    });
                    const savedInci = await queryRunner.manager.save(incidenciaRec);
                    incidenciasGeneradas.push({
                        id: savedInci.id,
                        estado: 'PENDIENTE DE RESOLUCIÓN',
                        datosOriginales: {
                            productos: lineasIncidencia
                        }
                    });
                }
            }
            savedRecepcion.estado = recepcionEstadoEnum;
            await queryRunner.manager.save(savedRecepcion);
            const pedidosActualizadosFinal = [];
            for (const p of pedidosArr){
                const estadoPasado = p.estado;
                const finalState = await this.actualizarEstadoPedido(p.id, queryRunner.manager);
                pedidosActualizadosFinal.push({
                    id: p.id,
                    estadoAnterior: estadoPasado,
                    estadoNuevo: finalState
                });
            }
            await queryRunner.commitTransaction();
            return {
                id: savedRecepcion.id,
                fechaRecepcion: savedRecepcion.fechaRecepcion,
                incidencias: incidenciasGeneradas,
                pedidosActualizados: pedidosActualizadosFinal,
                movimientosGenerados: movimientosGenerados,
                inventariosCreados: inventariosCreados,
                productosCreados: productosCreados
            };
        } catch (error) {
            if (queryRunner.isTransactionActive) {
                await queryRunner.rollbackTransaction();
            }
            throw new _common.BadRequestException(_i18nhelper.I18nHelper.getError('RECEPTION_FAILED', {
                message: error.message
            }));
        } finally{
            await queryRunner.release();
        }
    }
    async actualizarEstadoPedido(pedidoId, manager) {
        const pedido = await manager.findOne(_pedidoentity.Pedido, {
            where: {
                id: pedidoId
            },
            relations: [
                'pedidoProductos'
            ]
        });
        if (!pedido) return _estadopedidoenum.EstadoPedido.EN_PROCESO;
        const recepcionPedidos = await manager.find(_recepcionpedidoentity.RecepcionPedido, {
            where: {
                pedido: {
                    id: pedido.id
                }
            },
            relations: [
                'recepcion',
                'recepcion.recepcionProductos',
                'recepcion.recepcionProductos.pedidoProducto'
            ]
        });
        const pedidoProductosList = pedido.pedidoProductos;
        const orderProductIds = new Set(pedidoProductosList.map((pp)=>pp.id));
        let totalRecibido = 0;
        const mapRecvd = new Map();
        for (const repPedido of recepcionPedidos){
            if (!repPedido.recepcion || !repPedido.recepcion.recepcionProductos) continue;
            for (const repProd of repPedido.recepcion.recepcionProductos){
                if (repProd.pedidoProducto && orderProductIds.has(repProd.pedidoProducto.id)) {
                    totalRecibido += Number(repProd.cantidadRecibida);
                    const curr = mapRecvd.get(repProd.pedidoProducto.id) || 0;
                    mapRecvd.set(repProd.pedidoProducto.id, curr + Number(repProd.cantidadRecibida));
                }
            }
        }
        let isFull = true;
        let isIncidencia = false;
        for (const pp of pedidoProductosList){
            const cantReq = Number(pp.cantidad);
            const cantRecv = mapRecvd.get(pp.id) || 0;
            if (cantRecv !== cantReq) {
                isFull = false;
                if (cantRecv === 0 || cantRecv > cantReq) {
                    isIncidencia = true;
                }
            }
        }
        if (isFull) {
            pedido.estado = _estadopedidoenum.EstadoPedido.RECIBIDO;
        } else {
            if (isIncidencia) {
                pedido.estado = _estadopedidoenum.EstadoPedido.INCIDENCIA;
            } else if (totalRecibido > 0) {
                pedido.estado = _estadopedidoenum.EstadoPedido.PARCIAL;
            } else {
                pedido.estado = _estadopedidoenum.EstadoPedido.EN_PROCESO;
            }
        }
        await manager.save(_pedidoentity.Pedido, pedido);
        return pedido.estado;
    }
    constructor(dataSource){
        this.dataSource = dataSource;
    }
};
RecepcionStockService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm.DataSource === "undefined" ? Object : _typeorm.DataSource
    ])
], RecepcionStockService);

//# sourceMappingURL=recepcion-stock.service.js.map