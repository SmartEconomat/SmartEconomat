/**
 * @fileoverview Componente de filtro de categorías de productos.
 *
 * Implementa un Autocomplete de MUI con selección múltiple:
 *  - Input de texto para búsqueda en tiempo real
 *  - Dropdown para seleccionar categorías
 *  - Las opciones seleccionadas se muestran como Chips CON su icono oficial DENTRO del control
 *  - El ancho del control crece conforme se añaden selecciones (hasta un máximo)
 *  - Icono de cada categoría usa getCategoryIconFilled (los mismos que StatusChip)
 *  - Sin filtro de alérgenos (retirado según requisitos)
 */

import React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import FilterListIcon from '@mui/icons-material/FilterList';
import { CategoriaProducto } from '../../services/producto.types';
import { getCategoryIconFilled } from './utils/getCategoryIconFilled';
import { useBreakpoints } from '../../utils/useBreakpoints';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos públicos
// ─────────────────────────────────────────────────────────────────────────────

/** Estado que representa los filtros seleccionados actualmente. */
export interface ProductFiltersState {
  /** Lista de categorías seleccionadas. Vacío significa "Todas". */
  categorias: CategoriaProducto[];
  /**
   * Lista de IDs de alérgenos.
   * Mantenida por compatibilidad con Productos.tsx pero no se usa en este filtro.
   */
  alergenos: string[];
}

export interface ProductFiltersProps {
  filters: ProductFiltersState;
  onChange: (filters: ProductFiltersState) => void;
  onClear?: () => void;
  /** Mantenida por compatibilidad. No tiene efecto visual en esta versión. */
  inline?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Opciones de categoría
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────────────────────

const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  onChange,
}) => {
  const { isMobileOrTablet } = useBreakpoints();

  // Sincronizar las opciones seleccionadas con el estado externo
  const selected = CATEGORIA_OPTIONS.filter((opt) =>
    filters.categorias.includes(opt.value)
  );

  // En móvil/tablet ocupa el 100%; en desktop crece con los chips (mín 220, máx 660)
  const dynamicWidth = isMobileOrTablet
    ? '100%'
    : selected.length === 0
      ? 220
      : Math.min(220 + selected.length * 110, 660);

  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      options={CATEGORIA_OPTIONS}
      value={selected}
      getOptionLabel={(opt) => opt.label}
      isOptionEqualToValue={(opt, val) => opt.value === val.value}
      onChange={(_, newValue) => {
        onChange({
          ...filters,
          categorias: newValue.map((v) => v.value),
        });
      }}
      /* ── Chips dentro del input ── */
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
                    alignItems: 'center',
                    // Ajuste para que el icono quede junto al label
                    ml: '4px !important',
                    mr: '-2px',
                    '& svg': { fontSize: '13px !important' },
                  }}
                >
                  {getCategoryIconFilled(option.value, {
                    sx: { fontSize: 13 },
                  })}
                </Box>
              }
              label={
                <Typography
                  component="span"
                  variant="caption"
                  sx={{ fontWeight: 500, lineHeight: 1, fontSize: '0.7rem' }}
                >
                  {option.label}
                </Typography>
              }
              sx={{
                height: 22,
                borderRadius: '4px',
                // Elimina padding extra del MuiChip-icon para que quede compacto
                '& .MuiChip-icon': { ml: 0, mr: 0 },
              }}
            />
          );
        })
      }
      /* ── Opciones del dropdown con icono ── */
      renderOption={(props, option) => {
        // Separamos key del resto para evitar el warning de React
        const { key, ...listItemProps } =
          props as React.HTMLAttributes<HTMLLIElement> & { key: React.Key };
        return (
          <Box
            component="li"
            key={key}
            {...listItemProps}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              py: '6px !important',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: 'text.secondary',
                '& svg': { fontSize: 18 },
              }}
            >
              {getCategoryIconFilled(option.value, { sx: { fontSize: 18 } })}
            </Box>
            <Typography variant="body2">{option.label}</Typography>
          </Box>
        );
      }}
      /* ── TextField del Autocomplete ── */
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          placeholder={selected.length === 0 ? 'Filtrar categoría...' : ''}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                {/* Icono de filtro siempre visible a la izquierda */}
                <Box
                  component="span"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    color:
                      selected.length > 0 ? 'primary.main' : 'action.active',
                    ml: 0.5,
                    mr: 0.25,
                    flexShrink: 0,
                  }}
                >
                  <FilterListIcon sx={{ fontSize: 18 }} />
                </Box>
                {/* Chips generados por renderTags */}
                {params.InputProps.startAdornment}
              </>
            ),
          }}
        />
      )}
      sx={{
        minWidth: isMobileOrTablet ? 'unset' : 220,
        width: dynamicWidth,
        transition: 'width 0.25s ease, all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        flex: isMobileOrTablet ? '1 1 auto' : '0 0 auto',
        '& .MuiOutlinedInput-root': {
          bgcolor: 'background.paper',
          borderRadius: 2,
        },
      }}
      ListboxProps={{ style: { maxHeight: 300 } }}
      noOptionsText="Sin resultados"
      clearText="Limpiar filtros"
      openText="Ver categorías"
      closeText="Cerrar"
    />
  );
};

export default ProductFilters;
