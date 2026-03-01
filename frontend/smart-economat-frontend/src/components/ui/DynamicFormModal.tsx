import React, { useState, useEffect } from 'react';
import { Box, Stack } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import Modal, { ModalProps } from './Modal';
import Input from './Input';
import Button from './Button';
import Checkbox from './Checkbox';
import Select, { SelectOption } from './Select';
import AllergenSelector from './AllergenSelector';
import ConfirmDialog from './ConfirmDialog';
import ProveedorSelector, { ProveedorAsociado } from './ProveedorSelector';
import DatePicker from './DatePicker';
import PedidoLineasSelector from './PedidoLineasSelector';
import RecetaIngredientesSelector from './RecetaIngredientesSelector';

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'boolean'
  | 'select'
  | 'date'
  | 'image'
  | 'allergens'
  | 'proveedores'
  | 'orderLines'
  | 'recipeIngredients';

export interface DynamicField {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  options?: SelectOption[];
  defaultValue?: any;
  disabled?: boolean;
  position?: 'left' | 'right' | 'bottom';
  multiple?: boolean;
  /** Opcional: Define el ancho del campo en una cuadrícula de 1-12 (Por defecto 12). Se aplica a partir del breakpoint 'sm'. */
  width?: number;
  getFallbackIcon?: (formData: Record<string, any>) => React.ReactNode;
}

export interface DynamicFormModalProps extends Omit<ModalProps, 'children'> {
  fields?: DynamicField[];
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  requireConfirmation?: boolean;
  confirmationMessage?: React.ReactNode;
}

