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
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  alpha,
  useTheme,
  Collapse,
  CircularProgress,
  Stack,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/SearchOutlined';
import AddIcon from '@mui/icons-material/Add';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import BarcodeIcon from './BarcodeIcon';
import ClearIcon from '@mui/icons-material/Clear'; // Added ClearIcon
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useBreakpoints } from '../../utils/useBreakpoints';

export interface PageToolbarProps {
  /** Título de la sección */
  title?: string;
  /** Icono opcional al lado del título */
  icon?: React.ReactNode;
  /** Valor del campo de búsqueda */
  searchValue?: string;
  /** Callback cuando cambia la búsqueda */
  onSearchChange?: (value: string) => void;
  /** Placeholder para la búsqueda */
  searchPlaceholder?: string;
  /** ID para el input de búsqueda */
  searchId?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    id?: string;
    disabled?: boolean;
    isLoading?: boolean;
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
  /** Callback para escanear código de barras/QR */
  onScanBarcode?: () => void; // Added onScanBarcode prop
  /** Si es true, enfoca automáticamente el campo de búsqueda */
  autoFocusSearch?: boolean;
  /** Si es true, el toolbar se mantiene arriba al hacer scroll */
  sticky?: boolean;
  extraActions?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    id?: string;
    disabled?: boolean;
    isLoading?: boolean;
    color?:
      | 'primary'
      | 'secondary'
      | 'error'
      | 'info'
      | 'success'
      | 'warning'
      | 'inherit';
    variant?: 'text' | 'outlined' | 'contained';
  }[];
}

/**
 * PageToolbar: Componente unificado para cabeceras de página.
 * Incluye Título, Búsqueda, Filtros y Controles de Tabla (Paginación/Vista)
 * siguiendo un diseño premium y responsive.
 */
