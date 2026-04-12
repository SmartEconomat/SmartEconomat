import React, { useState } from 'react';
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

const proveedorSchema: DynamicField[] = [
  {
    name: 'nif',
    label: 'NIF / CUIT',
    required: true,
    width: 4,
    maxLength: 20,
    pattern: '^[a-zA-Z0-9]+$',
    patternMessage: 'NIF solo permite caracteres alfanuméricos',
  },
  {
    name: 'nombre',
    label: 'Razón Social',
    required: true,
    width: 8,
    maxLength: 100,
  },
  {
    name: 'contacto',
    label: 'Persona de Contacto',
    maxLength: 100,
  },
  {
    name: 'telefono',
    label: 'Teléfono',
    width: 6,
    maxLength: 50,
    pattern: '^[+]?[0-9\\s]*$',
    patternMessage: 'El teléfono solo permite números, espacios y el prefijo +',
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    width: 6,
    maxLength: 255,
  },
  {
    name: 'direccion',
    label: 'Dirección',
  },
];

const QuickProveedorModal: React.FC<QuickProveedorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

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
      toast.success(`Proveedor "${newProveedor.nombre}" creado correctamente.`);
      onSuccess(newProveedor);
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al crear el proveedor.';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DynamicFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Nuevo Proveedor"
      size="md"
      fields={proveedorSchema}
      initialData={{}}
      onSubmit={handleSave}
      isSubmitting={isSaving}
      requireConfirmation={false}
    />
  );
};

export default QuickProveedorModal;
