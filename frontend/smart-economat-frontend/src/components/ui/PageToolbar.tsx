import React from 'react';
import {
    Box,
    TextField,
    Button,
    IconButton,
    InputAdornment,
    Tooltip,
    Typography,
    Paper,
    Divider,
    ToggleButtonGroup,
    ToggleButton,
    Select,
    MenuItem,
    FormControl,
    SelectChangeEvent,
    alpha,
    useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/SearchOutlined';
import AddIcon from '@mui/icons-material/Add';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import { useBreakpoints } from '../../utils/useBreakpoints';

export interface PageToolbarProps {
    /** Título de la sección */
    title?: string;
    /** Valor del campo de búsqueda */
    searchValue?: string;
    /** Callback cuando cambia la búsqueda */
    onSearchChange?: (value: string) => void;
    /** Placeholder para la búsqueda */
    searchPlaceholder?: string;
    /** ID para el input de búsqueda */
    searchId?: string;
    /** Acción principal (ej: "Nuevo Producto") */
    primaryAction?: {
        label: string;
        onClick: () => void;
        icon?: React.ReactNode;
        id?: string;
        disabled?: boolean;
    };
    /** Filtros adicionales (Autocomplete, Selects, etc.) */
    filters?: React.ReactNode;
    /** Conteo total de elementos */
    totalItems?: number;
    /** Etiqueta para el total (ej: "productos", "usuarios") */
    totalItemsLabel?: string;
    /** Modo de vista actual (si aplica) */
    viewMode?: 'list' | 'grid';
    /** Callback para cambiar modo de vista */
    onViewModeChange?: (mode: 'list' | 'grid') => void;
    /** Registros por página actuales */
    pageSize?: number;
    /** Callback para cambiar registros por página */
    onPageSizeChange?: (event: SelectChangeEvent<number>) => void;
    /** Opciones de registros por página */
    pageSizeOptions?: number[];
    /** Si es true, el toolbar se mantiene arriba al hacer scroll */
    sticky?: boolean;
}

/**
 * PageToolbar: Componente unificado para cabeceras de página.
 * Incluye Título, Búsqueda, Filtros y Controles de Tabla (Paginación/Vista)
 * siguiendo un diseño premium y responsive.
 */
const PageToolbar: React.FC<PageToolbarProps> = ({
    title,
    searchValue,
    onSearchChange,
    searchPlaceholder = "Buscar...",
    searchId = "page-search",
    primaryAction,
    filters,
    totalItems,
    totalItemsLabel = "elementos",
    viewMode,
    onViewModeChange,
    pageSize,
    onPageSizeChange,
    pageSizeOptions = [5, 10, 25, 50],
    sticky = true,
}) => {
    const { isMobile, isMobileOrTablet } = useBreakpoints();
    const theme = useTheme();

    return (
        <Paper
            elevation={0}
            sx={{
                p: { xs: 2, sm: 3 },
                mb: 3,
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.background.paper, 0.95),
                backdropFilter: 'blur(8px)',
                border: '1px solid',
                borderColor: 'divider',
                ...(sticky && {
                    position: 'sticky',
                    top: { xs: 80, sm: 100 }, // Desktop AppBar height - adjust if MainLayout changes
                    zIndex: 1000,
                    mx: -1, // Slight negative margin to flow better on scroll
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                }),
            }}
        >
            <Box display="flex" flexDirection="column" gap={2}>
                {/* FILA 1: TÍTULO */}
                {title && (
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
                        {title}
                    </Typography>
                )}

                {/* FILA 2: BÚSQUEDA Y FILTROS */}
                <Box
                    display="flex"
                    flexDirection={isMobileOrTablet ? 'column' : 'row'}
                    gap={2}
                    alignItems={isMobileOrTablet ? 'stretch' : 'center'}
                    flexWrap="wrap"
                >
                    {onSearchChange && (
                        <TextField
                            id={searchId}
                            placeholder={searchPlaceholder}
                            value={searchValue}
                            onChange={(e) => onSearchChange(e.target.value)}
                            size="small"
                            sx={{
                                minWidth: { xs: '100%', sm: 240, md: 400 },
                                flex: { xs: '1 1 100%', sm: '1000 1 auto' },
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    bgcolor: 'background.paper',
                                }
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    )}

                    {filters && (
                        <Box sx={{
                            flex: { xs: '1 1 100%', sm: '1 1 auto' },
                            width: { xs: '100%', sm: 'auto' }
                        }}>
                            {filters}
                        </Box>
                    )}
                </Box>

                {/* FILA 3: CONTROLES DE TABLA Y ACCIÓN */}
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    flexWrap="wrap"
                    gap={2}
                    pt={1}
                >
                    {/* IZQUIERDA: Vista + PageSize */}
                    <Box display="flex" alignItems="center" gap={2}>
                        {onViewModeChange && viewMode && (
                            <ToggleButtonGroup
                                value={viewMode}
                                exclusive
                                onChange={(_, next) => next && onViewModeChange(next)}
                                size="small"
                                sx={{ bgcolor: 'background.paper', borderRadius: 1.5 }}
                            >
                                <ToggleButton value="list"><ViewListIcon fontSize="small" /></ToggleButton>
                                <ToggleButton value="grid"><ViewModuleIcon fontSize="small" /></ToggleButton>
                            </ToggleButtonGroup>
                        )}

                        {onPageSizeChange && (
                            <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                                    Ver
                                </Typography>
                                <FormControl size="small">
                                    <Select
                                        value={pageSize || pageSizeOptions[0]}
                                        onChange={onPageSizeChange}
                                        sx={{
                                            minWidth: 70,
                                            borderRadius: 1.5,
                                            height: 38,
                                            bgcolor: 'background.paper'
                                        }}
                                    >
                                        {pageSizeOptions.map(opt => (
                                            <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>
                                    por página
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {/* DERECHA: Conteo + Separador + Acción */}
                    <Box display="flex" alignItems="center" gap={3}>
                        {totalItems !== undefined && (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                    Total de {totalItemsLabel}:
                                </Typography>
                                <Box sx={{
                                    ml: 1,
                                    minWidth: 40,
                                    textAlign: 'center'
                                }}>
                                    <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>
                                        {totalItems}
                                    </Typography>
                                </Box>
                            </Box>
                        )}

                        {primaryAction && (
                            <>
                                <Divider orientation="vertical" flexItem sx={{ borderRightWidth: 2, height: 28, alignSelf: 'center', display: { xs: 'none', sm: 'block' } }} />

                                {isMobile ? (
                                    <Tooltip title={primaryAction.label}>
                                        <IconButton
                                            id={primaryAction.id}
                                            onClick={primaryAction.onClick}
                                            disabled={primaryAction.disabled}
                                            sx={{
                                                bgcolor: 'primary.main',
                                                color: 'white',
                                                '&:hover': { bgcolor: 'primary.dark' },
                                                width: 42,
                                                height: 42,
                                                borderRadius: 2
                                            }}
                                        >
                                            {primaryAction.icon || <AddIcon />}
                                        </IconButton>
                                    </Tooltip>
                                ) : (
                                    <Button
                                        id={primaryAction.id}
                                        variant="contained"
                                        startIcon={primaryAction.icon || <AddIcon />}
                                        onClick={primaryAction.onClick}
                                        disabled={primaryAction.disabled}
                                        sx={{
                                            borderRadius: 2,
                                            px: 3,
                                            py: 1,
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                            bgcolor: 'primary.main',
                                            '&:hover': { bgcolor: 'primary.dark' }
                                        }}
                                    >
                                        {primaryAction.label}
                                    </Button>
                                )}
                            </>
                        )}
                    </Box>
                </Box>
            </Box>
        </Paper>
    );
};

export default PageToolbar;
