import React from 'react';
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

/**
 * Represents a supplier association for a product, including commercial conditions.
 */
export interface ProveedorAsociado {
  proveedorId: string;
  nombre?: string;
  marca?: string;
  codigoBarras?: string;
  precioUnitario?: number;
}

/**
 * Props for the {@link ProveedorSelector} component.
 */
interface ProveedorSelectorProps {
  /** Currently associated suppliers with their commercial conditions. */
  value: ProveedorAsociado[];
  /** Callback invoked with the updated supplier list after any add/remove/edit. */
  onChange: (value: ProveedorAsociado[]) => void;
  /** Full catalogue of available suppliers for the autocomplete options. */
  proveedores: Proveedor[];
  /** If `true`, all inputs are disabled. */
  disabled?: boolean;
}

/**
 * Multi-supplier selector for products.
 *
 * Renders an autocomplete to add new suppliers and a list of cards for each
 * already-associated supplier where the user can set brand, barcode, and
 * unit purchase price. Duplicate suppliers are prevented automatically.
 *
 * @param props - See {@link ProveedorSelectorProps}.
 * @returns JSX element with autocomplete and editable supplier cards.
 * @example
 * <ProveedorSelector
 *   value={proveedores}
 *   onChange={setProveedores}
 *   proveedores={allProveedores}
 * />
 */
const ProveedorSelector: React.FC<ProveedorSelectorProps> = ({
  value = [],
  onChange,
  proveedores = [],
  disabled = false,
}) => {
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
        Proveedores y Condiciones
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
            label="Añadir Proveedor"
            variant="outlined"
            size="small"
            placeholder="Buscar proveedor..."
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
              aria-label={`Eliminar proveedor ${prov.nombre || ''}`}
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
                'Proveedor Desconocido'}
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Marca"
                size="small"
                value={prov.marca || ''}
                onChange={(e) =>
                  handleChangeField(prov.proveedorId, 'marca', e.target.value)
                }
                disabled={disabled}
                fullWidth
              />
              <TextField
                label="Código Barras Prov."
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
                label="Precio Compra"
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
