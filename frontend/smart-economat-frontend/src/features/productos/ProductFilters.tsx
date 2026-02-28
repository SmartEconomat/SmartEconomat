import React from 'react';
import { Box, Button, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { CategoriaProducto } from '../../services/producto.types';
import { EU_ALLERGENS } from '../../components/ui/AllergenSelector';

export interface ProductFiltersState {
    categorias: CategoriaProducto[];
    alergenos: string[];
}

export interface ProductFiltersProps {
    filters: ProductFiltersState;
    onChange: (filters: ProductFiltersState) => void;
    onClear?: () => void;
    /** Si true, muestra Categoría y Alérgenos en fila (alineados con el buscador). */
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

    const hasActiveFilters =
        (filters.categorias && filters.categorias.length > 0) ||
        (filters.alergenos && filters.alergenos.length > 0);

    const selectSx = inline ? { minWidth: 160, maxWidth: 220 } : {};
    const formControlSx = inline ? { ...selectSx, flex: { xs: '1 1 100%', sm: '0 0 auto' } } : { width: '100%', mb: 2 };

    const content = (
        <>
            <FormControl size="small" sx={formControlSx}>
                <InputLabel id="filter-categoria-label">Categoría</InputLabel>
                <Select
                    labelId="filter-categoria-label"
                    label="Categoría"
                    multiple
                    value={filters.categorias ?? []}
                    onChange={(e) => handleCategoriasChange(e.target.value as CategoriaProducto[])}
                    renderValue={(selected) =>
                        selected.length === 0 ? 'Todas' : selected.map((v) => CATEGORIA_OPTIONS.find((o) => o.value === v)?.label ?? v).join(', ')
                    }
                    sx={inline ? selectSx : undefined}
                >
                    {CATEGORIA_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <FormControl size="small" sx={formControlSx}>
                <InputLabel id="filter-alergenos-label">Alérgenos</InputLabel>
                <Select
                    labelId="filter-alergenos-label"
                    label="Alérgenos"
                    multiple
                    value={filters.alergenos ?? []}
                    onChange={(e) => handleAlergenosChange(e.target.value as string[])}
                    renderValue={(selected) =>
                        selected.length === 0 ? 'Ninguno' : selected.map((id) => EU_ALLERGENS.find((a) => a.id === id)?.label ?? id).join(', ')
                    }
                    sx={inline ? selectSx : undefined}
                >
                    {EU_ALLERGENS.map((a) => (
                        <MenuItem key={a.id} value={a.id}>
                            {a.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {hasActiveFilters && onClear && (
                <Button size="small" variant="outlined" onClick={onClear} sx={inline ? { flexShrink: 0 } : { width: '100%' }}>
                    Limpiar filtros
                </Button>
            )}
        </>
    );

    if (inline) {
        return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
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
