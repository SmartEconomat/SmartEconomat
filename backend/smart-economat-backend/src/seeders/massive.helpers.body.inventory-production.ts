import { faker } from '@faker-js/faker';
import { BuildBodyEnv } from './massive.helpers.body.shared';
import {
  consumeStateValue,
  getStateArray,
  pickStateValue,
} from './massive.state';

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
    proveedorId,
    productoId,
    recetaId,
    inventarioId,
    manualTipo,
    ubicacionId,
    recetaDificultad,
    recetaUnidad,
    incidenciaTipo,
    recepcionId,
    pedidoId,
    usuarioId,
    resolucionTipo,
    mermaMotivo,
    movimientoTipo,
  } = env;

  if (resolvedPath === '/inventario/ajustes-manuales') {
    const baseAjuste = faker.number.int({ min: 1, max: 7 });
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
      observaciones: faker.lorem.sentence(),
    };
  }

  if (resolvedPath.startsWith('/inventario')) {
    return {
      productoProveedorId,
      ubicacionId,
      cantidadActual: faker.number.int({ min: 20, max: 260 }),
      cantidadMinima: faker.number.int({ min: 3, max: 20 }),
      cantidadMaxima: faker.number.int({ min: 300, max: 800 }),
    };
  }

  if (resolvedPath === '/recetas/duplicate') {
    return {
      sourceId: recetaId,
      newName: `Receta duplicada ${suffix}`,
    };
  }

  if (resolvedPath === '/recetas') {
    return {
      nombre: `Receta ${suffix}`,
      instrucciones: faker.lorem.sentences(2),
      tiempoEstimadoMinutos: faker.number.int({ min: 10, max: 120 }),
      dificultad: recetaDificultad,
      rendimiento: Number(
        faker.number.float({ min: 0.5, max: 6, fractionDigits: 2 })
      ),
      unidadResultado: recetaUnidad,
      ingredientes: [
        {
          productoId,
          cantidad: Number(
            faker.number.float({ min: 0.1, max: 2.5, fractionDigits: 2 })
          ),
          unidad: recetaUnidad,
          mermaAplicada: faker.number.int({ min: 0, max: 10 }),
          proveedorFavoritoId: proveedorId,
        },
      ],
    };
  }

  if (templatePath === '/recetas/:id' && endpoint.method === 'PATCH') {
    return {
      nombre: `Receta editada ${suffix}`,
      instrucciones: faker.lorem.sentences(2),
      tiempoEstimadoMinutos: faker.number.int({ min: 10, max: 120 }),
      dificultad: recetaDificultad,
      rendimiento: Number(
        faker.number.float({ min: 0.5, max: 6, fractionDigits: 2 })
      ),
      unidadResultado: recetaUnidad,
    };
  }

  if (resolvedPath.endsWith('/cocinar')) {
    return { cantidad: faker.number.int({ min: 1, max: 6 }) };
  }

  if (resolvedPath === '/produccion/ejecutar') {
    const preferredProduccionRecetaId =
      getStateArray(context, 'seedCreatedRecetaIds')[0] ||
      recetaId ||
      env.pickRequired('recetaIds');

    return {
      recetaId: preferredProduccionRecetaId,
      cantidadProducida: Number(
        faker.number.float({ min: 1.2, max: 4.5, fractionDigits: 2 })
      ),
      ubicacionDestinoId: ubicacionId,
    };
  }

  if (resolvedPath === '/produccion/validar') {
    const preferredProduccionRecetaId =
      getStateArray(context, 'seedCreatedRecetaIds')[0] ||
      recetaId ||
      env.pickRequired('recetaIds');

    return {
      items: [
        {
          recetaId: preferredProduccionRecetaId,
          cantidad: Number(
            faker.number.float({ min: 0.8, max: 3.5, fractionDigits: 2 })
          ),
        },
      ],
    };
  }

  if (
    resolvedPath.startsWith('/produccion/lote/') &&
    resolvedPath.endsWith('/consumir')
  ) {
    return {
      tipo: 'raciones',
      valor: Number(
        faker.number.float({ min: 0.2, max: 0.8, fractionDigits: 2 })
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
      cantidadAProducir: Number(
        faker.number.float({ min: 1, max: 4, fractionDigits: 2 })
      ),
      ubicacionDestinoId: ubicacionId,
      observaciones: faker.lorem.sentence(),
    };
  }

  if (resolvedPath.startsWith('/ubicacion')) {
    return {
      nombre: `UBI-${suffix}`,
      descripcion: faker.lorem.sentence(),
    };
  }

  if (resolvedPath === '/incidencias/reportar') {
    return {
      recepcionId,
      tipo: incidenciaTipo,
    };
  }

  if (resolvedPath === '/incidencias') {
    return {
      recepcionId,
      pedidoId,
      observacionesRecepcion: faker.lorem.sentence(),
    };
  }

  if (
    endpoint.method === 'PATCH' &&
    resolvedPath.startsWith('/incidencias/') &&
    !resolvedPath.endsWith('/resolver')
  ) {
    return {
      observacionesRecepcion: faker.lorem.sentence(),
    };
  }

  if (
    resolvedPath.startsWith('/incidencias') &&
    resolvedPath.endsWith('/resolver')
  ) {
    if (endpoint.method === 'PATCH') {
      return {
        usuarioId,
        observacionesResolucion: faker.lorem.sentence(),
      };
    }

    return {
      accion: resolucionTipo,
      observaciones: faker.lorem.sentence(),
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
      observaciones: faker.lorem.sentence(),
    };
  }

  if (resolvedPath.startsWith('/merma')) {
    return {
      productoId,
      cantidad: Number(
        faker.number.float({ min: 0.2, max: 4, fractionDigits: 2 })
      ),
      motivo: mermaMotivo,
      notas: faker.lorem.sentence(),
    };
  }

  if (resolvedPath.startsWith('/movimientos')) {
    return {
      tipo: movimientoTipo,
      cantidad: faker.number.int({ min: 1, max: 12 }),
      entidadTipo: 'ProductoProveedor',
      entidadId: productoProveedorId,
      descripcion: faker.lorem.sentence(),
      inventario: inventarioId,
      productoProveedor: productoProveedorId,
      usuario: usuarioId,
    };
  }

  if (resolvedPath.startsWith('/albaranes')) {
    return {
      nAlbaran: `ALB-${faker.string.alphanumeric(8).toUpperCase()}`,
      concordancia: iteration % 2 === 0,
      fecha: new Date().toISOString(),
    };
  }

  return undefined;
}
