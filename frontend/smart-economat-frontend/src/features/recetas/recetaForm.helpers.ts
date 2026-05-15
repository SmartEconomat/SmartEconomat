import { resolveStoredFileUrl, uploadFile } from '../../services/api.service';
import {
  DificultadReceta,
  Receta,
  type RecetaIngredientePayload,
  type RecetaPayload,
  UnidadIngrediente,
} from '../../services/receta.types';
import { parseLocalizedNumber } from '../../utils/numberUtils';
import { toOptionalTrimmedString } from '../../services/api.utils';
import { parseRequiredRecetaTiempoMinutos } from './receta-tiempo.utils';

type RecetaIngredienteFormValue = {
  productoId?: string;
  producto?: { id: string };
  cantidad: number | string;
  unidad: string;
  mermaAplicada?: number | string;
  proveedorFavoritoId?: string;
};

type RecetaIngredienteWithRelations = NonNullable<
  Receta['ingredientes']
>[number] & {
  productoId?: string;
  proveedorFavoritoId?: string;
};

function normalizeIngredienteForForm(
  ingrediente: RecetaIngredienteWithRelations
): RecetaIngredienteFormValue {
  const productoId = ingrediente.productoId ?? ingrediente.producto?.id;
  const proveedorFavoritoId =
    ingrediente.proveedorFavoritoId ?? ingrediente.proveedorFavorito?.id;

  return {
    ...ingrediente,
    productoId,
    producto: ingrediente.producto
      ? {
          id: ingrediente.producto.id,
        }
      : undefined,
    proveedorFavoritoId,
  };
}

function parsePositiveOptionalNumber(
  value: string | number | null | undefined,
  label: string
): number | undefined {
  const parsedValue = parseLocalizedNumber(value);
  if (parsedValue == null) {
    return undefined;
  }

  if (parsedValue <= 0) {
    throw new Error(`${label} debe ser mayor que 0.`);
  }

  return parsedValue;
}

function parsePositiveOptionalInteger(
  value: unknown,
  label: string
): number | undefined {
  if (value == null || value === '') {
    return undefined;
  }

  const parsedValue = Number(value);
  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    throw new Error(`${label} debe ser un numero entero mayor o igual que 1.`);
  }

  return parsedValue;
}

function normalizeRecipeImagePath(imagePath: string): string | undefined {
  const trimmedPath = imagePath.trim();
  if (!trimmedPath) return undefined;

  if (/^https?:\/\//i.test(trimmedPath) || trimmedPath.startsWith('blob:')) {
    return trimmedPath;
  }

  const normalizedPath = trimmedPath.replace(/\\/g, '/');
  if (
    /^\/?uploads\/[A-Za-z0-9._/-]+$/i.test(normalizedPath) ||
    /^\/?archivos\/content\/[A-Za-z0-9._/-]+$/i.test(normalizedPath)
  ) {
    return normalizedPath;
  }

  return undefined;
}

function normalizeIngredients(
  ingredients: RecetaIngredienteFormValue[],
  t: (key: string) => string
): RecetaIngredientePayload[] {
  return ingredients.reduce<RecetaIngredientePayload[]>(
    (acc, ingredient, index) => {
      const productoId = ingredient.productoId || ingredient.producto?.id;
      if (!productoId) {
        const cantidad = Number(ingredient.cantidad);
        const hasIngredientData =
          (Number.isFinite(cantidad) && cantidad > 0) ||
          Boolean(ingredient.unidad);

        if (hasIngredientData) {
          throw new Error(t('recipes.errors.productoInvalido'));
        }

        return acc;
      }

      const cantidad = Number(ingredient.cantidad);
      if (!Number.isFinite(cantidad) || cantidad <= 0) {
        return acc;
      }

      const unidad = ingredient.unidad as UnidadIngrediente;
      if (!Object.values(UnidadIngrediente).includes(unidad)) {
        throw new Error(`La unidad del ingrediente ${index + 1} no es valida.`);
      }

      const mermaAplicada = Number(ingredient.mermaAplicada ?? 0);
      if (
        !Number.isFinite(mermaAplicada) ||
        mermaAplicada < 0 ||
        mermaAplicada > 99
      ) {
        throw new Error(
          `La merma del ingrediente ${index + 1} debe estar entre 0 y 99.`
        );
      }

      acc.push({
        productoId,
        cantidad,
        unidad,
        mermaAplicada,
        proveedorFavoritoId: toOptionalTrimmedString(
          ingredient.proveedorFavoritoId
        ),
      });

      return acc;
    },
    []
  );
}

