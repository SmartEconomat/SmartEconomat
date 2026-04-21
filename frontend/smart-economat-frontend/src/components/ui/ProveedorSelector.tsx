import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Autocomplete,
  Paper,
  Stack,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { Proveedor } from '../../services/proveedor.types';

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
}

const ProveedorSelector: React.FC<ProveedorSelectorProps> = ({
  value = [],
  onChange,
  proveedores = [],
  disabled = false,
}) => {
  const { t } = useTranslation();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAdd = (_event: any, newValue: Proveedor | null) => {
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

  const options = proveedores.filter(
    (p) => !value.find((v) => v.proveedorId === p.id)
  );

  return (
    <Box sx={{ width: '100%', mt: 1 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {t('proveedorSelector.title')}
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
            label={t('proveedorSelector.addSupplier')}
            variant="outlined"
            size="small"
            placeholder={t('proveedorSelector.searchPlaceholder')}
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
              aria-label={t('proveedorSelector.removeSupplier', {
                name: prov.nombre || '',
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
                t('proveedorSelector.unknownSupplier')}
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label={t('proveedorSelector.brand')}
                size="small"
                value={prov.marca || ''}
                onChange={(e) =>
                  handleChangeField(prov.proveedorId, 'marca', e.target.value)
                }
                disabled={disabled}
                fullWidth
              />
              <TextField
                label={t('proveedorSelector.barcode')}
                size="small"
                value={prov.codigoBarras || ''}
                onChange={(e) =>
                  handleChangeField(
                    prov.proveedorId,
                    'codigoBarras',
                    e.target.value
                  )
                }
                disabled={disabled}
                fullWidth
              />
              <TextField
                label={t('proveedorSelector.purchasePrice')}
                size="small"
                type="number"
                InputProps={{ inputProps: { min: 0, step: 0.01 } }}
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
    </Box>
  );
};

export default ProveedorSelector;
