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
import { useTranslation } from 'react-i18next';

// ── Base schema logic ──────────────────────────────────────────────────

const getProductoBaseSchema = (t: (key: string) => string): DynamicField[] => [
  { name: 'nombre', label: t('inventario.fields.name'), required: true },
  { name: 'marca', label: t('inventario.fields.brand') },
  { name: 'descripcion', label: t('inventario.fields.description') },
  {
    name: 'contenido',
    label: t('inventario.fields.content'),
    type: 'number',
    required: true,
  },
  {
    name: 'unidad',
    label: t('inventario.fields.unit'),
    type: 'select',
    options: [
      { value: UnidadMedida.KG, label: 'Kg' },
      {
        value: UnidadMedida.G,
        label: t('recetas.table.unit_gramo') || 'Gramo',
      }, // Assuming added to recipes or common
      { value: UnidadMedida.L, label: 'Litro' },
      { value: UnidadMedida.ML, label: 'Mililitro' },
      { value: UnidadMedida.UNIDAD, label: t('common.units') },
      { value: UnidadMedida.PAQ, label: 'Paquete' },
    ],
    required: true,
    width: 4,
  },
  {
    name: 'tipo',
    label: t('inventario.fields.category'),
    type: 'select',
    width: 4,
    options: [
      {
        value: CategoriaProducto.VERDURA,
        label: t('productos.categories.verdura'),
      },
      {
        value: CategoriaProducto.FRUTA,
        label: t('productos.categories.fruta'),
      },
      {
        value: CategoriaProducto.CARNE,
        label: t('productos.categories.carne'),
      },
      {
        value: CategoriaProducto.PESCADO,
        label: t('productos.categories.pescado'),
      },
      {
        value: CategoriaProducto.MARISCO,
        label: t('productos.categories.pescado'),
      }, // Mapping to Pescado if missing or add to JSON
      {
        value: CategoriaProducto.LACTEO,
        label: t('productos.categories.lacteo'),
      },
      {
        value: CategoriaProducto.HUEVO,
        label: t('productos.categories.huevo'),
      },
      {
        value: CategoriaProducto.CEREAL,
        label: t('productos.categories.legumbre'),
      }, // Mapping
      {
        value: CategoriaProducto.LEGUMBRE,
        label: t('productos.categories.legumbre'),
      },
      {
        value: CategoriaProducto.FRUTO_SECO,
        label: t('productos.categories.otro'),
      },
      {
        value: CategoriaProducto.CONDIMENTO,
        label: t('productos.categories.especia'),
      },
      {
        value: CategoriaProducto.ACEITE,
        label: t('productos.categories.aceite'),
      },
      {
        value: CategoriaProducto.AZUCAR,
        label: t('productos.categories.otro'),
      },
      {
        value: CategoriaProducto.BEBIDA,
        label: t('productos.categories.bebida'),
      },
      { value: CategoriaProducto.OTRO, label: t('productos.categories.otro') },
    ],
  },
  {
    name: 'codigoBarras',
    label: t('inventario.fields.barcode'),
    type: 'barcode',
  },
  {
    name: 'imagen',
    label: t('common.uploadImage'),
    type: 'image',
    getFallbackIcon: (formData) =>
      getCategoryIcon(formData.tipo as CategoriaProducto, {
        sx: { fontSize: 80, color: 'text.secondary', opacity: 0.5 },
      }),
  },
  {
    name: 'alergenos',
    label: t('productos.detail.sections.allergens'),
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
  const { t } = useTranslation();
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
    const schema = getProductoBaseSchema(t);
    schema.push({
      name: 'proveedores',
      label: t('productos.detail.sections.suppliers'),
      type: 'proveedores',
      position: 'bottom',
      defaultValue: [],
      options: proveedores.map((p) => ({ value: p.id, label: p.nombre })),
    });
    return schema;
  }, [proveedores, t]);

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
        error instanceof Error ? error.message : t('common.errors.unknown');
      toast.error(message);
      return undefined;
    }
  }, [toast, t]);

  return (
    <DynamicFormModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        title ??
        (isEditing
          ? t('common.editItem', { name: String(initialData.nombre || '') })
          : t('dashboard.modals.newProduct'))
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
          ? t('proveedores.dialogs.confirmEdit')
          : t('proveedores.dialogs.confirmCreate')
      }
    />
  );
};

export default ProductoFormModal;
