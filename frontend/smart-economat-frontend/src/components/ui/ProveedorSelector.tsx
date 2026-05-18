import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Autocomplete,
  Paper,
  Stack,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AutoFixHighOutlinedIcon from '@mui/icons-material/AutoFixHighOutlined';
import HistoryIcon from '@mui/icons-material/History';
import { Proveedor } from '../../services/proveedor.types';
import QuickProveedorModal from './QuickProveedorModal';
import { usePermission } from '../../store/auth.hooks';
import { PERMISSIONS } from '../../sherlock-auth/permissions.constants';
import { useTranslation } from 'react-i18next';
import NumericInput from './NumericInput';

/** Contrato de tipos público (ProveedorAsociado). Contexto: smart-economat-frontend (SPA). */
export interface ProveedorAsociado {
  proveedorId: string;
  nombre?: string;
  marca?: string;
  codigoBarras?: string;
  precioUnitario?: number | string;
}

interface ProveedorSelectorProps {
  value: ProveedorAsociado[];
  onChange: (value: ProveedorAsociado[]) => void;
  proveedores: Proveedor[];
  disabled?: boolean;
  onRefreshProveedores?: () => void;
  masterMarca?: string;
  masterBarcode?: string;
}

const ProveedorSelector: React.FC<ProveedorSelectorProps> = ({
  value = [],
  onChange,
  proveedores = [],
  disabled = false,
  onRefreshProveedores,
  masterMarca = '',
  masterBarcode = '',
}) => {
  const { t } = useTranslation();
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const canCreate = usePermission(PERMISSIONS.proveedores.crear);

  const handleAdd = (
    _event: React.SyntheticEvent | null,
    newValue?: Proveedor | null
  ) => {
    if (!newValue) return;
    if (value.find((p) => p.proveedorId === newValue.id)) return;

    onChange([
      ...value,
      {
        proveedorId: newValue.id,
        nombre: newValue.nombre,
        marca: '',
        codigoBarras: '',
        precioUnitario: 0,
      },
    ]);
  };

  const handleRemove = (id: string) => {
    onChange(value.filter((p) => p.proveedorId !== id));
  };

  const handleChangeField = (
    id: string,
    field: keyof ProveedorAsociado,
    val: string | number
  ) => {
    onChange(
      value.map((p) => {
        if (p.proveedorId === id) {
          return { ...p, [field]: val };
        }
        return p;
      })
    );
  };

  const handleQuickSuccess = (newProveedor: Proveedor) => {
    // Añadirlo a la selección actual
    handleAdd(null, newProveedor);
    // Notificar al padre para que refresque la lista de opciones
    if (onRefreshProveedores) {
      onRefreshProveedores();
    }
  };

  const options = proveedores.filter(
    (p) => !value.find((v) => v.proveedorId === p.id)
  );

  return (
    <Box sx={{ width: '100%', mt: 1 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {t('proveedores.condicionesLabel')}
      </Typography>

      <Autocomplete
        options={options}
        getOptionLabel={(option) => option.nombre}
        onChange={handleAdd}
        disabled={disabled}
        value={null}
        renderInput={(params) => (
          <TextField
            {...params}
            label={t('proveedores.acciones.anadir')}
            variant="outlined"
            size="small"
            placeholder={t('proveedores.selectorInline.placeholderBuscar')}
            slotProps={{
              inputLabel: {
                shrink: true,
              },
              input: {
                ...params.InputProps,
                endAdornment: (
                  <React.Fragment>
                    {canCreate && !disabled && (
                      <InputAdornment position="end" sx={{ mr: 1 }}>
                        <Tooltip
                          title={t(
                            'proveedores.selectorInline.tooltipCrearRapido'
                          )}
                        >
                          <IconButton
                            size="small"
                            color="primary"
                            type="button"
                            aria-label={t(
                              'proveedores.selectorInline.tooltipCrearRapido'
                            )}
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setIsQuickCreateOpen(true);
                            }}
                          >
                            <AddCircleOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    )}
                    {params.InputProps.endAdornment}
                  </React.Fragment>
                ),
              },
            }}
          />
        )}
        sx={{ mb: 2 }}
      />

      <Stack spacing={2}>
        {value.map((prov) => (
          <Paper
            key={prov.proveedorId}
            variant="outlined"
            sx={{ p: 2, position: 'relative' }}
          >
            <IconButton
              size="small"
              color="error"
              type="button"
              disabled={disabled}
              onClick={() => handleRemove(prov.proveedorId)}
              sx={{ position: 'absolute', top: 8, right: 8 }}
              aria-label={t('proveedores.eliminarAria', {
                nombre: prov.nombre || '',
              })}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>

            <Typography
              variant="body2"
              fontWeight="bold"
              sx={{ mb: 1.5, pr: 4 }}
            >
              {prov.nombre ||
                proveedores.find((p) => p.id === prov.proveedorId)?.nombre ||
                t('proveedores.nombreDesconocido')}
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label={t('proveedores.campoMarca')}
                size="small"
                value={prov.marca || ''}
                placeholder={
                  masterMarca
                    ? t('proveedores.selectorInline.ejemplo', {
                        valor: masterMarca,
                      })
                    : t('proveedores.selectorInline.marcaPlaceholder')
                }
                onChange={(e) =>
                  handleChangeField(prov.proveedorId, 'marca', e.target.value)
                }
                slotProps={{
                  inputLabel: { shrink: true },
                  input: {
                    endAdornment:
                      !prov.marca && masterMarca ? (
                        <InputAdornment position="end">
                          <Tooltip
                            title={t('proveedores.selectorInline.heredado')}
                          >
                            <AutoFixHighOutlinedIcon
                              data-testid="AutoFixHighOutlinedIcon"
                              fontSize="small"
                              color="primary"
                              sx={{ opacity: 0.6 }}
                            />
                          </Tooltip>
                        </InputAdornment>
                      ) : prov.marca && prov.marca !== masterMarca ? (
                        <InputAdornment position="end">
                          <Tooltip
                            title={t(
                              'proveedores.selectorInline.usarValorProducto'
                            )}
                          >
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleChangeField(prov.proveedorId, 'marca', '')
                              }
                            >
                              <HistoryIcon
                                data-testid="HistoryIcon"
                                fontSize="small"
                              />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ) : null,
                  },
                }}
                disabled={disabled}
                fullWidth
              />
              <TextField
                label={t('proveedores.campoCodigoBarras')}
                size="small"
                value={prov.codigoBarras || ''}
                placeholder={
                  masterBarcode
                    ? t('proveedores.selectorInline.ejemplo', {
                        valor: masterBarcode,
                      })
                    : t('proveedores.selectorInline.codigoPlaceholder')
                }
                onChange={(e) =>
                  handleChangeField(
                    prov.proveedorId,
                    'codigoBarras',
                    e.target.value
                  )
                }
                slotProps={{
                  inputLabel: { shrink: true },
                  input: {
                    endAdornment:
                      !prov.codigoBarras && masterBarcode ? (
                        <InputAdornment position="end">
                          <Tooltip
                            title={t('proveedores.selectorInline.heredado')}
                          >
                            <AutoFixHighOutlinedIcon
                              data-testid="AutoFixHighOutlinedIcon"
                              fontSize="small"
                              color="primary"
                              sx={{ opacity: 0.6 }}
                            />
                          </Tooltip>
                        </InputAdornment>
                      ) : prov.codigoBarras &&
                        prov.codigoBarras !== masterBarcode ? (
                        <InputAdornment position="end">
                          <Tooltip
                            title={t(
                              'proveedores.selectorInline.usarValorProducto'
                            )}
                          >
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleChangeField(
                                  prov.proveedorId,
                                  'codigoBarras',
                                  ''
                                )
                              }
                            >
                              <HistoryIcon
                                data-testid="HistoryIcon"
                                fontSize="small"
                              />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ) : null,
                  },
                }}
                disabled={disabled}
                fullWidth
              />
              <NumericInput
                label={t('proveedores.campoPrecioCompra')}
                size="small"
                name={`precio-${prov.proveedorId}`}
                value={prov.precioUnitario ?? ''}
                onChange={(parsed, raw) => {
                  const isEditingDecimal =
                    raw.endsWith('.') || raw.endsWith(',');
                  handleChangeField(
                    prov.proveedorId,
                    'precioUnitario',
                    isEditingDecimal ? raw : (parsed ?? '')
                  );
                }}
                disabled={disabled}
                fullWidth
              />
            </Stack>
          </Paper>
        ))}
      </Stack>

      <QuickProveedorModal
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        onSuccess={handleQuickSuccess}
      />
    </Box>
  );
};

export default ProveedorSelector;
