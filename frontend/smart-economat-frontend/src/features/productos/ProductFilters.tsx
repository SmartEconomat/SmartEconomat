/**
 * @fileoverview Componente de filtros para la lista de productos.
 * Permite filtrar por categorías (múltiples) y alérgenos (múltiples).
 * Soporta modo normal (en bloque) y modo 'inline' (horizontal y adaptable a móvil).
 */

import React from 'react';
import { Box, Button, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { CategoriaProducto } from '../../services/producto.types';
import { EU_ALLERGENS } from '../../components/ui/AllergenSelector';

/**
 * Estado que representa los filtros seleccionados actualmente.
 */
export interface ProductFiltersState {
    /** Lista de categorías seleccionadas. Vacío significa "Todas". */
    categorias: CategoriaProducto[];
    /** Lista de IDs de alérgenos seleccionados. Vacío significa "Ninguno". */
    alergenos: string[];
}

/**
 * Props para el componente ProductFilters.
 */
export interface ProductFiltersProps {
    /** Estado actual de los filtros */
    filters: ProductFiltersState;
    /** Callback ejecutado al cambiar cualquier filtro */
    onChange: (filters: ProductFiltersState) => void;
    /** Callback ejecutado para reiniciar todos los filtros (muestra botón de limpiar) */
    onClear?: () => void;
    /** Si true, muestra Categoría y Alérgenos en fila (alineados horizontalmente y adaptables en móvil). */
    inline?: boolean;
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

const ProductFilters: React.FC<ProductFiltersProps> = ({ filters, onChange, onClear, inline = false }) => {
    const handleCategoriasChange = (value: CategoriaProducto[]) => {
        onChange({ ...filters, categorias: value });
    };

    const handleAlergenosChange = (value: string[]) => {
        onChange({ ...filters, alergenos: value });
    };

    const categoriaActive = filters.categorias && filters.categorias.length > 0;
    const alergenosActive = filters.alergenos && filters.alergenos.length > 0;
    const hasActiveFilters = categoriaActive || alergenosActive;

    const getSelectSx = (isActive: boolean) => {
        if (!inline) return {};
        // En móvil: si está activo toma todo el espacio posible flex: 3, si no flex: 1. sm en adelante mantienen tamaño fijo.
        return {
            minWidth: { xs: isActive ? 140 : 90, sm: 160 },
            maxWidth: { xs: '100%', sm: 220 },
            transition: 'all 0.3s ease',
        };
    };

    const getFormControlSx = (isActive: boolean) => {
        if (!inline) return { width: '100%', mb: 2 };
        return {
            flex: { xs: isActive ? '3 1 auto' : '1 1 auto', sm: '0 0 auto' },
            transition: 'all 0.3s ease',
        };
    };

    const content = (
        <>
            <FormControl size="small" sx={getFormControlSx(categoriaActive)}>
                <InputLabel id="filter-categoria-label" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    Categoría
                </InputLabel>
                <Select
                    labelId="filter-categoria-label"
                    label="Categoría"
                    multiple
                    value={filters.categorias ?? []}
                    onChange={(e) => handleCategoriasChange(e.target.value as CategoriaProducto[])}
                    renderValue={(selected) =>
                        selected.length === 0 ? 'Todas' : selected.map((v) => CATEGORIA_OPTIONS.find((o) => o.value === v)?.label ?? v).join(', ')
                    }
                    sx={getSelectSx(categoriaActive)}
                >
                    {CATEGORIA_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* <FormControl size="small" sx={getFormControlSx(alergenosActive)}>
                <InputLabel id="filter-alergenos-label" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    Alérgenos
                </InputLabel>
                <Select
                    labelId="filter-alergenos-label"
                    label="Alérgenos"
                    multiple
                    value={filters.alergenos ?? []}
                    onChange={(e) => handleAlergenosChange(e.target.value as string[])}
                    renderValue={(selected) =>
                        selected.length === 0 ? 'Ninguno' : selected.map((id) => EU_ALLERGENS.find((a) => a.id === id)?.label ?? id).join(', ')
                    }
                    sx={getSelectSx(alergenosActive)}
                >
                    {EU_ALLERGENS.map((a) => (
                        <MenuItem key={a.id} value={a.id}>
                            {a.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl> */}

            {hasActiveFilters && onClear && (
                <Button
                    size="small"
                    variant="outlined"
                    onClick={onClear}
                    sx={inline ? { flexShrink: 0, height: 40, minWidth: { xs: 80, sm: 'auto' }, px: { xs: 1, sm: 2 } } : { width: '100%' }}
                >
                    Limpiar
                </Button>
            )}
        </>
    );

    if (inline) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexWrap: { xs: 'nowrap', sm: 'wrap' },
                    alignItems: 'center',
                    gap: { xs: 1, sm: 2 },
                    width: { xs: '100%', sm: 'auto' }, // En móvil ocupa la fila completa debajo del buscador
                    flex: { xs: '1 1 100%', sm: '0 1 auto' },
                    overflowX: { xs: 'auto', sm: 'visible' },
                    pb: { xs: 0.5, sm: 0 }, // Espacio para el scroll si lo hubiera
                    pt: { xs: 1, sm: 0 }, // Evita que se recorten los labels 'outlined' que flotan arriba del borde (Categoría)
                }}
            >
                {content}
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%' }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterListIcon fontSize="small" />
                Filtros
            </Typography>
            {content}
        </Box>
    );
};

export default ProductFilters;