/**
 * Mapea receta to form data al formato de dominio esperado.
 *
 * @param receta Parámetro de entrada para la operación.
 * @returns Valor resultante de la operación.
 */
export function mapRecetaToFormData(receta: Receta): Record<string, unknown> {
  const imagen = resolveStoredFileUrl(
    receta.pathImgOptimized || receta.pathImg || ''
  );
  const ingredientes = Array.isArray(receta.ingredientes)
    ? receta.ingredientes.map(normalizeIngredienteForForm)
    : [];

  return {
    ...receta,
    ingredientes,
    imagen,
  };
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Expone "buildRecetaPayload" en smart-economat-frontend (SPA).
 * @undefined {Record<string, unknown>} formData - Entrada efectiva esperada por el contrato.
 * @undefined {(key: string) => string} t - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<RecetaPayload>} Datos efectivos después de ejecutar la operación.
 */
export async function buildRecetaPayload(
  formData: Record<string, unknown>,
  t: (key: string) => string = (key) => key
): Promise<RecetaPayload> {
  const nombre = toOptionalTrimmedString(formData.nombre);
  if (!nombre) {
    throw new Error('El nombre de la receta es obligatorio.');
  }

  const instrucciones = toOptionalTrimmedString(formData.instrucciones);
  if (!instrucciones) {
    throw new Error('Las instrucciones de la receta son obligatorias.');
  }

  const dificultad = formData.dificultad as DificultadReceta | undefined;
  if (!dificultad || !Object.values(DificultadReceta).includes(dificultad)) {
    throw new Error('La dificultad de la receta es obligatoria.');
  }

  const ingredientes = normalizeIngredients(
    Array.isArray(formData.ingredientes)
      ? (formData.ingredientes as RecetaIngredienteFormValue[])
      : [],
    t
  );

  if (ingredientes.length === 0) {
    throw new Error(t('recipes.errors.ingredienteObligatorio'));
  }

  let finalPathImg: string | undefined;
  if (formData.imagen instanceof File) {
    try {
      finalPathImg = await uploadFile(formData.imagen);
    } catch {
      throw new Error('Hubo un error al subir la imagen de la receta.');
    }
  } else if (typeof formData.imagen === 'string' && formData.imagen.trim()) {
    const normalizedPath = normalizeRecipeImagePath(formData.imagen);
    if (!normalizedPath) {
      throw new Error(t('recipes.errors.imagenRutaInvalida'));
    }
    finalPathImg = normalizedPath;
  }

  const unidadResultadoRaw = toOptionalTrimmedString(formData.unidadResultado);
  const unidadResultado = unidadResultadoRaw as UnidadIngrediente | undefined;
  if (
    unidadResultado &&
    !Object.values(UnidadIngrediente).includes(unidadResultado)
  ) {
    throw new Error('La unidad de resultado de la receta no es valida.');
  }

  return {
    nombre,
    instrucciones,
    tiempoEstimadoMinutos: parseRequiredRecetaTiempoMinutos(
      formData.tiempoEstimadoMinutos ?? formData.tiempoPreparacion
    ),
    dificultad,
    rendimiento: parsePositiveOptionalNumber(
      formData.rendimiento as string | number | null | undefined,
      'El rendimiento'
    ),
    unidadResultado,
    diasCaducidad: parsePositiveOptionalInteger(
      formData.diasCaducidad,
      'Los dias de caducidad'
    ),
    raciones:
      parsePositiveOptionalNumber(
        formData.raciones as string | number | null | undefined,
        'Las raciones'
      ) ?? 1,
    tamanioRacion: (() => {
      const explicit = parsePositiveOptionalNumber(
        formData.tamanioRacion as string | number | null | undefined,
        'El tamano de racion'
      );
      if (explicit != null) return explicit;

      const rendimientoVal = parsePositiveOptionalNumber(
        formData.rendimiento as string | number | null | undefined,
        'El rendimiento'
      );
      const racionesVal =
        parsePositiveOptionalNumber(
          formData.raciones as string | number | null | undefined,
          'Las raciones'
        ) ?? 1;

      if (rendimientoVal != null && racionesVal > 0) {
        return rendimientoVal / racionesVal;
      }

      return undefined;
    })(),
    ingredientes,
    ...(finalPathImg ? { pathImg: finalPathImg } : {}),
  };
}
