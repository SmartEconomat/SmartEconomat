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

/**
 * Filtros avanzados para la página de Inventario.
 * Permite filtrar por tipo de producto (Categoría) y ubicación física.
 */
const InventarioFilters: React.FC<InventarioFiltersProps> = ({
  filters,
  onChange,
  ubicacionesDisponibles,
}) => {
  const { t } = useTranslation();
  const { isMobileOrTablet } = useBreakpoints();

  const CATEGORIA_OPTIONS: { value: CategoriaProducto; label: string }[] = [
    { value: CategoriaProducto.VERDURA, label: t('categoria.VERDURA') },
    { value: CategoriaProducto.FRUTA, label: t('categoria.FRUTA') },
    { value: CategoriaProducto.CARNE, label: t('categoria.CARNE') },
    { value: CategoriaProducto.PESCADO, label: t('categoria.PESCADO') },
    { value: CategoriaProducto.MARISCO, label: t('categoria.MARISCO') },
    { value: CategoriaProducto.LACTEO, label: t('categoria.LACTEO') },
    { value: CategoriaProducto.HUEVO, label: t('categoria.HUEVO') },
    { value: CategoriaProducto.CEREAL, label: t('categoria.CEREAL') },
    { value: CategoriaProducto.LEGUMBRE, label: t('categoria.LEGUMBRE') },
    { value: CategoriaProducto.FRUTO_SECO, label: t('categoria.FRUTO_SECO') },
    { value: CategoriaProducto.CONDIMENTO, label: t('categoria.CONDIMENTO') },
    { value: CategoriaProducto.ACEITE, label: t('categoria.ACEITE') },
    { value: CategoriaProducto.AZUCAR, label: t('categoria.AZUCAR') },
    { value: CategoriaProducto.BEBIDA, label: t('categoria.BEBIDA') },
    { value: CategoriaProducto.OTRO, label: t('categoria.OTRO') },
  ];

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
              selectedCategorias.length === 0
                ? t('productFilters.filterPlaceholder')
                : ''
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
                ? t('filters.filterByLocation')
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
