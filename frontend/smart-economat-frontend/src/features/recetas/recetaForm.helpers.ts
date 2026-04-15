import { resolveStoredFileUrl, uploadFile } from '../../services/api.service';
import {
  DificultadReceta,
  Receta,
  type RecetaIngredientePayload,
  type RecetaPayload,
  TiempoReceta,
  UnidadIngrediente,
} from '../../services/receta.types';
import { parseLocalizedNumber } from '../../utils/numberUtils';
import { toOptionalTrimmedString } from '../../services/api.utils';

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

function getMinutesFromValue(value: unknown): number {
  const match = String(value ?? '').match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : 30;
}

function mapMinutesToTiempoPreparacion(minutes?: number | null): TiempoReceta {
  if (!minutes || Number.isNaN(minutes)) {
    return TiempoReceta.MIN_30;
  }

  if (minutes <= 10) {
    return TiempoReceta.MIN_10;
  }

  if (minutes <= 20) {
    return TiempoReceta.MIN_20;
  }

  if (minutes <= 30) {
    return TiempoReceta.MIN_30;
  }

  if (minutes <= 45) {
    return TiempoReceta.MIN_45;
  }

  return TiempoReceta.MIN_60;
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

function normalizeIngredients(
  ingredients: RecetaIngredienteFormValue[]
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
          throw new Error(
            `La receta contiene un producto inactivo o no disponible en el ingrediente ${index + 1}.`
          );
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
      if (!Number.isFinite(mermaAplicada) || mermaAplicada < 0) {
        throw new Error(
          `La merma del ingrediente ${index + 1} debe ser un numero mayor o igual que 0.`
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
 * @description Converts a Receta entity into the flat form-data shape expected by RecetaFormModal.
 * Normalises ingredient references (productoId, proveedorFavoritoId) and resolves the stored image URL.
 * @param receta - The Receta entity returned by the API
 * @returns Plain object suitable for initialising the receta form
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
    tiempoPreparacion: mapMinutesToTiempoPreparacion(
      receta.tiempoEstimadoMinutos
    ),
    imagen,
  };
}

/**
 * @description Validates and transforms raw receta form data into the API RecetaPayload.
 * Uploads a new image file when present, normalises ingredients (merma, unidad, cantidad),
 * and enforces business rules (at least one ingredient, valid difficulty, etc.).
 * @param formData - Raw values from the receta form
 * @returns Promise resolving to a validated RecetaPayload ready to be sent to the API
 * @throws {Error} When required fields are missing or validation fails
 */
export async function buildRecetaPayload(
  formData: Record<string, unknown>
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
      : []
  );

  if (ingredientes.length === 0) {
    throw new Error('La receta debe incluir al menos un ingrediente valido.');
  }

  let finalPathImg: string | undefined;
  if (formData.imagen instanceof File) {
    try {
      finalPathImg = await uploadFile(formData.imagen);
    } catch {
      throw new Error('Hubo un error al subir la imagen de la receta.');
    }
  } else if (typeof formData.imagen === 'string' && formData.imagen.trim()) {
    finalPathImg = formData.imagen.trim();
  }

  const unidadResultado = formData.unidadResultado as
    | UnidadIngrediente
    | undefined;
  if (
    unidadResultado &&
    !Object.values(UnidadIngrediente).includes(unidadResultado)
  ) {
    throw new Error('La unidad de resultado de la receta no es valida.');
  }

  return {
    nombre,
    instrucciones,
    tiempoEstimadoMinutos: getMinutesFromValue(formData.tiempoPreparacion),
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
    tamanioRacion: parsePositiveOptionalNumber(
      formData.tamanioRacion as string | number | null | undefined,
      'El tamano de racion'
    ),
    ingredientes,
    ...(finalPathImg ? { pathImg: finalPathImg } : {}),
  };
}
