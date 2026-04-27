import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import DynamicFormModal, { DynamicField } from './DynamicFormModal';
import {
  createProveedor,
  CreateProveedorPayload,
} from '../../services/proveedor.service';
import { Proveedor } from '../../services/proveedor.types';
import { useToast } from '../../store/toast.hooks';

interface QuickProveedorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProveedor: Proveedor) => void;
}

const buildProveedorQuickSchema = (
  t: TFunction<'translation'>
): DynamicField[] => [
  {
    name: 'nif',
    label: t('proveedores.form.nifCuit'),
    required: true,
    width: 4,
    maxLength: 20,
    pattern: '^[a-zA-Z0-9]+$',
    patternMessage: t('proveedores.form.nifPattern'),
  },
  {
    name: 'nombre',
    label: t('proveedores.form.razonSocial'),
    required: true,
    width: 8,
    maxLength: 100,
  },
  {
    name: 'contacto',
    label: t('proveedores.form.personaContacto'),
    maxLength: 100,
  },
  {
    name: 'telefono',
    label: t('proveedores.form.telefono'),
    width: 6,
    maxLength: 50,
    pattern: '^[+]?[0-9\\s]*$',
    patternMessage: t('proveedores.form.telefonoPattern'),
  },
  {
    name: 'email',
    label: t('proveedores.form.email'),
    type: 'email',
    width: 6,
    maxLength: 255,
  },
  {
    name: 'direccion',
    label: t('proveedores.form.direccion'),
  },
];

const QuickProveedorModal: React.FC<QuickProveedorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const proveedorSchema = useMemo(() => buildProveedorQuickSchema(t), [t]);

  const handleSave = async (formData: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      const payload: CreateProveedorPayload = {
        nombre: formData.nombre as string,
        contacto: formData.contacto as string,
        telefono: formData.telefono as string,
        email: formData.email as string,
        direccion: formData.direccion as string,
        nif: formData.nif as string,
      };

      const newProveedor = await createProveedor(payload);
      toast.success(
        t('proveedores.toast.creadoNombre', { nombre: newProveedor.nombre })
      );
      onSuccess(newProveedor);
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('proveedores.errors.errorCrear');
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DynamicFormModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('proveedores.modal.tituloCrear')}
      size="md"
      fields={proveedorSchema}
      initialData={{}}
      onSubmit={handleSave}
      isSubmitting={isSaving}
    />
  );
};

export default QuickProveedorModal;
