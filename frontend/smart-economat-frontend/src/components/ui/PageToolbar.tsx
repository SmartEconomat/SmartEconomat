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
import { useTranslation } from 'react-i18next';

/** Contrato de tipos público (PageToolbarProps). Contexto: smart-economat-frontend (SPA). */
export interface PageToolbarProps {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  title?: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  icon?: React.ReactNode;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  searchValue?: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  onSearchChange?: (value: string) => void;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  searchPlaceholder?: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  searchId?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    id?: string;
    disabled?: boolean;
    isLoading?: boolean;
  };
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    id?: string;
    disabled?: boolean;
    isLoading?: boolean;
  };
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  filters?: React.ReactNode;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  totalItems?: number;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  totalItemsLabel?: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  viewMode?: 'list' | 'grid';
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  onViewModeChange?: (mode: 'list' | 'grid') => void;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  onScanBarcode?: () => void; // Added onScanBarcode prop
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  autoFocusSearch?: boolean;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
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
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  id?: string;
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
const PageToolbar: React.FC<PageToolbarProps> = ({
  title,
  icon,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  searchId = 'page-search',
  primaryAction,
  secondaryAction,
  filters,
  totalItems,
  totalItemsLabel = 'elementos',
  viewMode,
  onViewModeChange,
  onScanBarcode, // Added onScanBarcode to destructuring
  autoFocusSearch = false,
  sticky = true,
  extraActions = [],
  id,
}) => {
  const { t } = useTranslation();

  const resolvedSearchPlaceholder = searchPlaceholder || t('comun.buscar');
  const resolvedTotalItemsLabel = totalItemsLabel || t('comun.elementos');

  const { isMobile, isTabletOrBelow } = useBreakpoints();
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = React.useState(true);

  const hasFiltersOrSearch = onSearchChange || filters;
  const extraActionsInFilterRow =
    extraActions.length > 0 && Boolean(hasFiltersOrSearch);

  const renderExtraActionButtons = () =>
    extraActions.map((action) => (
      <React.Fragment key={action.id || action.label}>
        {isTabletOrBelow ? (
          <Tooltip title={action.label}>
            <span>
              <IconButton
                id={action.id}
                data-testid={action.id}
                onClick={action.onClick}
                disabled={action.disabled || action.isLoading}
                color={action.color || 'primary'}
                sx={{
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  width: isMobile ? 36 : 40,
                  height: isMobile ? 36 : 40,
                  borderRadius: 2,
                }}
              >
                {action.isLoading ? (
                  <CircularProgress size={isMobile ? 18 : 20} color="inherit" />
                ) : (
                  action.icon
                )}
              </IconButton>
            </span>
          </Tooltip>
        ) : (
          <Button
            id={action.id}
            data-testid={action.id}
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
              height: 36,
              px: 1.5,
              fontWeight: 700,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            {action.label}
          </Button>
        )}
      </React.Fragment>
    ));

  const showActionsRowLeft = Boolean(onViewModeChange && viewMode);
  const showActionsRowRight =
    Boolean(primaryAction) ||
    Boolean(secondaryAction) ||
    (extraActions.length > 0 && !extraActionsInFilterRow);
  const showActionsRow = showActionsRowLeft || showActionsRowRight;

  return (
    <Paper
      id={id}
      elevation={0}
      component="section"
      aria-label={
        title
          ? t('layout.pageToolbar.ariaConTitulo', { titulo: title })
          : t('layout.pageToolbar.ariaSinTitulo')
      }
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
                <Tooltip
                  title={`${t('comun.total')} de ${resolvedTotalItemsLabel}: ${totalItems}`}
                >
                  <Chip
                    icon={
                      <CheckCircleIcon sx={{ fontSize: '14px !important' }} />
                    }
                    label={
                      <>
                        {t('comun.total')}: <strong>{totalItems}</strong>
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
                  label={`${t('comun.total')}: ${totalItems}`}
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
                data-testid={searchId}
                placeholder={resolvedSearchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                size="small"
                autoFocus={autoFocusSearch}
                fullWidth
                sx={{
                  flex: { xs: '1 1 100%', sm: '1 1 200px' },
                  width: { xs: '100%', sm: 'auto' },
                  minWidth: { sm: 200 },
                  maxWidth: { sm: '100%' },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: 'background.paper',
                  },
                }}
                slotProps={{
                  htmlInput: {
                    'aria-label': resolvedSearchPlaceholder,
                  },
                  input: {
                    startAdornment: onScanBarcode && (
                      <InputAdornment position="start">
                        <Tooltip title={t('comun.escanearCamara')}>
                          <IconButton
                            size="small"
                            onClick={onScanBarcode}
                            aria-label={t('comun.escanearCodigo')}
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
                              aria-label={t('comun.limpiarBusqueda')}
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
                    flex: { xs: '1 1 100%', sm: '0 1 auto' },
                    display: 'flex',
                    width: { xs: '100%', sm: 'auto' },
                    minWidth: 0,
                    '& > *': { width: { xs: '100%', sm: '100%' } },
                  }}
                >
                  {filters}
                </Box>
              )}
              {extraActionsInFilterRow && (
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 1.25,
                    flex: { xs: '1 1 100%', sm: '0 0 auto' },
                    width: { xs: '100%', sm: 'auto' },
                    justifyContent: { xs: 'flex-start', sm: 'flex-end' },
                    ml: { xs: 0, sm: 'auto' },
                  }}
                >
                  {renderExtraActionButtons()}
                </Box>
              )}
            </Box>
          </Collapse>
        )}

        {/* FILA 3: ACCIONES Y CONTROLES */}
        {showActionsRow && (
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
                  <ToggleButton
                    value="list"
                    aria-label={t('layout.pageToolbar.vistaLista')}
                  >
                    <ViewListIcon fontSize="small" />
                  </ToggleButton>
                  <ToggleButton
                    value="grid"
                    aria-label={t('layout.pageToolbar.vistaCuadricula')}
                  >
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
              {!extraActionsInFilterRow && renderExtraActionButtons()}

              {primaryAction && (
                <>
                  {isTabletOrBelow ? (
                    <Tooltip title={primaryAction.label}>
                      <span>
                        <IconButton
                          id={primaryAction.id}
                          data-testid={primaryAction.id}
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
                      </span>
                    </Tooltip>
                  ) : (
                    <Button
                      id={primaryAction.id}
                      data-testid={primaryAction.id}
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
                      disabled={
                        primaryAction.disabled || primaryAction.isLoading
                      }
                      sx={{
                        borderRadius: 2,
                        height: 36,
                        px: 1.5,
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                        bgcolor: 'primary.main',
                        '&:hover': { bgcolor: 'primary.dark' },
                      }}
                    >
                      {primaryAction.label}
                    </Button>
                  )}
                </>
              )}

              {secondaryAction && (
                <>
                  {isTabletOrBelow ? (
                    <Tooltip title={secondaryAction.label}>
                      <span>
                        <IconButton
                          id={secondaryAction.id}
                          data-testid={secondaryAction.id}
                          onClick={secondaryAction.onClick}
                          disabled={secondaryAction.disabled}
                          sx={{
                            border: '1px solid',
                            borderColor: 'divider',
                            color: 'text.secondary',
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.08),
                              borderColor: 'primary.main',
                              color: 'primary.main',
                            },
                            width: isMobile ? 36 : 40,
                            height: isMobile ? 36 : 40,
                            borderRadius: 2,
                          }}
                        >
                          {secondaryAction.icon || <AddIcon />}
                        </IconButton>
                      </span>
                    </Tooltip>
                  ) : (
                    <Button
                      id={secondaryAction.id}
                      data-testid={secondaryAction.id}
                      variant="outlined"
                      size="small"
                      startIcon={
                        secondaryAction.isLoading ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          secondaryAction.icon || <AddIcon />
                        )
                      }
                      onClick={secondaryAction.onClick}
                      disabled={
                        secondaryAction.disabled || secondaryAction.isLoading
                      }
                      sx={{
                        borderRadius: 2,
                        height: 36,
                        px: 1.5,
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {secondaryAction.label}
                    </Button>
                  )}
                </>
              )}
            </Box>
          </Box>
        )}

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
              aria-label={
                isExpanded
                  ? t('comun.ocultarFiltros')
                  : t('comun.mostrarFiltros')
              }
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
