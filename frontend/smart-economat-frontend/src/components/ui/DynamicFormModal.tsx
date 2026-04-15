import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Stack } from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import Modal, { ModalCloseReason, ModalProps, ModalSize } from './Modal';
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
import {
  InputAdornment,
  IconButton,
  Tooltip,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AutoFixHighOutlinedIcon from '@mui/icons-material/AutoFixHighOutlined';
import { resolveStoredFileUrl } from '../../services/api.service';
import { parseLocalizedNumber } from '../../utils/numberUtils';
import { PedidoUsuario, PurchaseBatch } from '../../services/pedido.types';

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
  onBarcodeFetch?: (code: string) => Promise<Record<string, unknown> | void>;
  onBarcodeGenerate?: () => Promise<string | void>;
  onOFFSearch?: (value: string) => Promise<Array<Record<string, unknown>>>;
  confirmationMessage?: React.ReactNode;
  onValuesChange?: (data: Record<string, unknown>) => void;
  valueUpdates?: Record<string, unknown>;
  secondarySubmitLabel?: string;
  onSecondarySubmit?: (data: Record<string, unknown>) => void | Promise<void>;
  secondarySubmitColor?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'info'
    | 'error'
    | 'inherit';
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
  onBarcodeGenerate,
  onOFFSearch,
  confirmationMessage,
  onValuesChange,
  valueUpdates,
  secondarySubmitLabel,
  onSecondarySubmit,
  secondarySubmitColor = 'success',
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const formDataRef = useRef<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [activeBarcodeField, setActiveBarcodeField] = useState<string | null>(
    null
  );
  const [offResults, setOffResults] = useState<Array<Record<string, unknown>>>(
    []
  );
  const [showOFFResults, setShowOFFResults] = useState(false);
  const [isOFFSearching, setIsOFFSearching] = useState(false);
  const [generatingBarcodeField, setGeneratingBarcodeField] = useState<
    string | null
  >(null);

  const selectedProveedorId =
    typeof formData.proveedorId === 'string'
      ? formData.proveedorId
      : typeof formData.proveedor === 'object' &&
          formData.proveedor !== null &&
          'id' in formData.proveedor &&
          typeof formData.proveedor.id === 'string'
        ? formData.proveedor.id
        : undefined;

  const updateFormData = useCallback(
    (
      updater:
        | Record<string, unknown>
        | ((prev: Record<string, unknown>) => Record<string, unknown>)
    ) => {
      setFormData((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        formDataRef.current = next;
        return next;
      });
    },
    []
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
      formDataRef.current = dataToSet;
      setFormData(dataToSet);
      setShowOFFResults(false);
      setOffResults([]);
      if (onValuesChange) onValuesChange(dataToSet);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialData, fields]);

  // Handle external value updates (e.g., from real-time calculations)
  useEffect(() => {
    if (isOpen && valueUpdates && Object.keys(valueUpdates).length > 0) {
      updateFormData((prev) => {
        const next = { ...prev };
        let changed = false;
        Object.keys(valueUpdates).forEach((key) => {
          if (next[key] !== valueUpdates[key]) {
            next[key] = valueUpdates[key];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
  }, [isOpen, valueUpdates, updateFormData]);

  useEffect(() => {
    if (isOpen && onValuesChange) {
      onValuesChange(formData);
    }
  }, [formData, isOpen, onValuesChange]);

  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    updateFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleNumberChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const parsedValue = parseLocalizedNumber(value);

    updateFormData((prev) => ({
      ...prev,
      [name]: value === '' ? '' : (parsedValue ?? value),
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    updateFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleDateChange = (name: string, value: string) => {
    updateFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleAllergensChange = (name: string) => (newValue: string[]) => {
    updateFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleBarcodeGenerate = useCallback(
    async (fieldName: string) => {
      if (!onBarcodeGenerate || generatingBarcodeField) {
        return;
      }

      setGeneratingBarcodeField(fieldName);

      try {
        const code = await onBarcodeGenerate();

        if (!code) {
          return;
        }

        updateFormData((prev) => ({
          ...prev,
          [fieldName]: code,
        }));
        setErrors((prev) => ({ ...prev, [fieldName]: '' }));
        setShowOFFResults(false);
        setOffResults([]);
      } finally {
        setGeneratingBarcodeField(null);
      }
    },
    [generatingBarcodeField, onBarcodeGenerate, updateFormData]
  );

  const handleImageChange =
    (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        updateFormData((prev) => ({ ...prev, [name]: file }));
        setErrors((prev) => ({ ...prev, [name]: '' }));
      }
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation for required fields
    const newErrors: Record<string, string> = {};
    fields.forEach((field) => {
      if (field.required) {
        const val = formDataRef.current[field.name];
        const isEmpty =
          val === undefined ||
          val === null ||
          val === '' ||
          (Array.isArray(val) && val.length === 0);
        if (isEmpty) {
          newErrors[field.name] = t('comun.campoObligatorio');
        }
      }
      // Specific validation: proveedorId must be UUID v4
      if (field.name === 'proveedorId' && formDataRef.current[field.name]) {
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(String(formDataRef.current[field.name]))) {
          newErrors[field.name] = t('comun.uuidInvalido');
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
      await onSubmit(formDataRef.current);
    }
  };

  const handleSecondarySubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (onSecondarySubmit) {
      await onSecondarySubmit(formDataRef.current);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
      return;
    }

    onClose('backdropClick');
  };

  const handleModalClose = (reason?: ModalCloseReason) => {
    onClose(reason);
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

  const imageFieldName = mainImageField?.name;
  const imageRawValue = useMemo(
    () => (imageFieldName !== undefined ? formData[imageFieldName] : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      imageFieldName,
      imageFieldName !== undefined ? formData[imageFieldName] : undefined,
    ]
  );
  const [imageBlobUrl, setImageBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!(imageRawValue instanceof File)) {
      setImageBlobUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageRawValue);
    setImageBlobUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageRawValue]);

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
            value={typeof value === 'string' ? value : ''}
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
              updateFormData((prev) => ({ ...prev, [name]: val }))
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
              updateFormData((prev) => ({ ...prev, [name]: val }))
            }
            proveedorId={selectedProveedorId}
            disabled={disabled}
          />
        );

      case 'recipeIngredients':
        return (
          <RecetaIngredientesSelector
            key={name}
            value={Array.isArray(value) ? value : []}
            onChange={(val) =>
              updateFormData((prev) => ({ ...prev, [name]: val }))
            }
          />
        );

      case 'batchViewer':
        return (
          <BatchPedidoLineasViewer
            key={name}
            batch={formData[name] as PurchaseBatch | PedidoUsuario}
          />
        );

      case 'barcode':
        return (
          <Box key={name} sx={{ position: 'relative' }}>
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
                startAdornment: (
                  <InputAdornment position="start">
                    <Tooltip title={t('comun.escanearCamara')}>
                      <IconButton
                        size="small"
                        onClick={() => setActiveBarcodeField(name)}
                        disabled={disabled}
                        color="primary"
                        sx={{
                          '&:hover': {
                            bgcolor: 'rgba(216, 27, 96, 0.1)',
                            borderRadius: 1,
                          },
                          p: 0.5,
                          ml: -0.5,
                        }}
                      >
                        <BarcodeIcon />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
                endAdornment: (onBarcodeGenerate || onOFFSearch) && (
                  <InputAdornment position="end">
                    <Stack direction="row" spacing={0.5}>
                      {onBarcodeGenerate && (
                        <Tooltip title={t('comun.generarEan13')}>
                          <span>
                            <IconButton
                              size="small"
                              disabled={
                                disabled || Boolean(generatingBarcodeField)
                              }
                              onClick={() => {
                                void handleBarcodeGenerate(name);
                              }}
                              sx={{
                                bgcolor: 'success.main',
                                color: 'common.white',
                                '&:hover': {
                                  bgcolor: 'success.dark',
                                },
                                borderRadius: 1,
                                p: 0.5,
                              }}
                            >
                              {generatingBarcodeField === name ? (
                                <CircularProgress size={20} color="inherit" />
                              ) : (
                                <AutoFixHighOutlinedIcon fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                      {onOFFSearch && (
                        <Tooltip title={t('comun.buscarOpenFoodFacts')}>
                          <span>
                            <IconButton
                              size="small"
                              disabled={disabled || isOFFSearching || !value}
                              onClick={async () => {
                                if (!value || isOFFSearching) return;
                                setIsOFFSearching(true);
                                setShowOFFResults(false);
                                const results = await onOFFSearch(
                                  String(value)
                                );
                                setIsOFFSearching(false);
                                if (results.length === 1) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    ...results[0],
                                  }));
                                } else if (results.length > 1) {
                                  setOffResults(results);
                                  setShowOFFResults(true);
                                }
                              }}
                              sx={{
                                bgcolor: 'primary.main',
                                color: 'white',
                                '&:hover': {
                                  bgcolor: 'primary.dark',
                                },
                                borderRadius: 1,
                                p: 0.5,
                              }}
                            >
                              {isOFFSearching ? (
                                <CircularProgress size={20} />
                              ) : (
                                <SearchIcon fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </Stack>
                  </InputAdornment>
                ),
              }}
            />
            {showOFFResults && offResults.length > 0 && (
              <Paper
                elevation={8}
                sx={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 1300,
                  maxHeight: 260,
                  overflowY: 'auto',
                }}
              >
                <List dense disablePadding>
                  {offResults.map((result, idx) => (
                    <ListItemButton
                      key={idx}
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, ...result }));
                        setShowOFFResults(false);
                        setOffResults([]);
                      }}
                    >
                      <ListItemText
                        primary={
                          (result['nombre'] as string) ||
                          (result['name'] as string) ||
                          `Producto ${idx + 1}`
                        }
                        secondary={
                          (result['marca'] as string) ||
                          (result['brand'] as string) ||
                          undefined
                        }
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Paper>
            )}
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
      onClose={handleModalClose}
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
                  ? imageBlobUrl
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
                    {label || t('comun.cargarImagen')}
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
          {secondarySubmitLabel && onSecondarySubmit && (
            <Button
              onClick={handleSecondarySubmit}
              isLoading={isSubmitting}
              variant="outlined"
              color={secondarySubmitColor}
              fullWidth={false}
              sx={{ mt: 0, mb: 0 }}
            >
              {secondarySubmitLabel}
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
        onConfirm={async () => {
          setIsConfirmOpen(false);
          await onSubmit(formDataRef.current);
        }}
        title={t('comun.confirmarAccion')}
        message={
          confirmationMessage ||
          t('comun.confirmarGuardar')
        }
        confirmText={t('comun.guardar')}
        cancelText={t('comun.cerrar')}
        confirmColor="primary"
      />
    </Modal>
  );
};

export default DynamicFormModal;
