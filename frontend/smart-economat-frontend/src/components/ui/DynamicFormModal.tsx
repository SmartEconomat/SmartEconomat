import React, { useState, useEffect } from 'react';
import { Box, Stack } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import Modal, { ModalProps, ModalSize } from './Modal';
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
import BatchPedidoLineasViewer from './BatchPedidoLineasViewer';
import BarcodeScanner from './BarcodeScanner';
import BarcodeIcon from './BarcodeIcon';
import { InputAdornment, IconButton, Tooltip } from '@mui/material';
import { resolveStoredFileUrl } from '../../services/api.service';
import { parseLocalizedNumber } from '../../utils/numberUtils';

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
  | 'recipeIngredients'
  | 'batchViewer'
  | 'barcode';

export interface DynamicField {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  options?: SelectOption[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValue?: any;
  disabled?: boolean;
  position?: 'left' | 'right' | 'bottom';
  multiple?: boolean;
  /** Opcional: Define el ancho del campo en una cuadrícula de 1-12 (Por defecto 12). Se aplica a partir del breakpoint 'sm'. */
  width?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getFallbackIcon?: (formData: Record<string, any>) => React.ReactNode;
}

export interface DynamicFormModalProps extends Omit<ModalProps, 'children'> {
  fields?: DynamicField[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  size?: ModalSize;
  requireConfirmation?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onBarcodeFetch?: (code: string) => Promise<Record<string, any> | void>;
  confirmationMessage?: React.ReactNode;
  onValuesChange?: (data: Record<string, unknown>) => void;
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
  onBarcodeFetch,
  confirmationMessage,
  onValuesChange,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [activeBarcodeField, setActiveBarcodeField] = useState<string | null>(
    null
  );

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
      if (onValuesChange) onValuesChange(dataToSet);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialData, fields]);

  useEffect(() => {
    if (isOpen && onValuesChange) {
      onValuesChange(formData);
    }
  }, [formData, isOpen, onValuesChange]);

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
    const parsedValue = parseLocalizedNumber(value);

    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? '' : (parsedValue ?? value),
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

  const bottomFields = nonImageFields.filter((f) => f.position === 'bottom');
  const rightFields = nonImageFields.filter(
    (f) => f.position !== 'left' && f.position !== 'bottom'
  );

  const renderFieldContent = (field: DynamicField) => {
    const {
      name,
      label,
      type = 'text',
      required,
      options,
      disabled,
      multiple,
    } = field;
    const value = formData[name];

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
            onChange={(e) =>
              handleTextChange(
                e as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
              )
            }
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
            inputProps={{ step: 'any', inputMode: 'decimal' }}
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

      case 'proveedores':
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

      case 'orderLines':
        return (
          <PedidoLineasSelector
            key={name}
            value={Array.isArray(value) ? value : []}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, [name]: val }))
            }
            proveedorId={formData.proveedorId || formData.proveedor?.id}
            disabled={disabled}
          />
        );

      case 'recipeIngredients':
        return (
          <RecetaIngredientesSelector
            key={name}
            value={Array.isArray(value) ? value : []}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, [name]: val }))
            }
          />
        );

      case 'batchViewer':
        return <BatchPedidoLineasViewer key={name} batch={formData[name]} />;

      case 'barcode':
        return (
          <Box key={name}>
            <Input
              name={name}
              label={label}
              type="text"
              value={value ?? ''}
              onChange={handleTextChange}
              onBlur={async (e) => {
                const code = (e.target as HTMLInputElement).value;
                if (code && onBarcodeFetch && code !== initialData?.[name]) {
                  const newData = await onBarcodeFetch(code);
                  if (newData) {
                    setFormData((prev) => ({ ...prev, ...newData }));
                  }
                }
              }}
              required={required}
              disabled={disabled}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Escanear con cámara">
                      <IconButton
                        edge="end"
                        onClick={() => setActiveBarcodeField(name)}
                        disabled={disabled}
                      >
                        <BarcodeIcon />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />
            <BarcodeScanner
              open={activeBarcodeField === name}
              onClose={() => setActiveBarcodeField(null)}
              onScan={async (code) => {
                setFormData((prev) => ({ ...prev, [name]: code }));
                setErrors((prev) => ({ ...prev, [name]: '' }));
                setActiveBarcodeField(null);
                if (onBarcodeFetch) {
                  const newData = await onBarcodeFetch(code);
                  if (newData) {
                    setFormData((prev) => ({ ...prev, ...newData }));
                  }
                }
              }}
              title={`Escanear ${label}`}
            />
          </Box>
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
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={title}
      size={size || 'md'}
    >
      <form onSubmit={handleSubmit}>
        {/* Image at the top - full width */}
        {mainImageField && (
          <Box sx={{ width: '100%', mb: 3 }}>
            {(() => {
              const { name, label, disabled, getFallbackIcon } = mainImageField;
              const value = formData[name];
              const previewUrl =
                value instanceof File
                  ? URL.createObjectURL(value)
                  : typeof value === 'string'
                    ? resolveStoredFileUrl(value)
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
                      maxWidth: 280,
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
          </Box>
        )}

        {/* Main Fields Grid */}
        <Box
          display="grid"
          gridTemplateColumns="repeat(12, 1fr)"
          gap={1.5}
          sx={{ mt: 1 }}
        >
          {rightFields.map((field) => {
            const { name, width = 12 } = field;

            return (
              <Box key={name} sx={{ gridColumn: { xs: `span ${width}` } }}>
                {renderFieldContent(field)}
              </Box>
            );
          })}
        </Box>

        {/* Bottom Row Fields */}
        {bottomFields.length > 0 && (
          <Box sx={{ mt: 2, width: '100%' }}>
            <Stack spacing={1.5}>
              {bottomFields.map((field) => (
                <Box key={field.name}>{renderFieldContent(field)}</Box>
              ))}
            </Stack>
          </Box>
        )}

        <Box
          sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}
        >
          {Boolean(cancelLabel) && (
            <Button
              onClick={handleCancel}
              variant="outlined"
              fullWidth={false}
              sx={{ mt: 0, mb: 0 }}
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            type="submit"
            isLoading={isSubmitting}
            variant="contained"
            fullWidth={false}
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