const PageToolbar: React.FC<PageToolbarProps> = ({
  title,
  icon,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  searchId = 'page-search',
  primaryAction,
  filters,
  totalItems,
  totalItemsLabel = 'elementos',
  viewMode,
  onViewModeChange,
  onScanBarcode, // Added onScanBarcode to destructuring
  autoFocusSearch = false,
  sticky = true,
  extraActions = [],
}) => {
  const { isMobile, isMobileOrTablet } = useBreakpoints();
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = React.useState(true);

  const hasFiltersOrSearch = onSearchChange || filters;

  return (
    <Paper
      elevation={0}
      component="section"
      aria-label={`Barra de herramientas de ${title || 'la página'}`}
      sx={{
        p: { xs: 1.5, sm: 2 },
        mb: 2.5,
        borderRadius: 2,
        backgroundColor: alpha(theme.palette.background.paper, 0.95),
        backdropFilter: 'blur(8px)',
        border: '1px solid',
        borderColor: 'divider',
        ...(sticky && {
          position: 'sticky',
          top: { xs: 72, sm: 80 },
          zIndex: 1000,
          mx: -0.5,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        }),
      }}
    >
      <Box display="flex" flexDirection="column" gap={1.5}>
        {/* FILA 1: TÍTULO Y CONTEO */}
        {title && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: hasFiltersOrSearch && isExpanded ? 1 : 0,
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            <Box display="flex" alignItems="center" gap={1.5}>
              {icon && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'primary.main',
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                    p: 0.75,
                    borderRadius: 1.5,
                  }}
                >
                  {icon}
                </Box>
              )}
              <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
                {title}
              </Typography>
            </Box>

            <Box
              display="flex"
              alignItems="center"
              gap={1.5}
              sx={{ ml: 'auto', flexWrap: 'wrap', justifyContent: 'flex-end' }}
            >
              {totalItems !== undefined && (
                <Tooltip title={`Total de ${totalItemsLabel}: ${totalItems}`}>
                  <Chip
                    icon={
                      <CheckCircleIcon sx={{ fontSize: '14px !important' }} />
                    }
                    label={
                      <>
                        Total: <strong>{totalItems}</strong>
                      </>
                    }
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{
                      fontWeight: 500,
                      height: 24,
                      fontSize: '0.75rem',
                      px: 0.5,
                      '& .MuiChip-label': { px: 0.5 },
                      display: { xs: 'none', sm: 'inline-flex' },
                    }}
                  />
                </Tooltip>
              )}
              {totalItems !== undefined && (
                <Chip
                  label={`Total: ${totalItems}`}
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{
                    fontWeight: 700,
                    height: 24,
                    fontSize: '0.7rem',
                    display: { xs: 'inline-flex', sm: 'none' },
                  }}
                />
              )}
            </Box>
          </Box>
        )}

        {/* FILA 2: BÚSQUEDA Y FILTROS (Colapsable) */}
        {hasFiltersOrSearch && (
          <Collapse in={isExpanded}>
            <Box
              id="filters-area"
              tabIndex={-1}
              display="flex"
              flexDirection={isMobile ? 'column' : 'row'}
              gap={isMobile ? 1 : 2}
              alignItems={isMobile ? 'stretch' : 'flex-start'}
              flexWrap="wrap"
              sx={{ outline: 'none', mt: 0.5, mb: 0.5, width: '100%' }}
            >
              <TextField
                id={searchId}
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                size="small"
                autoFocus={autoFocusSearch}
                fullWidth
                sx={{
                  flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' },
                  width: { xs: '100%', sm: 'calc(50% - 8px)' },
                  minWidth: 0,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                  },
                }}
                slotProps={{
                  htmlInput: {
                    'aria-label': searchPlaceholder,
                  },
                  input: {
                    startAdornment: onScanBarcode && (
                      <InputAdornment position="start">
                        <Tooltip title="Escanear con cámara">
                          <IconButton
                            size="small"
                            onClick={onScanBarcode}
                            aria-label="Escanear código"
                            color="primary"
                            sx={{
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                borderRadius: 1,
                              },
                              p: 0.5,
                              ml: -0.5,
                            }}
                          >
                            <BarcodeIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Stack
                          direction="row"
                          spacing={0.5}
                          alignItems="center"
                        >
                          {searchValue && (
                            <IconButton
                              size="small"
                              onClick={() => onSearchChange?.('')}
                              aria-label="Limpiar búsqueda"
                            >
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          )}
                          <SearchIcon
                            fontSize="small"
                            sx={{ color: 'text.secondary', ml: 0.5 }}
                          />
                        </Stack>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              {filters && (
                <Box
                  sx={{
                    flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)' },
                    display: 'flex',
                    width: { xs: '100%', sm: 'calc(50% - 8px)' },
                    minWidth: 0,
                    '& > *': { width: '100%' },
                  }}
                >
                  {filters}
                </Box>
              )}
            </Box>
          </Collapse>
        )}

        {/* FILA 3: ACCIONES Y CONTROLES */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={1.5}
          pt={0.5}
          sx={{
            mt: isMobile ? 0 : 0.25,
          }}
        >
          {/* IZQUIERDA: Vista Toggle */}
          <Box display="flex" alignItems="center" gap={1.5}>
            {onViewModeChange && viewMode && (
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(_, next) => next && onViewModeChange(next)}
                size="small"
                sx={{
                  bgcolor: 'background.paper',
                  borderRadius: 1.5,
                  '& .MuiToggleButton-root': { py: 0.5, px: 1 },
                }}
              >
                <ToggleButton value="list" aria-label="Vista de lista">
                  <ViewListIcon fontSize="small" />
                </ToggleButton>
                <ToggleButton value="grid" aria-label="Vista de cuadrícula">
                  <ViewModuleIcon fontSize="small" />
                </ToggleButton>
              </ToggleButtonGroup>
            )}
          </Box>

          {/* DERECHA: Acciones */}
          <Box
            sx={{
              ml: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
            }}
          >
            {extraActions.map((action) => (
              <React.Fragment key={action.id || action.label}>
                {isMobileOrTablet ? (
                  <Tooltip title={action.label}>
                    <IconButton
                      id={action.id}
                      onClick={action.onClick}
                      disabled={action.disabled || action.isLoading}
                      color={action.color || 'primary'}
                      sx={{
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        width: isMobile ? 34 : 38,
                        height: isMobile ? 34 : 38,
                        borderRadius: 2,
                      }}
                    >
                      {action.isLoading ? (
                        <CircularProgress
                          size={isMobile ? 18 : 20}
                          color="inherit"
                        />
                      ) : (
                        action.icon
                      )}
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Button
                    id={action.id}
                    variant={action.variant || 'outlined'}
                    color={action.color || 'primary'}
                    size="small"
                    startIcon={
                      action.isLoading ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        action.icon
                      )
                    }
                    onClick={action.onClick}
                    disabled={action.disabled || action.isLoading}
                    sx={{
                      borderRadius: 2,
                      py: 0.6,
                      px: 1.5,
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                    }}
                  >
                    {action.label}
                  </Button>
                )}
              </React.Fragment>
            ))}

            {primaryAction && (
              <>
                {isMobileOrTablet ? (
                  <Tooltip title={primaryAction.label}>
                    <IconButton
                      id={primaryAction.id}
                      onClick={primaryAction.onClick}
                      disabled={primaryAction.disabled}
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': { bgcolor: 'primary.dark' },
                        width: isMobile ? 36 : 40,
                        height: isMobile ? 36 : 40,
                        borderRadius: 2,
                      }}
                    >
                      {primaryAction.icon || <AddIcon />}
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Button
                    id={primaryAction.id}
                    variant="contained"
                    size="small"
                    startIcon={
                      primaryAction.isLoading ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        primaryAction.icon || <AddIcon />
                      )
                    }
                    onClick={primaryAction.onClick}
                    disabled={primaryAction.disabled || primaryAction.isLoading}
                    sx={{
                      borderRadius: 2,
                      py: 0.6,
                      px: 1.5,
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      bgcolor: 'primary.main',
                      '&:hover': { bgcolor: 'primary.dark' },
                    }}
                  >
                    {primaryAction.label}
                  </Button>
                )}
              </>
            )}
          </Box>
        </Box>

        {/* FILA DE COLAPSO (PARTE INFERIOR) */}
        {hasFiltersOrSearch && (
          <Box
            display="flex"
            justifyContent="center"
            sx={{
              mt: -1,
              mb: -1, // Compensar el padding del Paper para que el botón esté al límite
              borderTop: isExpanded ? 'none' : '1px solid',
              borderColor: 'divider',
              opacity: 0.5,
              '&:hover': { opacity: 1 },
              transition: 'all 0.2s ease',
            }}
          >
            <IconButton
              size="small"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-label={isExpanded ? 'Ocultar filtros' : 'Mostrar filtros'}
              sx={{
                p: 0,
                width: 40,
                height: 20,
                borderRadius: '0 0 12px 12px',
                bgcolor: alpha(theme.palette.background.paper, 0.8),
                border: '1px solid',
                borderColor: 'divider',
                borderTop: 'none',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  color: 'primary.main',
                },
              }}
            >
              {isExpanded ? (
                <KeyboardArrowUpIcon sx={{ fontSize: 20 }} />
              ) : (
                <KeyboardArrowDownIcon sx={{ fontSize: 20 }} />
              )}
            </IconButton>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default PageToolbar;
