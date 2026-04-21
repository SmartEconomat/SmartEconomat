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
  const { t } = useTranslation();
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

  const productoBaseSchema: DynamicField[] = [
    {
      name: 'nombre',
      label: t('productoFormModal.fields.nombre'),
      required: true,
    },
    { name: 'marca', label: t('productoFormModal.fields.marca') },
    { name: 'descripcion', label: t('productoFormModal.fields.descripcion') },
    {
      name: 'contenido',
      label: t('productoFormModal.fields.contenido'),
      type: 'number',
      required: true,
    },
    {
      name: 'unidad',
      label: t('productoFormModal.fields.unidad'),
      type: 'select',
      options: [
        { value: UnidadMedida.KG, label: t('productoFormModal.units.kg') },
        { value: UnidadMedida.G, label: t('productoFormModal.units.g') },
        { value: UnidadMedida.L, label: t('productoFormModal.units.l') },
        { value: UnidadMedida.ML, label: t('productoFormModal.units.ml') },
        {
          value: UnidadMedida.UNIDAD,
          label: t('productoFormModal.units.unidad'),
        },
        { value: UnidadMedida.PAQ, label: t('productoFormModal.units.paq') },
      ],
      required: true,
      width: 4,
    },
    {
      name: 'tipo',
      label: t('productoFormModal.fields.categoria'),
      type: 'select',
      width: 4,
      options: [
        { value: CategoriaProducto.VERDURA, label: t('categoria.VERDURA') },
        { value: CategoriaProducto.FRUTA, label: t('categoria.FRUTA') },
        { value: CategoriaProducto.CARNE, label: t('categoria.CARNE') },
        { value: CategoriaProducto.PESCADO, label: t('categoria.PESCADO') },
        { value: CategoriaProducto.MARISCO, label: t('categoria.MARISCO') },
        { value: CategoriaProducto.LACTEO, label: t('categoria.LACTEO') },
        { value: CategoriaProducto.HUEVO, label: t('categoria.HUEVO') },
        { value: CategoriaProducto.CEREAL, label: t('categoria.CEREAL') },
        { value: CategoriaProducto.LEGUMBRE, label: t('categoria.LEGUMBRE') },
        {
          value: CategoriaProducto.FRUTO_SECO,
          label: t('categoria.FRUTO_SECO'),
        },
        {
          value: CategoriaProducto.CONDIMENTO,
          label: t('categoria.CONDIMENTO'),
        },
        { value: CategoriaProducto.ACEITE, label: t('categoria.ACEITE') },
        { value: CategoriaProducto.AZUCAR, label: t('categoria.AZUCAR') },
        { value: CategoriaProducto.BEBIDA, label: t('categoria.BEBIDA') },
        { value: CategoriaProducto.OTRO, label: t('categoria.OTRO') },
      ],
    },
    {
      name: 'codigoBarras',
      label: t('productoFormModal.fields.codigoBarras'),
      type: 'barcode',
    },
    {
      name: 'imagen',
      label: t('productoFormModal.fields.imagen'),
      type: 'image',
      getFallbackIcon: (formData) =>
        getCategoryIcon(formData.tipo as CategoriaProducto, {
          sx: { fontSize: 80, color: 'text.secondary', opacity: 0.5 },
        }),
    },
    {
      name: 'alergenos',
      label: t('productoFormModal.fields.alergenos'),
      type: 'allergens',
      position: 'bottom',
    },
  ];

  const dynamicSchema = React.useMemo(() => {
    const schema = [...productoBaseSchema];
    schema.push({
      name: 'proveedores',
      label: t('productoFormModal.fields.proveedores'),
      type: 'proveedores',
      position: 'bottom',
      defaultValue: [],
      options: proveedores.map((p) => ({ value: p.id, label: p.nombre })),
    });
    return schema;
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          ? t('productoFormModal.editTitle', {
              name: String(initialData.nombre || ''),
            })
          : t('productoFormModal.createTitle'))
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
          ? t('productoFormModal.confirmEdit')
          : t('productoFormModal.confirmCreate')
      }
    />
  );
};

export default ProductoFormModal;
