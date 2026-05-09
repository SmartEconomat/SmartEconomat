import {
  normalizeAlergeno,
  normalizeUnidadMedida,
  type CategoriaProducto,
} from '../../services/producto.types';
import { uploadFile } from '../../services/api.service';
import {
  toFiniteNumberOrUndefined,
  toOptionalTrimmedString,
} from '../../services/api.utils';

type ProductoFormAlergeno = string | { alergeno: string };

interface ProductoFormProveedor {
  proveedorId: string;
  marca?: string;
  codigoBarras?: string;
  precioUnitario?: number | string;
}

interface ProductoFormData extends Record<string, unknown> {
  nombre?: string;
  marca?: string;
  descripcion?: string;
  unidad?: string;
  tipo?: CategoriaProducto;
  contenido?: number | string;
  codigoBarras?: string;
  alergenos?: ProductoFormAlergeno[];
  proveedores?: ProductoFormProveedor[];
  imagen?: File | string;
}

function buildProductoProveedorPayload(
  proveedor: ProductoFormProveedor,
  index: number
) {
  const proveedorId = toOptionalTrimmedString(proveedor.proveedorId);
  if (!proveedorId) {
    return null;
  }

  const precioUnitario = toFiniteNumberOrUndefined(proveedor.precioUnitario);
  if (precioUnitario == null || precioUnitario < 0.01) {
    throw new Error(
      `El precio unitario del proveedor ${index + 1} es obligatorio y debe ser mayor que 0 (mínimo 0.01).`
    );
  }

  const marcaEspecifica = toOptionalTrimmedString(proveedor.marca);
  if (marcaEspecifica && marcaEspecifica.length > 100) {
    throw new Error(
      `La marca especifica del proveedor ${index + 1} no puede superar los 100 caracteres.`
    );
  }

  const codigoBarras = toOptionalTrimmedString(proveedor.codigoBarras);
  if (codigoBarras && codigoBarras.length > 130) {
    throw new Error(
      `El codigo de barras del proveedor ${index + 1} no puede superar los 130 caracteres.`
    );
  }

  return {
    proveedorId,
    marcaEspecifica,
    codigoBarras,
    precioUnitario,
  };
}

/**
 * Construye producto payload a partir de los parámetros recibidos.
 *
 * @param formData Parámetro de entrada para la operación.
 */
/**
 * Expone "buildProductoPayload" en smart-economat-frontend (SPA).
 * @undefined {Record<string, unknown>} formData - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<{ nombre: string; marca: string | undefined; descripcion: string | undefined; unidad: import("/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/services/producto.types").UnidadMedida; tipo: CategoriaProducto | undefined; contenido: number; codigoBarras: string | undefined; pathImg: string | undefined; alergenos: NonNullable<"GLUTEN" | "CRUSTACEOS" | "HUEVOS" | "PESCADO" | "CACAHUETES" | "SOJA" | "LACTEOS" | "FRUTOS_CON_CASCARA" | "APIO" | "MOSTAZA" | "SESAMO" | "SULFITO" | "ALTRAMUCES" | "MOLUSCOS" | undefined>[] | undefined; proveedores: { proveedorId: string; marcaEspecifica?: string; codigoBarras?: string; precioUnitario: number; }[] | undefined; }>} Datos efectivos después de ejecutar la operación.
 */
export async function buildProductoPayload(formData: Record<string, unknown>) {
  const typedFormData = formData as ProductoFormData;
  const nombre = toOptionalTrimmedString(typedFormData.nombre);
  if (!nombre) {
    throw new Error('El nombre del producto es obligatorio.');
  }

  const unidad = normalizeUnidadMedida(typedFormData.unidad);
  if (!unidad) {
    throw new Error('La unidad del producto es obligatoria.');
  }

  const contenido = toFiniteNumberOrUndefined(typedFormData.contenido);
  if (contenido == null || contenido < 0) {
    throw new Error(
      'El contenido del producto debe ser un numero mayor o igual que 0.'
    );
  }

  const codigoBarras = toOptionalTrimmedString(typedFormData.codigoBarras);
  if (codigoBarras && codigoBarras.length > 130) {
    throw new Error('El codigo de barras no puede superar los 130 caracteres.');
  }

  const normalizedAlergenos = Array.isArray(typedFormData.alergenos)
    ? typedFormData.alergenos
        .map((alergeno) =>
          normalizeAlergeno(
            typeof alergeno === 'string' ? alergeno : alergeno.alergeno
          )
        )
        .filter(
          (
            alergeno
          ): alergeno is NonNullable<ReturnType<typeof normalizeAlergeno>> =>
            alergeno !== undefined
        )
    : undefined;

  let finalPathImg: string | undefined;
  if (typedFormData.imagen instanceof File) {
    try {
      finalPathImg = await uploadFile(typedFormData.imagen);
    } catch {
      throw new Error('Hubo un error al subir la imagen del producto.');
    }
  } else if (
    typeof typedFormData.imagen === 'string' &&
    typedFormData.imagen.trim()
  ) {
    finalPathImg = typedFormData.imagen.trim();
  }

  const activoExplicit =
    typeof typedFormData.activo === 'boolean'
      ? typedFormData.activo
      : undefined;

  const proveedores = Array.isArray(typedFormData.proveedores)
    ? typedFormData.proveedores.reduce<
        Array<{
          proveedorId: string;
          marcaEspecifica?: string;
          codigoBarras?: string;
          precioUnitario: number;
        }>
      >((acc, proveedor, index) => {
        const normalizedProveedor = buildProductoProveedorPayload(
          proveedor,
          index
        );

        if (normalizedProveedor) {
          acc.push(normalizedProveedor);
        }

        return acc;
      }, [])
    : undefined;

  return {
    nombre,
    marca: toOptionalTrimmedString(typedFormData.marca),
    descripcion: toOptionalTrimmedString(typedFormData.descripcion),
    unidad,
    tipo: typedFormData.tipo || undefined,
    contenido,
    codigoBarras,
    pathImg: finalPathImg,
    alergenos: normalizedAlergenos,
    proveedores: proveedores?.length ? proveedores : undefined,
    ...(activoExplicit !== undefined ? { activo: activoExplicit } : {}),
  };
}
