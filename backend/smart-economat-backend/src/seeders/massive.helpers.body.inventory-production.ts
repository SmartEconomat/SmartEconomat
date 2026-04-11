import { BuildBodyEnv } from './massive.helpers.body.shared';
import {
  UnidadIngrediente,
  getTiempoRecetaMinutos,
} from '../modules/receta/enums/receta.enums';
import {
  consumeStateValue,
  getStateArray,
  pickStateValue,
} from './massive.state';
import { pickSeedUploadedImageRef } from './openfoodfacts.seed';
import { pickSeedRecipeTemplate } from './seed-recipes.catalog';
import {
  DETERMINISTIC_LONG_NOTES,
  DETERMINISTIC_SHORT_NOTES,
  deterministicBool,
  deterministicFloat,
  deterministicInt,
  pickDeterministic,
  seedDateFromIteration,
} from './deterministic.seed-data';

function getRecetaRealista(iteration: number) {
  return pickSeedRecipeTemplate(iteration);
}

function roundCantidadIngrediente(
  unidad: UnidadIngrediente,
  cantidad: number
): number {
  if (unidad === UnidadIngrediente.PIEZA) {
    return Math.max(1, Math.round(cantidad));
  }

  return Number(cantidad.toFixed(2));
}

function buildProductoProveedorMap(
  context: BuildBodyEnv['context']
): Map<string, string[]> {
  const pairs = [
    ...getStateArray(context, 'seedCreatedProductoToProveedorPairs'),
    ...getStateArray(context, 'productoToProveedorPairs'),
  ];
  const result = new Map<string, string[]>();

  for (const pair of pairs) {
    const [productoId, proveedorId] = pair.split('|');
    if (!productoId || !proveedorId) {
      continue;
    }

    const current = result.get(productoId) ?? [];
    if (!current.includes(proveedorId)) {
      current.push(proveedorId);
      result.set(productoId, current);
    }
  }

  return result;
}

function pickProductoParaUnidad(
  availableProductIds: string[],
  productoUnidadById: Record<string, UnidadIngrediente>,
  unidades: UnidadIngrediente[],
  usedProductIds: Set<string>,
  seedOffset: number
): string {
  const compatibles = availableProductIds.filter(
    (candidateId) =>
      !usedProductIds.has(candidateId) &&
      unidades.includes(
        productoUnidadById[candidateId] || UnidadIngrediente.PIEZA
      )
  );

  if (compatibles.length > 0) {
    return compatibles[seedOffset % compatibles.length] || compatibles[0];
  }

  const restantes = availableProductIds.filter(
    (candidateId) => !usedProductIds.has(candidateId)
  );

  return (
    restantes[seedOffset % restantes.length] ||
    availableProductIds[seedOffset % availableProductIds.length] ||
    ''
  );
}

function buildRecetaIngredientes(
  env: BuildBodyEnv
): Array<Record<string, unknown>> {
  const { context, iteration, productoId, proveedorId } = env;
  const recetaTemplate = getRecetaRealista(iteration);

  const productIds = Array.from(
    new Set([
      ...getStateArray(context, 'seedCreatedProductoIds'),
      ...getStateArray(context, 'productoIds'),
      productoId,
    ])
  ).filter(Boolean);

  const providerIds = Array.from(
    new Set([
      ...getStateArray(context, 'seedCreatedProveedorIds'),
      ...getStateArray(context, 'proveedorIds'),
      proveedorId,
    ])
  ).filter(Boolean);

  const ingredienteIds = productIds.slice(
    0,
    Math.max(2, Math.min(4, productIds.length))
  );
  const productoUnidadById =
    context.getState<Record<string, UnidadIngrediente>>('productoUnidadById') ||
    {};
  const productoProveedorMap = buildProductoProveedorMap(context);
  const usedProductIds = new Set<string>();
  const escalaServicio = deterministicFloat(
    0.9,
    1.15,
    2,
    iteration,
    'escala-servicio-receta'
  );

  return recetaTemplate.ingredientes.map((slot, index) => {
    const selectedProductoId =
      pickProductoParaUnidad(
        ingredienteIds.length > 0 ? ingredienteIds : productIds,
        productoUnidadById,
        slot.unidades,
        usedProductIds,
        iteration + index
      ) ||
      productIds[0] ||
      '';

    usedProductIds.add(selectedProductoId);

    const unidadIngrediente =
      productoUnidadById[selectedProductoId] ||
      slot.unidades[0] ||
      UnidadIngrediente.PIEZA;
    const proveedoresProducto =
      productoProveedorMap.get(selectedProductoId) || [];
    const proveedorFavoritoId =
      proveedoresProducto[
        (iteration + index) % Math.max(1, proveedoresProducto.length)
      ] ||
      providerIds[(iteration + index) % Math.max(1, providerIds.length)] ||
      proveedorId ||
      undefined;

    return {
      productoId: selectedProductoId,
      cantidad: roundCantidadIngrediente(
        unidadIngrediente,
        slot.cantidadBase * escalaServicio
      ),
      unidad: unidadIngrediente,
      mermaAplicada: slot.merma,
      proveedorFavoritoId,
    };
  });
}

