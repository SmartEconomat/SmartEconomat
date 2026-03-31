import { randomUUID } from 'node:crypto';
import { SeedContext } from './seed-context';
import { Endpoint, EnumCoverage } from './massive.types';
import {
  ALERGEN_VALUES,
  INCIDENCIA_TIPOS,
  MERMA_MOTIVOS,
  MOVIMIENTO_MANUAL_TYPES,
  MOVIMIENTO_TYPES,
  PRODUCT_TYPES,
  PRODUCT_UNITS,
  RECEPCION_ESTADO_PRODUCTO,
  RECEPCION_ESTADO_VISUAL,
  RECETA_DIFICULTAD,
  RECETA_UNIDADES,
  RESOLUCION_TIPOS,
  USER_ROLES,
  USER_STATUSES,
} from './massive.config';
import { markEnum } from './massive.helpers.common';
import { pickRequiredStateValue, pickStateValue } from './massive.state';

export type BuildBodyEnv = {
  context: SeedContext;
  endpoint: Endpoint;
  resolvedPath: string;
  iteration: number;
  coverage: EnumCoverage;
  templatePath: string;
  runTag: string;
  suffix: string;

  roleValue: string;
  statusValue: string;
  unidadProducto: string;
  tipoProducto: string;
  alergeno: string;
  movimientoTipo: string;
  manualTipo: string;
  recetaDificultad: string;
  recetaUnidad: string;
  incidenciaTipo: string;
  resolucionTipo: string;
  mermaMotivo: string;
  estadoVisual: string;
  estadoProducto: string;

  proveedorId: string;
  productoId: string;
  productoProveedorId: string;
  recetaId: string;
  pedidoId: string;
  inventarioId: string;
  recepcionId: string;
  ubicacionId: string;
  pedidoProductoId: string;
  usuarioId: string;
  roleId: string;
  permissionId: string;

  pickRequired: (key: string, offset?: number) => string;
};

export function createBuildBodyEnv(
  context: SeedContext,
  endpoint: Endpoint,
  resolvedPath: string,
  iteration: number,
  coverage: EnumCoverage
): BuildBodyEnv {
  const templatePath = endpoint.path;
  const runTag = context.getState<string>('seedRunTag') || 'seed';
  const uniqueCursor = context.getState<number>('seedUniqueSuffixCursor') || 0;
  context.set('seedUniqueSuffixCursor', uniqueCursor + 1);
  const suffix = `${runTag}_${iteration}_${uniqueCursor}_${randomUUID().slice(0, 8)}`;

  const roleValue = USER_ROLES[iteration % USER_ROLES.length];
  const statusValue = USER_STATUSES[iteration % USER_STATUSES.length];
  const unidadProducto = PRODUCT_UNITS[iteration % PRODUCT_UNITS.length];
  const tipoProducto = PRODUCT_TYPES[iteration % PRODUCT_TYPES.length];
  const alergeno = ALERGEN_VALUES[iteration % ALERGEN_VALUES.length];
  const movimientoTipo = MOVIMIENTO_TYPES[iteration % MOVIMIENTO_TYPES.length];
  const manualTipo =
    MOVIMIENTO_MANUAL_TYPES[iteration % MOVIMIENTO_MANUAL_TYPES.length];
  const recetaDificultad =
    RECETA_DIFICULTAD[iteration % RECETA_DIFICULTAD.length];
  const recetaUnidad = RECETA_UNIDADES[iteration % RECETA_UNIDADES.length];
  const incidenciaTipo = INCIDENCIA_TIPOS[iteration % INCIDENCIA_TIPOS.length];
  const resolucionTipo = RESOLUCION_TIPOS[iteration % RESOLUCION_TIPOS.length];
  const mermaMotivo = MERMA_MOTIVOS[iteration % MERMA_MOTIVOS.length];
  const estadoVisual =
    RECEPCION_ESTADO_VISUAL[iteration % RECEPCION_ESTADO_VISUAL.length];
  const estadoProducto =
    RECEPCION_ESTADO_PRODUCTO[iteration % RECEPCION_ESTADO_PRODUCTO.length];

  markEnum(coverage, 'userRoles', roleValue);
  markEnum(coverage, 'userStatuses', statusValue);
  markEnum(coverage, 'productUnits', unidadProducto);
  markEnum(coverage, 'productTypes', tipoProducto);
  markEnum(coverage, 'allergens', alergeno);
  markEnum(coverage, 'movimientoTypes', movimientoTipo);
  markEnum(coverage, 'movimientoManualTypes', manualTipo);
  markEnum(coverage, 'recetaDificultad', recetaDificultad);
  markEnum(coverage, 'recetaUnidades', recetaUnidad);
  markEnum(coverage, 'incidenciaTipos', incidenciaTipo);
  markEnum(coverage, 'incidenciaResoluciones', resolucionTipo);
  markEnum(coverage, 'mermaMotivos', mermaMotivo);
  markEnum(coverage, 'recepcionEstadoVisual', estadoVisual);
  markEnum(coverage, 'recepcionEstadoProducto', estadoProducto);

  const proveedorId =
    pickStateValue(context, 'seedCreatedProveedorIds', iteration, '') ||
    pickStateValue(context, 'proveedorIds', iteration);
  const productoId =
    pickStateValue(context, 'seedCreatedProductoIds', iteration, '') ||
    pickStateValue(context, 'productoIds', iteration);
  const productoProveedorId =
    pickStateValue(context, 'seedCreatedProductoProveedorIds', iteration, '') ||
    pickStateValue(context, 'productoProveedorIds', iteration);
  const recetaId =
    pickStateValue(context, 'seedCreatedRecetaIds', iteration, '') ||
    pickStateValue(context, 'recetaIds', iteration);
  const pedidoId =
    pickStateValue(context, 'seedCreatedPedidoReceivableIds', iteration, '') ||
    pickStateValue(context, 'pedidoReceivableIds', iteration, '') ||
    pickStateValue(context, 'pedidoIds', iteration);
  const inventarioId =
    pickStateValue(context, 'seedCreatedInventarioIds', iteration, '') ||
    pickStateValue(context, 'inventarioIds', iteration);
  const recepcionId = pickStateValue(context, 'recepcionIds', iteration);
  const ubicacionId = pickStateValue(context, 'ubicacionIds', iteration);
  const pedidoProductoId = pickStateValue(
    context,
    'pedidoProductoIds',
    iteration
  );
  const usuarioId = pickStateValue(context, 'usuarioIds', iteration);
  const roleId = pickStateValue(context, 'roleIds', iteration);
  const permissionId = pickStateValue(context, 'permissionIds', iteration);

  const pickRequired = (key: string, offset = 0): string =>
    pickRequiredStateValue(context, key, iteration, offset);

  return {
    context,
    endpoint,
    resolvedPath,
    iteration,
    coverage,
    templatePath,
    runTag,
    suffix,
    roleValue,
    statusValue,
    unidadProducto,
    tipoProducto,
    alergeno,
    movimientoTipo,
    manualTipo,
    recetaDificultad,
    recetaUnidad,
    incidenciaTipo,
    resolucionTipo,
    mermaMotivo,
    estadoVisual,
    estadoProducto,
    proveedorId,
    productoId,
    productoProveedorId,
    recetaId,
    pedidoId,
    inventarioId,
    recepcionId,
    ubicacionId,
    pedidoProductoId,
    usuarioId,
    roleId,
    permissionId,
    pickRequired,
  };
}
