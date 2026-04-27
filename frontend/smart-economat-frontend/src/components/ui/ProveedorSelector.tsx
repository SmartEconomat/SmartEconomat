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
import { Proveedor } from '../../services/proveedor.types';
import QuickProveedorModal from './QuickProveedorModal';
import { usePermission } from '../../store/auth.hooks';
import { PERMISSIONS } from '../../sherlock-auth/permissions.constants';
import { useTranslation } from 'react-i18next';

export interface ProveedorAsociado {
  proveedorId: string;
  nombre?: string;
  marca?: string;
  codigoBarras?: string;
  precioUnitario?: number;
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAdd = (_event?: any, newValue?: Proveedor | null) => {
    if (!newValue) return;
    if (value.find((p) => p.proveedorId === newValue.id)) return;

    onChange([
      ...value,
      {
        proveedorId: newValue.id,
        nombre: newValue.nombre,
        marca: masterMarca || '',
        codigoBarras: masterBarcode || '',
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
    handleAdd(undefined, newProveedor);
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
                            onClick={() => setIsQuickCreateOpen(true)}
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
                slotProps={{ inputLabel: { shrink: true } }}
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
                slotProps={{ inputLabel: { shrink: true } }}
                disabled={disabled}
                fullWidth
              />
              <TextField
                label={t('proveedores.campoPrecioCompra')}
                size="small"
                type="number"
                slotProps={{
                  inputLabel: { shrink: true },
                  input: { inputProps: { min: 0, step: 0.01 } },
                }}
                value={prov.precioUnitario ?? ''}
                onChange={(e) =>
                  handleChangeField(
                    prov.proveedorId,
                    'precioUnitario',
                    parseFloat(e.target.value)
                  )
                }
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
