import React, { useEffect, useState, useCallback } from 'react';
import DynamicFormModal, {
  DynamicField,
  DynamicFormModalProps,
} from '../../components/ui/DynamicFormModal';
import { CategoriaProducto, UnidadMedida } from '../../services/producto.types';
import { fetchProveedores } from '../../services/proveedor.service';
import { Proveedor } from '../../services/proveedor.types';
import {
  searchByBarcode,
  searchByName,
  OFFProduct,
} from '../../services/openfoodfacts.service';
import { generateProductoEan13 } from '../../services/producto.service';
import { getCategoryIcon } from './utils/getCategoryIcon';
import { usePermission } from '../../store/auth.hooks';
import { PERMISSIONS } from '../../sherlock-auth/permissions.constants';
import { useToast } from '../../store/toast.hooks';

// ── Base schema ────────────────────────────────────────────────────────

const productoBaseSchema: DynamicField[] = [
  { name: 'nombre', label: 'Nombre Comercial', required: true },
  { name: 'marca', label: 'Marca' },
  { name: 'descripcion', label: 'Descripción' },
  {
    name: 'contenido',
    label: 'Contenido Numérico',
    type: 'number',
    required: true,
  },
  {
    name: 'unidad',
    label: 'Unidad de Medida',
    type: 'select',
    options: [
      { value: UnidadMedida.KG, label: 'Kg' },
      { value: UnidadMedida.G, label: 'Gramo' },
      { value: UnidadMedida.L, label: 'Litro' },
      { value: UnidadMedida.ML, label: 'Mililitro' },
      { value: UnidadMedida.UNIDAD, label: 'Unidad' },
      { value: UnidadMedida.PAQ, label: 'Paquete' },
    ],
    required: true,
    width: 4,
  },
  {
    name: 'tipo',
    label: 'Categoría',
    type: 'select',
    width: 4,
    options: [
      { value: CategoriaProducto.VERDURA, label: 'Verdura' },
      { value: CategoriaProducto.FRUTA, label: 'Fruta' },
      { value: CategoriaProducto.CARNE, label: 'Carne' },
      { value: CategoriaProducto.PESCADO, label: 'Pescado' },
      { value: CategoriaProducto.MARISCO, label: 'Marisco' },
      { value: CategoriaProducto.LACTEO, label: 'Lácteo' },
      { value: CategoriaProducto.HUEVO, label: 'Huevo' },
      { value: CategoriaProducto.CEREAL, label: 'Cereal' },
      { value: CategoriaProducto.LEGUMBRE, label: 'Legumbre' },
      { value: CategoriaProducto.FRUTO_SECO, label: 'Fruto Seco' },
      { value: CategoriaProducto.CONDIMENTO, label: 'Condimento' },
      { value: CategoriaProducto.ACEITE, label: 'Aceite' },
      { value: CategoriaProducto.AZUCAR, label: 'Azúcar' },
      { value: CategoriaProducto.BEBIDA, label: 'Bebida' },
      { value: CategoriaProducto.OTRO, label: 'Otro' },
    ],
  },
  { name: 'codigoBarras', label: 'Código de Barras', type: 'barcode' },
  {
    name: 'imagen',
    label: 'Cargar Imagen',
    type: 'image',
    getFallbackIcon: (formData) =>
      getCategoryIcon(formData.tipo as CategoriaProducto, {
        sx: { fontSize: 80, color: 'text.secondary', opacity: 0.5 },
      }),
  },
  {
    name: 'alergenos',
    label: 'Alérgenos Presentes',
    type: 'allergens',
    position: 'bottom',
  },
];

// ── OFF helpers ────────────────────────────────────────────────────────

function mapOFFToForm(p: OFFProduct): Record<string, unknown> {
  return {
    nombre: p.name,
    marca: p.brand ?? '',
    descripcion: p.description ?? '',
    unidad: p.uom ?? '',
    contenido: p.quantity ?? '',
    alergenos: p.allergens ?? [],
    imagen: p.imageUrl ?? '',
  };
}

// ── Component ──────────────────────────────────────────────────────────

export type ProductoFormModalProps = Pick<
  DynamicFormModalProps,
  'isOpen' | 'onClose' | 'initialData' | 'onSubmit' | 'isSubmitting'
> & {
  title?: DynamicFormModalProps['title'];
};

const ProductoFormModal: React.FC<ProductoFormModalProps> = ({
  isOpen,
  onClose,
  initialData = {},
  onSubmit,
  isSubmitting = false,
  title,
}) => {
  const isEditing = Boolean(initialData.id);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const canGenerateEan13 = usePermission(PERMISSIONS.productos.generar_ean13);
  const toast = useToast();

  useEffect(() => {
    if (!isOpen) return;
    fetchProveedores(1, 50)
      .then((resp) => setProveedores(resp.data))
      .catch(() => setProveedores([]));
  }, [isOpen]);

  const dynamicSchema = React.useMemo(() => {
    const schema = [...productoBaseSchema];
    schema.push({
      name: 'proveedores',
      label: 'Proveedores Asociados',
      type: 'proveedores',
      position: 'bottom',
      defaultValue: [],
      options: proveedores.map((p) => ({ value: p.id, label: p.nombre })),
    });
    return schema;
  }, [proveedores]);

  const handleBarcodeFetch = useCallback(async (code: string) => {
    const product = await searchByBarcode(code);
    if (product) return mapOFFToForm(product);
  }, []);

  const handleOFFSearch = useCallback(
    async (value: string): Promise<Array<Record<string, unknown>>> => {
      const isBarcode = /^\d+$/.test(value.trim());
      if (isBarcode) {
        const product = await searchByBarcode(value);
        return product ? [mapOFFToForm(product)] : [];
      }
      const products = await searchByName(value);
      return products.map(mapOFFToForm);
    },
    []
  );

  const handleBarcodeGenerate = useCallback(async () => {
    try {
      return await generateProductoEan13();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo generar el codigo de barras.';
      toast.error(message);
      return undefined;
    }
  }, [toast]);

  return (
    <DynamicFormModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        title ??
        (isEditing
          ? `Editar: ${String(initialData.nombre || '')}`
          : 'Crear Nuevo Producto')
      }
      size="lg"
      fields={dynamicSchema}
      initialData={initialData}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      requireConfirmation={true}
      onBarcodeFetch={handleBarcodeFetch}
      onBarcodeGenerate={canGenerateEan13 ? handleBarcodeGenerate : undefined}
      onOFFSearch={handleOFFSearch}
      confirmationMessage={
        isEditing
          ? '¿Estás seguro de que deseas guardar los cambios realizados en este producto?'
          : '¿Estás seguro de que deseas añadir este nuevo producto al inventario?'
      }
    />
  );
};

export default ProductoFormModal;
