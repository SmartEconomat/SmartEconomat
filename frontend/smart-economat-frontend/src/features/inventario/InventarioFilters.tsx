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

// Move CATEGORIA_OPTIONS logic into the component to use t()

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

  const categoriaOptions = React.useMemo<
    { value: CategoriaProducto; label: string }[]
  >(
    () => [
      {
        value: CategoriaProducto.VERDURA,
        label: t('productos.categories.verdura'),
      },
      {
        value: CategoriaProducto.FRUTA,
        label: t('productos.categories.fruta'),
      },
      {
        value: CategoriaProducto.CARNE,
        label: t('productos.categories.carne'),
      },
      {
        value: CategoriaProducto.PESCADO,
        label: t('productos.categories.pescado'),
      },
      {
        value: CategoriaProducto.MARISCO,
        label: t('productos.categories.marisco'),
      },
      {
        value: CategoriaProducto.LACTEO,
        label: t('productos.categories.lacteo'),
      },
      {
        value: CategoriaProducto.HUEVO,
        label: t('productos.categories.huevo'),
      },
      {
        value: CategoriaProducto.CEREAL,
        label: t('productos.categories.cereal'),
      },
      {
        value: CategoriaProducto.LEGUMBRE,
        label: t('productos.categories.legumbre'),
      },
      {
        value: CategoriaProducto.FRUTO_SECO,
        label: t('productos.categories.fruto_seco'),
      },
      {
        value: CategoriaProducto.CONDIMENTO,
        label: t('productos.categories.condimento'),
      },
      {
        value: CategoriaProducto.ACEITE,
        label: t('productos.categories.aceite'),
      },
      {
        value: CategoriaProducto.AZUCAR,
        label: t('productos.categories.azucar'),
      },
      {
        value: CategoriaProducto.BEBIDA,
        label: t('productos.categories.bebida'),
      },
      { value: CategoriaProducto.OTRO, label: t('productos.categories.otro') },
    ],
    [t]
  );

  const selectedCategorias = categoriaOptions.filter((opt) =>
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
        options={categoriaOptions}
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
                ? t('inventario.filters.categories')
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
                ? t('inventario.filters.locations')
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