const DynamicFormModal: React.FC<DynamicFormModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  fields = [],
  initialData = {},
  onSubmit,
  onCancel,
  submitLabel = 'Aceptar',
  cancelLabel = 'Cancelar',
  isSubmitting = false,
  requireConfirmation = false,
  confirmationMessage,
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const dataToSet = { ...initialData };
      fields.forEach((field) => {
        if (dataToSet[field.name] === undefined) {
          dataToSet[field.name] =
            field.defaultValue !== undefined
              ? field.defaultValue
              : field.type === 'boolean'
                ? false
                : '';
        }
      });
      setFormData(dataToSet);
    }
  }, [isOpen, initialData, fields]);

  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleNumberChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? '' : Number(value),
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleDateChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleAllergensChange = (name: string) => (newValue: string[]) => {
    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleImageChange =
    (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setFormData((prev) => ({ ...prev, [name]: file }));
        setErrors((prev) => ({ ...prev, [name]: '' }));
      }
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation for required fields
    const newErrors: Record<string, string> = {};
    fields.forEach((field) => {
      if (field.required) {
        const val = formData[field.name];
        const isEmpty =
          val === undefined ||
          val === null ||
          val === '' ||
          (Array.isArray(val) && val.length === 0);
        if (isEmpty) {
          newErrors[field.name] = 'Este campo es obligatorio';
        }
      }
      // Specific validation: proveedorId must be UUID v4
      if (field.name === 'proveedorId' && formData[field.name]) {
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(String(formData[field.name]))) {
          newErrors[field.name] = 'El ID del proveedor debe ser un UUID válido';
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (requireConfirmation) {
      setIsConfirmOpen(true);
    } else {
      await onSubmit(formData);
    }
  };

  const handleConfirmSubmit = async () => {
    setIsConfirmOpen(false);
    await onSubmit(formData);
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onClose();
  };

  const formFields =
    fields.length > 0
      ? fields
      : Object.keys(initialData).map((key) => {
        const val = initialData[key];
        const typeOfVal = typeof val;
        let type: FieldType = 'text';

        if (typeOfVal === 'number') type = 'number';
        if (typeOfVal === 'boolean') type = 'boolean';
        if (
          typeOfVal === 'string' &&
          !isNaN(Date.parse(val)) &&
          val.includes('-')
        )
          type = 'date';

        if (Array.isArray(val)) type = 'allergens';

        return {
          name: key,
          label: key.charAt(0).toUpperCase() + key.slice(1),
          type,
        } as DynamicField;
      });

  const imageFields = formFields.filter((f) => f.type === 'image');
  const mainImageField = imageFields[0];
  const nonImageFields = formFields.filter((f) => f.type !== 'image');

  const leftFields = nonImageFields.filter((f) => f.position === 'left');
  const bottomFields = nonImageFields.filter((f) => f.position === 'bottom');
  const rightFields = nonImageFields.filter(
    (f) => f.position !== 'left' && f.position !== 'bottom'
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={title}
      size={size || 'md'}
    >
      <form onSubmit={handleSubmit}>
        <Box
          display="flex"
          flexDirection={{ xs: 'column', md: 'row' }}
          gap={3}
          sx={{ mt: 1 }}
        >
          {/* Left Column for Image */}
          {mainImageField && (
            <Box
              width={{ xs: '100%', md: '30%' }}
              display="flex"
              flexDirection="column"
              alignItems="center"
            >
              {(() => {
                const { name, label, disabled, getFallbackIcon } =
                  mainImageField;
                const value = formData[name];
                const previewUrl =
                  value instanceof File
                    ? URL.createObjectURL(value)
                    : typeof value === 'string'
                      ? value
                      : null;
                const Fallback = getFallbackIcon ? (
                  getFallbackIcon(formData)
                ) : (
                  <PhotoCameraIcon
                    sx={{ fontSize: 60, color: 'text.secondary' }}
                  />
                );

                return (
                  <Box
                    key={name}
                    sx={{
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: '100%',
                        aspectRatio: '1',
                        border: '1px dashed grey',
                        borderRadius: 1,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden',
                        mb: 1,
                        bgcolor: 'background.default',
                      }}
                    >
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        Fallback
                      )}
                    </Box>
                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth={true}
                      disabled={disabled}
                      startIcon={<CloudUploadOutlinedIcon />}
                      size="small"
                      sx={{ mt: 0, py: 1 }}
                    >
                      {label || 'Cargar Imagen'}
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleImageChange(name)}
                      />
                    </Button>
                  </Box>
                );
              })()}

              {/* Additional Left Column Fields (e.g. Allergens) */}
              {leftFields.length > 0 && (
                <Stack spacing={1.5} sx={{ mt: 2, width: '100%' }}>
                  {leftFields.map((field) => {
                    const { name, type = 'text', disabled } = field;
                    const value = formData[name];
                    if (type === 'allergens') {
                      return (
                        <AllergenSelector
                          key={name}
                          value={Array.isArray(value) ? value : []}
                          onChange={handleAllergensChange(name)}
                          disabled={disabled}
                        />
                      );
                    }
                    return null;
                  })}
                </Stack>
              )}
            </Box>
          )}

          {/* Right Column for Fields */}
          <Box flex={1} width="100%">
            <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={1.5}>
              {rightFields.map((field) => {
                const {
                  name,
                  label,
                  type = 'text',
                  required,
                  options,
                  disabled,
                  multiple,
                  width = 12,
                } = field;
                const value = formData[name];

                const renderField = () => {
                  switch (type) {
                    case 'boolean':
                      return (
                        <Checkbox
                          key={name}
                          name={name}
                          label={label}
                          checked={Boolean(value)}
                          onChange={handleCheckboxChange}
                          disabled={disabled}
                        />
                      );

                    case 'select':
                      return (
                        <Select
                          key={name}
                          name={name}
                          label={label}
                          value={value ?? (multiple ? [] : '')}
                          onChange={(e) => handleTextChange(e as any)}
                          options={options || []}
                          required={required}
                          disabled={disabled}
                          multiple={multiple}
                          error={Boolean(errors[name])}
                          helperText={errors[name]}
                        />
                      );

                    case 'number':
                      return (
                        <Input
                          key={name}
                          name={name}
                          label={label}
                          type="number"
                          value={value ?? ''}
                          onChange={handleNumberChange}
                          required={required}
                          disabled={disabled}
                        />
                      );

                    case 'date':
                      return (
                        <DatePicker
                          key={name}
                          name={name}
                          label={label}
                          value={value || ''}
                          onChange={handleDateChange}
                          required={required}
                          disabled={disabled}
                        />
                      );

                    case 'allergens':
                      return (
                        <AllergenSelector
                          key={name}
                          value={Array.isArray(value) ? value : []}
                          onChange={handleAllergensChange(name)}
                          disabled={disabled}
                        />
                      );

                    case 'textarea':
                      return (
                        <Input
                          key={name}
                          name={name}
                          label={label}
                          type="text"
                          value={value ?? ''}
                          onChange={handleTextChange}
                          required={required}
                          disabled={disabled}
                          multiline
                          rows={4}
                        />
                      );

                    case 'text':
                    default:
                      return (
                        <Input
                          key={name}
                          name={name}
                          label={label}
                          type="text"
                          value={value ?? ''}
                          onChange={handleTextChange}
                          required={required}
                          disabled={disabled}
                        />
                      );
                  }
                };

                return (
                  <Box key={name} sx={{ gridColumn: { xs: `span ${width}` } }}>
                    {renderField()}
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>

        {/* Bottom Row Fields */}
        {bottomFields.length > 0 && (
          <Box sx={{ mt: 2, width: '100%' }}>
            <Stack spacing={1.5}>
              {bottomFields.map((field) => {
                const { name, type = 'text', disabled } = field;
                const value = formData[name];
                if (type === 'allergens') {
                  return (
                    <AllergenSelector
                      key={name}
                      value={Array.isArray(value) ? value : []}
                      onChange={handleAllergensChange(name)}
                      disabled={disabled}
                    />
                  );
                }
                if (type === 'proveedores') {
                  return (
                    <ProveedorSelector
                      key={name}
                      value={Array.isArray(value) ? value : []}
                      onChange={(val: ProveedorAsociado[]) =>
                        setFormData((prev) => ({ ...prev, [name]: val }))
                      }
                      proveedores={
                        field.options?.map((o) => ({
                          id: o.value as string,
                          nombre: o.label,
                          email: '',
                          nifNie: '',
                        })) || []
                      }
                      disabled={disabled}
                    />
                  );
                }
                if (type === 'orderLines') {
                  return (
                    <PedidoLineasSelector
                      key={name}
                      value={Array.isArray(value) ? value : []}
                      onChange={(val) =>
                        setFormData((prev) => ({ ...prev, [name]: val }))
                      }
                      proveedorId={
                        formData.proveedorId || formData.proveedor?.id
                      }
                    />
                  );
                }
                if (type === 'recipeIngredients') {
                  return (
                    <RecetaIngredientesSelector
                      key={name}
                      value={Array.isArray(value) ? value : []}
                      onChange={(val) =>
                        setFormData((prev) => ({ ...prev, [name]: val }))
                      }
                    />
                  );
                }
                return null;
              })}
            </Stack>
          </Box>
        )}

        <Box
          sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}
        >
          <Button
            onClick={handleCancel}
            variant="outlined"
            sx={{ mt: 0, mb: 0 }}
          >
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            variant="contained"
            sx={{ mt: 0, mb: 0 }}
          >
            {submitLabel}
          </Button>
        </Box>
      </form>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        title="Confirmar acción"
        message={
          confirmationMessage ||
          '¿Estás seguro de que deseas guardar estos datos?'
        }
        confirmText="Guardar"
        cancelText="Cerrar"
        confirmColor="primary"
      />
    </Modal>
  );
};

export default DynamicFormModal;
