import React from 'react';
import { useTranslation } from 'react-i18next';
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
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
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
  /** Acción secundaria (ej: "Gestionar") */
  secondaryAction?: {
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
  searchPlaceholder,
  searchId = 'page-search',
  primaryAction,
  secondaryAction,
  filters,
  totalItems,
  totalItemsLabel,
  viewMode,
  onViewModeChange,
  onScanBarcode,
  autoFocusSearch = false,
  sticky = true,
  extraActions = [],
}) => {
  const { t } = useTranslation();
  const resolvedSearchPlaceholder =
    searchPlaceholder ?? t('pageToolbar.searchPlaceholder');
  const resolvedTotalItemsLabel = totalItemsLabel ?? '';
  const { isMobile, isMobileOrTablet } = useBreakpoints();
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = React.useState(true);

  const hasFiltersOrSearch = onSearchChange || filters;

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
                    p: 1,
                    borderRadius: 1.5,
                  }}
                >
                  {icon}
                </Box>
              )}
              <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                {title}
              </Typography>
              {hasFiltersOrSearch && (
                <Tooltip
                  title={
                    isExpanded
                      ? t('pageToolbar.hideFilters')
                      : t('pageToolbar.showFilters')
                  }
                >
                  <IconButton
                    size="small"
                    onClick={() => setIsExpanded(!isExpanded)}
                    sx={{
                      bgcolor: isExpanded
                        ? 'transparent'
                        : alpha(theme.palette.primary.main, 0.1),
                      color: isExpanded ? 'text.secondary' : 'primary.main',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                      },
                    }}
                  >
                    {isExpanded ? <ExpandLessIcon /> : <FilterListIcon />}
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              {totalItems !== undefined && (
                <Tooltip
                  title={t('pageToolbar.totalItems', {
                    label: resolvedTotalItemsLabel,
                    count: totalItems,
                  })}
                >
                  <Chip
                    icon={<CheckCircleIcon fontSize="small" />}
                    label={t('pageToolbar.totalItems', {
                      label: resolvedTotalItemsLabel,
                      count: totalItems,
                    })}
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{
                      fontWeight: 500,
                      px: 1,
                      '& .MuiChip-label': { px: 1 },
                      display: { xs: 'none', sm: 'inline-flex' },
                    }}
                  />
                </Tooltip>
              )}
              {/* Móvil: Versión más compacta del chip */}
              {totalItems !== undefined && (
                <Chip
                  label={t('pageToolbar.totalItems', {
                    label: resolvedTotalItemsLabel,
                    count: totalItems,
                  })}
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{
                    fontWeight: 700,
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
              display="flex"
              flexDirection={isMobileOrTablet ? 'column' : 'row'}
              gap={2}
              alignItems={isMobileOrTablet ? 'stretch' : 'center'}
              flexWrap="wrap"
              sx={{ mt: 1, mb: 1 }}
            >
              {onSearchChange && (
                <TextField
                  id={searchId}
                  placeholder={resolvedSearchPlaceholder}
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  size="small"
                  autoFocus={autoFocusSearch}
                  sx={{
                    minWidth: { xs: '100%', sm: 240, md: 400 },
                    flex: { xs: '1 1 100%', sm: '1000 1 auto' },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                    },
                  }}
                  InputProps={{
                    'aria-label': resolvedSearchPlaceholder,
                    startAdornment: onScanBarcode && (
                      <InputAdornment position="start">
                        <Tooltip title={t('pageToolbar.scanCamera')}>
                          <IconButton
                            size="small"
                            onClick={onScanBarcode}
                            aria-label={t('pageToolbar.scanCode')}
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
                              aria-label={t('pageToolbar.clearSearch')}
                            >
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          )}
                          <SearchIcon
                            fontSize="small"
                            sx={{ color: 'text.disabled', ml: 0.5 }}
                          />
                        </Stack>
                      </InputAdornment>
                    ),
                  }}
                />
              )}

              {filters && (
                <Box
                  sx={{
                    flex: { xs: '1 1 100%', sm: '1 1 auto' },
                    display: 'flex',
                    width: { xs: '100%', sm: 'auto' },
                    flexGrow: 1,
                  }}
                >
                  {filters}
                </Box>
              )}
            </Box>
          </Collapse>
        )}

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
                <ToggleButton value="list">
                  <ViewListIcon fontSize="small" />
                </ToggleButton>
                <ToggleButton value="grid">
                  <ViewModuleIcon fontSize="small" />
                </ToggleButton>
              </ToggleButtonGroup>
            )}

            {/* Selector 'Por página' eliminado: ahora se usa TablePagination al final de la tabla */}
          </Box>

          {/* DERECHA: Acción Principal + Secundaria */}
          <Box
            sx={{
              ml: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            {extraActions.map((action) => (
              <React.Fragment key={action.id || action.label}>
                {isMobile ? (
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
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                      }}
                    >
                      {action.isLoading ? (
                        <CircularProgress size={20} color="inherit" />
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
                    startIcon={
                      action.isLoading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        action.icon
                      )
                    }
                    onClick={action.onClick}
                    disabled={action.disabled || action.isLoading}
                    sx={{
                      borderRadius: 2,
                      px: { sm: 2, md: 3 },
                      py: 1,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      textTransform: 'uppercase',
                    }}
                  >
                    {action.label}
                  </Button>
                )}
              </React.Fragment>
            ))}

            {secondaryAction && (
              <>
                {isMobile ? (
                  <Tooltip title={secondaryAction.label}>
                    <IconButton
                      id={secondaryAction.id}
                      onClick={secondaryAction.onClick}
                      disabled={secondaryAction.disabled}
                      sx={{
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        color: 'primary.main',
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                      }}
                    >
                      {secondaryAction.icon || <AddIcon />}
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Button
                    id={secondaryAction.id}
                    variant="outlined"
                    startIcon={
                      secondaryAction.isLoading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        secondaryAction.icon
                      )
                    }
                    onClick={secondaryAction.onClick}
                    disabled={
                      secondaryAction.disabled || secondaryAction.isLoading
                    }
                    sx={{
                      borderRadius: 2,
                      px: { sm: 2, md: 3 },
                      py: 1,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      textTransform: 'uppercase',
                    }}
                  >
                    {secondaryAction.label}
                  </Button>
                )}
              </>
            )}

            {primaryAction && (
              <>
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
                        width: 40,
                        height: 40,
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
                    startIcon={
                      primaryAction.isLoading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        primaryAction.icon || <AddIcon />
                      )
                    }
                    onClick={primaryAction.onClick}
                    disabled={primaryAction.disabled || primaryAction.isLoading}
                    sx={{
                      borderRadius: 2,
                      px: { sm: 2, md: 3 },
                      py: 1,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
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
      </Box>
    </Paper>
  );
};

export default PageToolbar;
