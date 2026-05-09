import React from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { CategoriaProducto } from '../../services/producto.types';
import { getCategoryIconFilled } from './utils/getCategoryIconFilled';
import SmartFilterAutocomplete from '../../components/ui/SmartFilterAutocomplete';
import { getEnumLabel } from '../../i18n/enumPresentation';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos públicos
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export interface ProductFiltersState {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  categorias: CategoriaProducto[];
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  alergenos: string[];
}

/** Contrato de tipos público (ProductFiltersProps). Contexto: smart-economat-frontend (SPA). */
export interface ProductFiltersProps {
  filters: ProductFiltersState;
  onChange: (filters: ProductFiltersState) => void;
  onClear?: () => void;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  inline?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Opciones de categoría
// ─────────────────────────────────────────────────────────────────────────────

interface CategoryOption {
  value: CategoriaProducto;
}

const CATEGORIA_OPTIONS: CategoryOption[] = [
  { value: CategoriaProducto.VERDURA },
  { value: CategoriaProducto.FRUTA },
  { value: CategoriaProducto.CARNE },
  { value: CategoriaProducto.PESCADO },
  { value: CategoriaProducto.MARISCO },
  { value: CategoriaProducto.LACTEO },
  { value: CategoriaProducto.HUEVO },
  { value: CategoriaProducto.CEREAL },
  { value: CategoriaProducto.LEGUMBRE },
  { value: CategoriaProducto.FRUTO_SECO },
  { value: CategoriaProducto.CONDIMENTO },
  { value: CategoriaProducto.ACEITE },
  { value: CategoriaProducto.AZUCAR },
  { value: CategoriaProducto.BEBIDA },
  { value: CategoriaProducto.OTRO },
];

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  onChange,
}) => {
  const { t } = useTranslation();
  const getCategoryLabel = (value: CategoriaProducto) =>
    getEnumLabel(t, 'productoCategoria', value);

  // Sincronizar las opciones seleccionadas con el estado externo
  const selected = CATEGORIA_OPTIONS.filter((opt) =>
    filters.categorias.includes(opt.value)
  );

  return (
    <SmartFilterAutocomplete<CategoryOption>
      options={CATEGORIA_OPTIONS}
      value={selected}
      getOptionLabel={(opt) => getCategoryLabel(opt.value)}
      isOptionEqualToValue={(opt, val) => opt.value === val.value}
      placeholder={t('productos.filtros.placeholderCategoria')}
      ariaLabel={t('productos.filtros.ariaCategoria')}
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
                  {getCategoryLabel(option.value)}
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
          <Typography variant="body2">
            {getCategoryLabel(option.value)}
          </Typography>
        </Box>
      )}
      noOptionsText={t('productos.filtros.sinResultados')}
      clearText={t('productos.filtros.limpiar')}
      openText={t('productos.filtros.verCategorias')}
      closeText={t('comun.cerrar')}
    />
  );
};

export default ProductFilters;
