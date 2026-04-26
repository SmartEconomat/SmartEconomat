import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { Box, Stack, Grid } from '@mui/material';
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
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AutoFixHighOutlinedIcon from '@mui/icons-material/AutoFixHighOutlined';
import { resolveStoredFileUrl } from '../../services/api.service';
import { parseLocalizedNumber } from '../../utils/numberUtils';
import { PedidoUsuario, PurchaseBatch } from '../../services/pedido.types';
import { useTranslation } from 'react-i18next';

const createStableSnapshot = (value: unknown): string => {
  const normalize = (input: unknown): unknown => {
    if (input instanceof File) {
      return {
        __type: 'File',
        name: input.name,
        size: input.size,
        type: input.type,
        lastModified: input.lastModified,
      };
    }

    if (Array.isArray(input)) {
      return input.map((item) => normalize(item));
    }

    if (input && typeof input === 'object') {
      return Object.entries(input as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .reduce<Record<string, unknown>>((acc, [key, nested]) => {
          acc[key] = normalize(nested);
          return acc;
        }, {});
    }

    return input;
  };

  return JSON.stringify(normalize(value));
};

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
  | 'email'
  | 'orderLines'
  | 'recipeIngredients'
  | 'batchViewer'
  | 'barcode';

export type FormDataRecord = Record<string, unknown>;

export interface DynamicField {
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  options?: SelectOption[];
  defaultValue?: unknown;
  disabled?: boolean;
  position?: 'left' | 'right' | 'bottom';
  multiple?: boolean;
  width?: number;
  getFallbackIcon?: (formData: FormDataRecord) => React.ReactNode;
  pattern?: string;
  patternMessage?: string;
  maxLength?: number;
  minLength?: number;
}

export interface DynamicFormModalProps extends Omit<ModalProps, 'children'> {
  fields?: DynamicField[];
  initialData?: FormDataRecord;
  onSubmit: (data: FormDataRecord) => void | Promise<void>;
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
  submitLabel,
  cancelLabel,
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
  const resolvedSubmitLabel = submitLabel ?? t('comun.aceptar');
  const resolvedCancelLabel = cancelLabel ?? t('comun.cancelar');
  const [formData, setFormData] = useState<FormDataRecord>({});
  const formDataRef = useRef<FormDataRecord>({});
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
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const pendingCloseReasonRef = useRef<ModalCloseReason | undefined>(undefined);
  const initialSnapshotRef = useRef<string>('');

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
    (updater: FormDataRecord | ((prev: FormDataRecord) => FormDataRecord)) => {
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
      initialSnapshotRef.current = createStableSnapshot(dataToSet);
      setShowOFFResults(false);
      setOffResults([]);
      if (onValuesChange) onValuesChange(dataToSet);
    }
  }, [isOpen, initialData, fields, onValuesChange]);

  useEffect(() => {
    if (isOpen && valueUpdates && Object.keys(valueUpdates).length > 0) {
      updateFormData((prev) => {
        const next: FormDataRecord = { ...prev };
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

  const isDirty = useMemo(() => {
    if (!isOpen) return false;
    return createStableSnapshot(formData) !== initialSnapshotRef.current;
  }, [formData, isOpen]);

  useEffect(() => {
    if (!isOpen || !isDirty) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isOpen, isDirty]);

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

    // Bloquear números negativos en tiempo real
    if (value.startsWith('-')) return;

    const parsedValue = parseLocalizedNumber(value);
    if (parsedValue !== null && parsedValue < 0) return;

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

  const validateField = (
    field: DynamicField,
    value: unknown
  ): string | null => {
    const { required, label, pattern, patternMessage, maxLength, minLength } =
      field;

    const stringValue = value != null ? String(value).trim() : '';

    if (required && !stringValue) {
      return t('forms.validation.required', { label });
    }

    if (stringValue) {
      if (maxLength && stringValue.length > maxLength) {
        return t('forms.validation.maxLength', { label, max: maxLength });
      }
      if (minLength && stringValue.length < minLength) {
        return t('forms.validation.minLength', { label, min: minLength });
      }
      if (pattern) {
        try {
          const regex = new RegExp(pattern);
          if (!regex.test(stringValue)) {
            return patternMessage || t('forms.validation.invalidFormat', { label });
          }
        } catch {
          console.error(`Invalid regex for field ${field.name}:`, pattern);
        }
      }
      if (field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(stringValue)) {
          return t('forms.validation.invalidEmail');
        }
      }
    }

    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    fields.forEach((field) => {
      const error = validateField(field, formData[field.name]);
      if (error) {
        newErrors[field.name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
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

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validateForm()) {
      return;
    }

    if (requireConfirmation) {
      setIsConfirmOpen(true);
    } else {
      onSubmit(formData);
    }
  };

  const handleConfirmSubmit = async () => {
    setIsConfirmOpen(false);
    await onSubmit(formDataRef.current);
  };

  const handleSecondarySubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (onSecondarySubmit) {
      await onSecondarySubmit(formDataRef.current);
    }
  };

  const closeWithoutPrompt = (reason?: ModalCloseReason) => {
    if (onCancel) {
      onCancel();
      return;
    }

    onClose(reason);
  };

  const requestClose = (reason?: ModalCloseReason) => {
    if (isSubmitting) {
      return;
    }

    if (isDirty) {
      pendingCloseReasonRef.current = reason;
      setIsDiscardConfirmOpen(true);
      return;
    }

    closeWithoutPrompt(reason);
  };

  const handleCancel = () => {
    requestClose('cancelAction');
  };

  const handleConfirmDiscard = () => {
    setIsDiscardConfirmOpen(false);
    const reason = pendingCloseReasonRef.current;
    pendingCloseReasonRef.current = undefined;
    closeWithoutPrompt(reason);
  };

  const handleModalClose = (reason?: ModalCloseReason) => {
    requestClose(reason);
  };

  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (name: string) => (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      updateFormData((prev) => ({ ...prev, [name]: file }));
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
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
            typeof val === 'string' &&
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
  const imageFieldValue =
    imageFieldName !== undefined ? formData[imageFieldName] : undefined;
  const imageRawValue = useMemo(() => imageFieldValue, [imageFieldValue]);
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
      maxLength,
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
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
            inputProps={{ step: 'any', inputMode: 'decimal', min: 0 }}
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
            rows={3}
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
            inputProps={maxLength ? { maxLength } : undefined}
            error={Boolean(errors[name])}
            helperText={errors[name]}
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
            masterMarca={formData.marca as string | undefined}
            masterBarcode={formData.codigoBarras as string | undefined}
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
              error={Boolean(errors[name])}
              helperText={errors[name]}
              inputProps={maxLength ? { maxLength } : undefined}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
                input: {
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
                },
              }}
            />
            {showOFFResults && offResults.length > 0 && (
              <Paper
                elevation={8}
                sx={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  right: 0,
                  zIndex: 1300,
                  maxHeight: 280,
                  overflowY: 'auto',
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1.5,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    bgcolor: 'divider',
                    borderRadius: '3px',
                  },
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
                      sx={{
                        py: 1,
                        '&:hover': {
                          bgcolor:
                            'rgba(var(--mui-palette-primary-mainChannel), 0.04)',
                        },
                      }}
                    >
                      <ListItemText
                        primary={
                          (result['nombre'] as string) ||
                          (result['name'] as string) ||
                          t('forms.productFallback', { index: idx + 1 })
                        }
                        secondary={
                          (result['marca'] as string) ||
                          (result['brand'] as string) ||
                          undefined
                        }
                        primaryTypographyProps={{ fontWeight: 500 }}
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
              title={t('forms.scanField', { label })}
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
            type={field.type === 'email' ? 'email' : 'text'}
            value={value ?? ''}
            onChange={handleTextChange}
            required={required}
            disabled={disabled}
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
            inputProps={maxLength ? { maxLength } : undefined}
            error={Boolean(errors[name])}
            helperText={errors[name]}
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
        <Grid
          container
          spacing={3}
          sx={{ mt: 0, alignItems: { md: 'center' } }}
        >
          {/* Image Sidebar Layout - Left on MD+ */}
          {mainImageField && (
            <Grid
              size={{ xs: 12, md: 3, lg: 3 }}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                pt: { xs: 0, sm: 0 }, // Alineación superior pura
              }}
            >
              {(() => {
                const { name, disabled, getFallbackIcon } = mainImageField;
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
                  <Box sx={{ width: '100%', mt: 0, mb: 0 }} key={name}>
                    <Box
                      component="label"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop(name)}
                      sx={{
                        width: '100%',
                        height: { md: 190 },
                        border: '2px dashed',
                        borderColor: isDragOver ? 'primary.main' : 'divider',
                        borderRadius: 2,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        overflow: 'hidden',
                        position: 'relative',
                        cursor: disabled ? 'default' : 'pointer',
                        bgcolor: isDragOver
                          ? 'rgba(216, 27, 96, 0.05)'
                          : 'background.default',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: disabled ? 'divider' : 'primary.main',
                          '& .upload-overlay': {
                            opacity: 1,
                          },
                        },
                      }}
                    >
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        disabled={disabled}
                        onChange={handleImageChange(name)}
                      />
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt={t('forms.image.previewAlt')}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <Stack alignItems="center" spacing={1} sx={{ p: 2 }}>
                          {Fallback}
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            textAlign="center"
                          >
                            {t('forms.image.clickOrDrag')}
                          </Typography>
                        </Stack>
                      )}

                      {/* Hover Overlay */}
                      {!disabled && (
                        <Box
                          className="upload-overlay"
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            bgcolor: 'rgba(0, 0, 0, 0.4)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            opacity: 0,
                            transition: 'opacity 0.2s ease',
                            pointerEvents: 'none',
                          }}
                        >
                          <CloudUploadOutlinedIcon
                            sx={{ fontSize: 40, mb: 1 }}
                          />
                          <Typography variant="button">
                            {previewUrl
                              ? t('forms.image.changeImage')
                              : t('forms.image.uploadImage')}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                );
              })()}
            </Grid>
          )}

          {/* Right Side - Grid for Fields */}
          <Grid size={mainImageField ? { xs: 12, md: 9, lg: 9 } : { xs: 12 }}>
            <Box
              display="grid"
              gridTemplateColumns="repeat(12, 1fr)"
              gap={2} // Restaurado el espaciado original
            >
              {rightFields.map((field) => {
                const { name, width = 12 } = field;

                return (
                  <Box
                    key={name}
                    sx={{ gridColumn: { xs: 'span 12', sm: `span ${width}` } }}
                  >
                    {renderFieldContent(field)}
                  </Box>
                );
              })}
            </Box>
          </Grid>
        </Grid>

        {/* Bottom Row Fields */}
        {bottomFields.length > 0 && (
          <Box
            sx={{
              mt: 2,
              width: '100%',
              display: 'grid',
              gridTemplateColumns: 'repeat(12, 1fr)',
              gap: 2,
            }}
          >
            {bottomFields.map((field) => {
              const { name, width = 12 } = field;
              return (
                <Box
                  key={name}
                  sx={{ gridColumn: { xs: 'span 12', sm: `span ${width}` } }}
                >
                  {renderFieldContent(field)}
                </Box>
              );
            })}
          </Box>
        )}

        <Box
          sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}
        >
          {Boolean(resolvedCancelLabel) && (
            <Button
              onClick={handleCancel}
              variant="outlined"
              fullWidth={false}
              sx={{ mt: 0, mb: 0 }}
            >
              {resolvedCancelLabel}
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
            {resolvedSubmitLabel}
          </Button>
        </Box>
      </form>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        title={t('comun.confirmarAccion')}
        message={
          confirmationMessage || t('comun.confirmarGuardar')
        }
        confirmText={t('comun.guardar')}
        cancelText={t('comun.cerrar')}
        confirmColor="primary"
      />
      <ConfirmDialog
        isOpen={isDiscardConfirmOpen}
        onClose={() => {
          pendingCloseReasonRef.current = undefined;
          setIsDiscardConfirmOpen(false);
        }}
        onConfirm={handleConfirmDiscard}
        title={t('forms.discard.title')}
        message={t('forms.discard.message')}
        confirmText={t('forms.discard.confirm')}
        cancelText={t('forms.discard.cancel')}
        confirmColor="warning"
      />
    </Modal>
  );
};

export default DynamicFormModal;
