import React from 'react';
import {
  Box,
  Autocomplete,
  TextField,
  Chip,
  InputAdornment,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import PlaceIcon from '@mui/icons-material/Place';
import { CategoriaProducto } from '../../services/producto.types';
import { Ubicacion } from '../../services/ubicacion.types';
import { getCategoryIconFilled } from '../productos/utils/getCategoryIconFilled';
import { useBreakpoints } from '../../utils/useBreakpoints';
import { useTranslation } from 'react-i18next';

export interface InventarioFiltersState {
  categorias: CategoriaProducto[];
  ubicaciones: string[];
}

export interface InventarioFiltersProps {
  filters: InventarioFiltersState;
  onChange: (filters: InventarioFiltersState) => void;
  ubicacionesDisponibles: Ubicacion[];
}

const CATEGORIA_OPTIONS: { value: CategoriaProducto; label: string }[] = [
  { value: CategoriaProducto.VERDURA, label: 'Verdura' },
  { value: CategoriaProducto.FRUTA, label: 'Fruta' },
  { value: CategoriaProducto.CARNE, label: 'Carne' },
  { value: CategoriaProducto.PESCADO, label: 'Pescado' },
  { value: CategoriaProducto.MARISCO, label: 'Marisco' },
  { value: CategoriaProducto.LACTEO, label: 'Lácteo' },
  { value: CategoriaProducto.HUEVO, label: 'Huevo' },
  { value: CategoriaProducto.CEREAL, label: 'Cereal' },
  { value: CategoriaProducto.LEGUMBRE, label: 'Legumbre' },
  { value: CategoriaProducto.FRUTO_SECO, label: 'Fruto Seco' },
  { value: CategoriaProducto.CONDIMENTO, label: 'Condimento' },
  { value: CategoriaProducto.ACEITE, label: 'Aceite' },
  { value: CategoriaProducto.AZUCAR, label: 'Azúcar' },
  { value: CategoriaProducto.BEBIDA, label: 'Bebida' },
  { value: CategoriaProducto.OTRO, label: 'Otro' },
];

/**
 * Documentación en español.
 */
const InventarioFilters: React.FC<InventarioFiltersProps> = ({
  filters,
  onChange,
  ubicacionesDisponibles,
}) => {
  const { t } = useTranslation();
  const { isMobileOrTablet } = useBreakpoints();

  const selectedCategorias = CATEGORIA_OPTIONS.filter((opt) =>
    filters.categorias.includes(opt.value)
  );

  const selectedUbicaciones = ubicacionesDisponibles.filter((loc) =>
    filters.ubicaciones.includes(loc.nombre)
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 2,
        width: '100%',
        alignItems: 'center',
        '& .MuiOutlinedInput-root': {
          borderRadius: 2,
          bgcolor: 'background.paper',
        },
      }}
    >
      {/* Filtro de Categorías */}
      <Autocomplete
        multiple
        disableCloseOnSelect
        size="small"
        options={CATEGORIA_OPTIONS}
        value={selectedCategorias}
        getOptionLabel={(opt) => opt.label}
        isOptionEqualToValue={(opt, val) => opt.value === val.value}
        onChange={(_, newValue) => {
          onChange({
            ...filters,
            categorias: newValue.map((v) => v.value),
          });
        }}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => {
            const { key, ...tagProps } = getTagProps({ index });
            return (
              <Chip
                key={key}
                {...tagProps}
                size="small"
                icon={
                  <Box
                    component="span"
                    sx={{
                      display: 'flex',
                      ml: '4px !important',
                      mr: '-2px',
                      '& svg': { fontSize: 13 },
                    }}
                  >
                    {getCategoryIconFilled(option.value, {
                      sx: { fontSize: 13 },
                    })}
                  </Box>
                }
                label={option.label}
                sx={{ height: 24, borderRadius: 1 }}
              />
            );
          })
        }
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={
              selectedCategorias.length === 0 ? 'Filtrar categoría...' : ''
            }
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <>
                  <InputAdornment position="start" sx={{ ml: 0.5 }}>
                    <FilterListIcon
                      sx={{
                        fontSize: 18,
                        color:
                          selectedCategorias.length > 0
                            ? 'primary.main'
                            : 'action.active',
                      }}
                    />
                  </InputAdornment>
                  {params.InputProps.startAdornment}
                </>
              ),
            }}
          />
        )}
        sx={{
          flex: '1 1 auto',
          minWidth: isMobileOrTablet ? 'unset' : 250,
          transition: 'all 0.2s ease-in-out',
          '& .MuiOutlinedInput-root': {
            transition: 'all 0.2s ease-in-out',
          },
        }}
      />

      {/* Filtro de Ubicaciones */}
      <Autocomplete
        multiple
        disableCloseOnSelect
        size="small"
        options={ubicacionesDisponibles}
        value={selectedUbicaciones}
        getOptionLabel={(opt) => opt.nombre}
        isOptionEqualToValue={(opt, val) => opt.id === val.id}
        onChange={(_, newValue) => {
          onChange({
            ...filters,
            ubicaciones: newValue.map((v) => v.nombre),
          });
        }}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => {
            const { key, ...tagProps } = getTagProps({ index });
            return (
              <Chip
                key={key}
                {...tagProps}
                size="small"
                label={option.nombre}
                sx={{ height: 24, borderRadius: 1 }}
              />
            );
          })
        }
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={
              selectedUbicaciones.length === 0
                ? t('inventario.filtros.placeholderUbicacion')
                : ''
            }
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <>
                  <InputAdornment position="start" sx={{ ml: 0.5 }}>
                    <PlaceIcon
                      sx={{
                        fontSize: 18,
                        color:
                          selectedUbicaciones.length > 0
                            ? 'primary.main'
                            : 'action.active',
                      }}
                    />
                  </InputAdornment>
                  {params.InputProps.startAdornment}
                </>
              ),
            }}
          />
        )}
        sx={{
          flex: '1 1 auto',
          minWidth: isMobileOrTablet ? 'unset' : 200,
          transition: 'all 0.2s ease-in-out',
          '& .MuiOutlinedInput-root': {
            transition: 'all 0.2s ease-in-out',
          },
        }}
      />
    </Box>
  );
};

export default InventarioFilters;