export function buildBodyInventoryAndProduction(
  env: BuildBodyEnv
): Record<string, unknown> | undefined {
  const {
    context,
    endpoint,
    resolvedPath,
    templatePath,
    iteration,
    suffix,
    productoProveedorId,
    productoId,
    recetaId,
    inventarioId,
    manualTipo,
    ubicacionId,
    incidenciaTipo,
    recepcionId,
    pedidoId,
    usuarioId,
    pedidoProductoId,
    incidenciaEstadoObjetivo,
    resolucionTipo,
    mermaMotivo,
    movimientoTipo,
  } = env;

  if (resolvedPath === '/inventario/ajustes-manuales') {
    const baseAjuste = deterministicInt(
      1,
      7,
      iteration,
      'inventario-ajuste-base'
    );
    const ajuste =
      manualTipo === 'salida_ajuste'
        ? -baseAjuste
        : manualTipo === 'entrada'
          ? baseAjuste
          : iteration % 2 === 0
            ? baseAjuste
            : -baseAjuste;

    return {
      inventarioId,
      tipo: manualTipo,
      ajuste,
      motivo: 'Ajuste seed masivo',
      observaciones: pickDeterministic(
        DETERMINISTIC_SHORT_NOTES,
        iteration,
        'inventario-ajuste-observacion'
      ),
    };
  }

  if (resolvedPath.startsWith('/inventario')) {
    return {
      productoProveedorId,
      ubicacionId,
      cantidadActual: deterministicInt(20, 260, iteration, 'inventario-actual'),
      cantidadMinima: deterministicInt(3, 20, iteration, 'inventario-minima'),
      cantidadMaxima: deterministicInt(
        300,
        800,
        iteration,
        'inventario-maxima'
      ),
      fechaCaducidad:
        iteration % 2 === 0
          ? seedDateFromIteration(iteration + 20, 180, 'inventario-caducidad')
          : undefined,
    };
  }

  if (resolvedPath === '/recetas/duplicate') {
    const recetaTemplate = getRecetaRealista(iteration + 1);
    return {
      sourceId: recetaId,
      newName: `${recetaTemplate.nombre} - lote ${iteration + 1}`,
    };
  }

  if (resolvedPath === '/recetas') {
    const recetaTemplate = getRecetaRealista(iteration);
    const raciones = recetaTemplate.raciones;
    const tamanioRacion = recetaTemplate.tamanioRacion;
    const imageRef = pickSeedUploadedImageRef(context, iteration);

    return {
      nombre: recetaTemplate.nombre,
      instrucciones: recetaTemplate.instrucciones.join(' '),
      tiempoEstimadoMinutos: getTiempoRecetaMinutos(recetaTemplate.tiempo),
      dificultad: recetaTemplate.dificultad,
      rendimiento: Number((raciones * tamanioRacion).toFixed(2)),
      unidadResultado: recetaTemplate.unidadResultado,
      diasCaducidad: recetaTemplate.diasCaducidad,
      raciones,
      tamanioRacion,
      pathImg: imageRef?.pathImg,
      pathImgOptimized: imageRef?.pathImgOptimized,
      ingredientes: buildRecetaIngredientes(env),
    };
  }

  if (resolvedPath === '/recetas/calculate-preview') {
    return {
      ingredientes: buildRecetaIngredientes(env),
      rendimiento: deterministicFloat(
        1,
        8,
        2,
        iteration,
        'receta-preview-rendimiento'
      ),
    };
  }

  if (templatePath === '/recetas/:id' && endpoint.method === 'PATCH') {
    const recetaTemplate = getRecetaRealista(iteration + 2);
    const raciones = recetaTemplate.raciones;
    const tamanioRacion = recetaTemplate.tamanioRacion;
    const imageRef = pickSeedUploadedImageRef(context, iteration + 1);

    return {
      nombre: `${recetaTemplate.nombre} - revision ${iteration + 1}`,
      instrucciones: recetaTemplate.instrucciones.join(' '),
      tiempoEstimadoMinutos: getTiempoRecetaMinutos(recetaTemplate.tiempo),
      dificultad: recetaTemplate.dificultad,
      rendimiento: Number((raciones * tamanioRacion).toFixed(2)),
      unidadResultado: recetaTemplate.unidadResultado,
      diasCaducidad: recetaTemplate.diasCaducidad,
      raciones,
      tamanioRacion,
      pathImg: imageRef?.pathImg,
      pathImgOptimized: imageRef?.pathImgOptimized,
    };
  }

  if (resolvedPath.endsWith('/cocinar')) {
    return {
      cantidad: deterministicInt(1, 6, iteration, 'receta-cocinar-cantidad'),
    };
  }

  if (resolvedPath === '/produccion/ejecutar') {
    const preferredProduccionRecetaId =
      context.getState<string>('seedProduccionRecetaId') ||
      getStateArray(context, 'seedCreatedRecetaIds')[0] ||
      recetaId ||
      env.pickRequired('recetaIds');

    return {
      recetaId: preferredProduccionRecetaId,
      cantidadProducida: deterministicFloat(
        1.2,
        4.5,
        2,
        iteration,
        'produccion-ejecutar-cantidad'
      ),
      ubicacionDestinoId: ubicacionId,
    };
  }

  if (resolvedPath === '/produccion/validar') {
    const preferredProduccionRecetaId =
      context.getState<string>('seedProduccionRecetaId') ||
      getStateArray(context, 'seedCreatedRecetaIds')[0] ||
      recetaId ||
      env.pickRequired('recetaIds');

    return {
      items: [
        {
          recetaId: preferredProduccionRecetaId,
          cantidad: deterministicFloat(
            0.8,
            3.5,
            2,
            iteration,
            'produccion-validar-cantidad'
          ),
        },
      ],
    };
  }

  if (
    resolvedPath.startsWith('/produccion/lote/') &&
    resolvedPath.endsWith('/consumir')
  ) {
    const maxPorciones = Number(
      context.getState<number>('consumirMaxPorciones') ?? 1
    );
    const safeMax = Math.max(0.1, Math.min(maxPorciones * 0.5, 0.8));
    const safeMin = Math.min(0.1, safeMax);
    return {
      tipo: 'raciones',
      valor: deterministicFloat(
        safeMin,
        safeMax,
        2,
        iteration,
        'produccion-consumir-valor'
      ),
    };
  }

  if (resolvedPath.startsWith('/preparaciones')) {
    if (endpoint.method === 'PATCH' && resolvedPath.endsWith('/finalizar')) {
      return { ubicacionDestinoId: ubicacionId };
    }
    if (endpoint.method === 'PATCH') {
      return {};
    }

    const preferredPreparacionRecetaId =
      getStateArray(context, 'seedCreatedRecetaIds')[0] ||
      recetaId ||
      env.pickRequired('recetaIds');

    return {
      recetaId: preferredPreparacionRecetaId,
      cantidadAProducir: deterministicFloat(
        1,
        4,
        2,
        iteration,
        'preparacion-cantidad'
      ),
      fechaProgramada: seedDateFromIteration(
        iteration + 2,
        30,
        'preparacion-programada'
      ),
      ubicacionDestinoId: ubicacionId,
      observaciones: pickDeterministic(
        DETERMINISTIC_SHORT_NOTES,
        iteration,
        'preparacion-observaciones'
      ),
    };
  }

  if (resolvedPath.startsWith('/ubicacion')) {
    return {
      nombre: `UBI-${suffix}`,
      descripcion: pickDeterministic(
        DETERMINISTIC_SHORT_NOTES,
        iteration,
        'ubicacion-descripcion'
      ),
    };
  }

  if (resolvedPath === '/incidencias/reportar') {
    const recepcionReportableIds = getStateArray(
      context,
      'recepcionReportableIds'
    ).filter((id) => id.length > 0);
    const selectedRecepcionId =
      recepcionReportableIds[
        iteration % Math.max(1, recepcionReportableIds.length)
      ] || recepcionId;

    return {
      recepcionId: selectedRecepcionId,
      tipo: incidenciaTipo,
    };
  }

  if (resolvedPath === '/incidencias') {
    const pedidoProductoCandidates = Array.from(
      new Set([
        ...getStateArray(context, 'pedidoProductoIdsFresh'),
        ...getStateArray(context, 'seedCreatedPedidoProductoIds'),
        ...getStateArray(context, 'pedidoProductoIds'),
      ])
    ).filter((id) => id.length > 0);

    const pedidoProductoId =
      pedidoProductoCandidates[
        iteration % Math.max(1, pedidoProductoCandidates.length)
      ] ||
      pickStateValue(context, 'pedidoProductoIds', iteration) ||
      env.pickRequired('pedidoProductoIds');

    const cantidadEsperada = deterministicInt(
      5,
      25,
      iteration,
      'incidencia-cantidad-esperada'
    );
    const cantidadRecibida =
      incidenciaEstadoObjetivo === 'pendiente_validacion'
        ? cantidadEsperada
        : Math.max(
            0,
            cantidadEsperada -
              deterministicInt(1, 4, iteration, 'incidencia-cantidad-recibida')
          );

    return {
      recepcionId,
      pedidoId,
      observacionesRecepcion: pickDeterministic(
        DETERMINISTIC_LONG_NOTES,
        iteration,
        'incidencia-create-observaciones'
      ),
      lineas: [
        {
          pedidoProductoId,
          cantidadEsperada,
          cantidadRecibida,
          tipoDiferencia: 'FALTANTE',
          observaciones: pickDeterministic(
            DETERMINISTIC_SHORT_NOTES,
            iteration,
            'incidencia-create-linea-observaciones'
          ),
        },
      ],
    };
  }

  if (
    endpoint.method === 'PATCH' &&
    resolvedPath.startsWith('/incidencias/') &&
    !resolvedPath.endsWith('/resolver')
  ) {
    return {
      pedidoId,
      observacionesRecepcion: pickDeterministic(
        DETERMINISTIC_LONG_NOTES,
        iteration + 1,
        'incidencia-patch-observaciones'
      ),
    };
  }

  if (
    resolvedPath.startsWith('/incidencias') &&
    resolvedPath.endsWith('/resolver')
  ) {
    if (endpoint.method === 'PATCH') {
      if (incidenciaEstadoObjetivo === 'cancelada') {
        return {
          usuarioId,
          marcarComoResuelta: true,
          estadoFinal: 'cancelada',
          observacionesResolucion: pickDeterministic(
            DETERMINISTIC_SHORT_NOTES,
            iteration,
            'incidencia-resolucion-cancelada-observaciones'
          ),
        };
      }

      if (incidenciaEstadoObjetivo === 'invalida') {
        return {
          usuarioId,
          marcarComoResuelta: true,
          estadoFinal: 'invalida',
          observacionesResolucion: pickDeterministic(
            DETERMINISTIC_SHORT_NOTES,
            iteration,
            'incidencia-resolucion-invalida-observaciones'
          ),
        };
      }

      if (incidenciaEstadoObjetivo === 'en_ajuste') {
        const incidenciaId =
          resolvedPath.split('/').filter((segment) => segment.length > 0)[1] ||
          '';
        const incidenciaLineaPairs = getStateArray(
          context,
          'incidenciaToPedidoProductoPairs'
        );
        const pedidoProductoLineaIds = incidenciaLineaPairs
          .map((pair) => pair.split('|'))
          .filter(
            (parts) =>
              parts.length === 2 &&
              parts[0] === incidenciaId &&
              typeof parts[1] === 'string' &&
              parts[1].length > 0
          )
          .map((parts) => parts[1]);
        const pedidoProductoLineaId =
          pedidoProductoLineaIds[
            iteration % Math.max(1, pedidoProductoLineaIds.length)
          ] || pedidoProductoId;

        return {
          marcarComoResuelta: false,
          lineas: [
            {
              pedidoProductoId: pedidoProductoLineaId,
              estadoReclamacion: 'RECLAMADO',
              observaciones: pickDeterministic(
                DETERMINISTIC_SHORT_NOTES,
                iteration,
                'incidencia-resolucion-en-ajuste-observaciones-linea'
              ),
            },
          ],
          observacionesResolucion: pickDeterministic(
            DETERMINISTIC_SHORT_NOTES,
            iteration,
            'incidencia-resolucion-en-ajuste-observaciones'
          ),
        };
      }

      return {
        usuarioId,
        marcarComoResuelta: true,
        estadoFinal: 'resuelta',
        observacionesResolucion: pickDeterministic(
          DETERMINISTIC_SHORT_NOTES,
          iteration,
          'incidencia-resolucion-observaciones'
        ),
      };
    }

    return {
      accion: resolucionTipo,
      observaciones: pickDeterministic(
        DETERMINISTIC_SHORT_NOTES,
        iteration,
        'incidencia-resolver-observaciones'
      ),
    };
  }

  if (resolvedPath.startsWith('/incidencias-resueltas')) {
    const incidenciaPendienteId = consumeStateValue(
      context,
      'incidenciaPendienteIds',
      ''
    );

    return {
      idIncidencia:
        incidenciaPendienteId ||
        pickStateValue(context, 'incidenciaIds', iteration),
      idUsuarioResolutor: usuarioId,
      tipoResolucion: resolucionTipo,
      observaciones: pickDeterministic(
        DETERMINISTIC_SHORT_NOTES,
        iteration,
        'incidencia-resuelta-observaciones'
      ),
    };
  }

  if (resolvedPath === '/merma/produccion/reportar') {
    const produccionLoteId =
      context.getState<string>('seedMermaProduccionLoteId') ||
      getStateArray(context, 'seedCreatedProduccionLoteIds')[0] ||
      getStateArray(context, 'produccionLoteIds')[0] ||
      env.pickRequired('produccionLoteIds');

    const mermaProduccionProductoId =
      context.getState<string>('seedMermaProduccionProductoId') ||
      context.getState<string>('seedMermaTargetProductoId') ||
      productoId ||
      env.pickRequired('productoIds');

    const mermaProduccionMaxCantidad = Number(
      context.getState<number>('seedMermaProduccionMaxCantidad') ??
        context.getState<number>('seedMermaMaxCantidad') ??
        1
    );

    const safeMaxCantidad = Math.max(
      0.001,
      Math.min(mermaProduccionMaxCantidad, 1.5)
    );
    const safeMinCantidad = Math.min(0.05, safeMaxCantidad);

    return {
      produccionLoteId,
      productoId: mermaProduccionProductoId,
      cantidad: deterministicFloat(
        safeMinCantidad,
        safeMaxCantidad,
        3,
        iteration,
        'merma-produccion-cantidad'
      ),
      motivo: mermaMotivo,
      notas: pickDeterministic(
        DETERMINISTIC_SHORT_NOTES,
        iteration,
        'merma-produccion-notas'
      ),
    };
  }

  if (resolvedPath.startsWith('/merma')) {
    const mermaProductoId =
      context.getState<string>('seedMermaTargetProductoId') || productoId;
    const mermaMaxCantidad = Number(
      context.getState<number>('seedMermaMaxCantidad') ?? 1
    );
    const safeMaxCantidad = Math.max(0.001, Math.min(mermaMaxCantidad, 1.5));
    const safeMinCantidad = Math.min(0.05, safeMaxCantidad);

    return {
      productoId: mermaProductoId,
      cantidad: deterministicFloat(
        safeMinCantidad,
        safeMaxCantidad,
        3,
        iteration,
        'merma-cantidad'
      ),
      motivo: mermaMotivo,
      notas: pickDeterministic(
        DETERMINISTIC_SHORT_NOTES,
        iteration,
        'merma-notas'
      ),
    };
  }

  if (resolvedPath.startsWith('/movimientos')) {
    return {
      tipo: movimientoTipo,
      cantidad: deterministicInt(1, 12, iteration, 'movimiento-cantidad'),
      entidadTipo: 'ProductoProveedor',
      entidadId: productoProveedorId,
      descripcion: pickDeterministic(
        DETERMINISTIC_SHORT_NOTES,
        iteration,
        'movimiento-descripcion'
      ),
      inventario: inventarioId,
      productoProveedor: productoProveedorId,
      usuario: usuarioId,
    };
  }

  if (resolvedPath.startsWith('/albaranes')) {
    const numeroAlbaran =
      endpoint.method === 'PATCH'
        ? `ALB-UPD-${suffix}`.toUpperCase().slice(0, 40)
        : `ALB-SEED-${suffix}`.toUpperCase().slice(0, 40);

    return {
      nAlbaran: numeroAlbaran,
      concordancia: deterministicBool(iteration, 'albaran-concordancia'),
      fecha: seedDateFromIteration(iteration, 540, 'albaran-fecha'),
    };
  }

  return undefined;
}
