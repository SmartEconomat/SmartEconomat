import React from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { CategoriaProducto } from '../../services/producto.types';
import { getCategoryIconFilled } from './utils/getCategoryIconFilled';
import SmartFilterAutocomplete from '../../components/ui/SmartFilterAutocomplete';

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

interface CategoryOption {
  value: CategoriaProducto;
  label: string;
}

const CATEGORIA_OPTIONS: CategoryOption[] = [
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
 * ProductFilters
 *
 * Componente que utiliza el SmartFilterAutocomplete atómico para filtrar productos.
 */
const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  onChange,
}) => {
  // Sincronizar las opciones seleccionadas con el estado externo
  const selected = CATEGORIA_OPTIONS.filter((opt) =>
    filters.categorias.includes(opt.value)
  );

  return (
    <SmartFilterAutocomplete<CategoryOption>
      options={CATEGORIA_OPTIONS}
      value={selected}
      getOptionLabel={(opt) => opt.label}
      isOptionEqualToValue={(opt, val) => opt.value === val.value}
      placeholder="Filtrar categoría..."
      ariaLabel="Filtrar productos por categoría"
      onChange={(_, newValue) => {
        onChange({
          ...filters,
          categorias: newValue.map((v) => v.value),
        });
      }}
      /* ── Chips personalizados con iconos de categoría ── */
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
                    ml: '4px !important',
                    mr: '-2px',
                    '& svg': { fontSize: '13px !important' },
                  }}
                  aria-hidden="true"
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
                  sx={{ fontWeight: 500, lineHeight: 1, fontSize: '0.8rem' }}
                >
                  {option.label}
                </Typography>
              }
              sx={{
                height: 22,
                borderRadius: '4px',
                '& .MuiChip-icon': { ml: 0, mr: 0 },
              }}
            />
          );
        })
      }
      /* ── Opciones del dropdown con icono ── */
      renderOption={(props, option) => (
        <Box
          component="li"
          {...props}
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
            aria-hidden="true"
          >
            {getCategoryIconFilled(option.value, { sx: { fontSize: 18 } })}
          </Box>
          <Typography variant="body2">{option.label}</Typography>
        </Box>
      )}
      noOptionsText="Sin resultados"
      clearText="Limpiar filtros"
      openText="Ver categorías"
      closeText="Cerrar"
    />
  );
};

export default ProductFilters;
