import React from 'react';
import {
  Box,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Typography,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  InputAdornment,
  IconButton,
  FormControl,
  Select,
  MenuItem,
  Paper,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import BarcodeIcon from '../ui/BarcodeIcon';
import StatusChip from './StatusChip';
import BarcodeScanner from '../ui/BarcodeScanner';
import { Tooltip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  RecepcionDraft,
  EstadoVisualProducto,
} from '../../services/recepcion.types';

/**
 * Propiedades para el componente PasoEscaneo.
 */
interface PasoEscaneoProps {
  /**
  /**
   * Referencia al input de búsqueda para gestión de foco.
   */
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  /**
  /**
   * Texto de búsqueda actual (EAN o nombre).
   */
  searchQuery: string;
  /**
  /**
   * Función para actualizar el texto de búsqueda.
   */
  setSearchQuery: (query: string) => void;
  /**
  /**
   * Callback para iniciar la búsqueda de un producto.
   */
  onSearch: (query?: string | unknown) => void;
  /**
  /**
   * Indica si hay una búsqueda en curso.
   */
  searching: boolean;
  /**
  /**
   * Indica si el navegador soporta Web Serial API para la báscula.
   */
  isScaleSupported: boolean;
  /**
  /**
   * Indica si hay una báscula físicamente conectada y reconocida.
   */
  isScaleConnected: boolean;
  /**
  /**
   * Indica si la integración con báscula está habilitada por el usuario.
   */
  isScaleEnabled: boolean;
  /**
  /**
   * Función para alternar el uso de la báscula.
   */
  setIsScaleEnabled: (enabled: boolean) => void;
  /**
  /**
   * Indica si la báscula está realizando una lectura.
   */
  isScaleBusy: boolean;
  /**
  /**
   * Callback para solicitar permisos de acceso al puerto serie.
   */
  onRequestScaleAccess: () => void;
  /**
  /**
   * Estado actual del borrador de recepción.
   */
  draft: RecepcionDraft;
  /**
  /**
   * Función para actualizar el borrador.
   */
  setDraft: React.Dispatch<React.SetStateAction<RecepcionDraft>>;
  /**
  /**
   * ID del panel expandido.
   */
  expandedPanel: string | false;
  /**
  /**
   * Función para cambiar el panel expandido.
   */
  setExpandedPanel: (panel: string | false) => void;
  /**
  /**
   * Callback para actualizar una línea de producto.
   */
  onUpdateLinea: (
    pIdx: number | null,
    lIdx: number,
    field: string,
    value: string | number | boolean | undefined
  ) => void;
  /**
  /**
   * Determina si una unidad de medida es pesable.
   */
  isWeightUnit: (u: string | undefined) => boolean;
  /**
  /**
   * Abre la interfaz de pesaje para una línea específica.
   */
  onOpenWeightScale: (pIdx: number | null, lIdx: number) => void;
}

import { normalizeNumericInput } from '../../utils/numberUtils';

/**
 * Paso del wizard de recepción encargado del escaneo de productos y registro de cantidades.
 * Soporta entrada manual, escaneo de cámara e integración directa con básculas industriales.
 */
const PasoEscaneo: React.FC<PasoEscaneoProps> = ({
  searchInputRef,
  searchQuery,
  setSearchQuery,
  onSearch,
  searching,
  isScaleSupported,
  isScaleConnected,
  isScaleEnabled,
  setIsScaleEnabled,
  isScaleBusy,
  onRequestScaleAccess,
  draft,
  setDraft,
  expandedPanel,
  setExpandedPanel,
  onUpdateLinea,
  isWeightUnit,
  onOpenWeightScale,
}) => {
  const { t } = useTranslation();
  const [scannerOpen, setScannerOpen] = React.useState(false);

  /**
   * Gestiona el resultado de un escaneo de código de barras.
   * @param {string} code - Código detectado
   */
  const handleBarcodeScan = (code: string) => {
    setSearchQuery(code);
    onSearch(code);
  };

  return (
    <Box>
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          pb: 2,
          display: 'flex',
          gap: 2,
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: 'stretch',
        }}
      >
        <Box
          id="search-recepcion-productos"
          sx={{
            display: 'flex',
            flex: 1,
            gap: 2,
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
          }}
        >
          <TextField
            inputRef={searchInputRef}
            fullWidth
            autoFocus
            label={t('recepcion.escaneo.titulo')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
            placeholder={t('recepcion.escaneo.placeholder')}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Tooltip title={t('recepcion.acciones.escanearCamara')}>
                    <IconButton
                      onClick={() => setScannerOpen(true)}
                      size="small"
                      color="primary"
                      sx={{
                        '&:hover': {
                          bgcolor: 'rgba(216, 27, 96, 0.1)',
                          borderRadius: 1,
                        },
                        p: 0.5,
                        ml: -0.5,
                      }}
                    >
                      <BarcodeIcon />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  {searching ? (
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                  ) : (
                    <IconButton
                      onClick={onSearch}
                      onMouseDown={(e) => e.preventDefault()}
                      disabled={searching}
                      size="small"
                      color="primary"
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'primary.dark',
                        },
                        borderRadius: 1,
                        p: 0.5,
                        mr: -0.5,
                      }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  )}
                </InputAdornment>
              ),
            }}
          />
          <BarcodeScanner
            open={scannerOpen}
            onClose={() => setScannerOpen(false)}
            onScan={handleBarcodeScan}
            title={t('recepcion.escaneo.escanearProducto')}
            continuous={true}
          />
        </Box>

        <Box
          id="scale-options-container"
          sx={{
            position: 'relative',
            width: { xs: '100%', sm: '44%', md: '380px' },
            flexShrink: 0,
            px: 2,
            py: { xs: 1, sm: 0 },
            height: { sm: 56 },
            border: '1px solid',
            borderColor:
              isScaleEnabled && isScaleConnected ? 'success.main' : 'divider',
            borderRadius: 2,
            bgcolor: 'background.paper',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Typography
            component="span"
            sx={{
              position: 'absolute',
              top: -9,
              left: 12,
              px: 1,
              bgcolor: 'background.paper',
              color:
                isScaleEnabled && isScaleConnected
                  ? 'success.main'
                  : 'primary.main',
              fontSize: '0.75rem',
              fontWeight: 400,
              lineHeight: 1,
              letterSpacing: '0.00938em',
            }}
          >
            {t('recepcion.escaneo.opcionesBascula')}
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems="center"
            justifyContent="center"
            sx={{ height: '100%', width: '100%' }}
          >
            <Stack direction="row" justifyContent="center" sx={{ minWidth: 0 }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={onRequestScaleAccess}
                disabled={!isScaleSupported || isScaleBusy}
                size="small"
                sx={{
                  minWidth: { xs: '100%', sm: 120 },
                  alignSelf: { xs: 'stretch', sm: 'center' },
                  borderRadius: 1.5,
                  textTransform: 'none',
                }}
              >
                {isScaleConnected
                  ? t('recepcion.bascula.cambiarPuerto')
                  : t('recepcion.bascula.vincular')}
              </Button>
            </Stack>

            <FormControlLabel
              control={
                <Switch
                  checked={isScaleEnabled && isScaleConnected}
                  onChange={(e) => setIsScaleEnabled(e.target.checked)}
                  disabled={!isScaleConnected}
                  size="small"
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: 'success.main',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: 'success.main',
                    },
                  }}
                />
              }
              label={
                <Typography
                  variant="caption"
                  sx={{
                    whiteSpace: 'nowrap',
                    color:
                      isScaleEnabled && isScaleConnected
                        ? 'success.main'
                        : 'text.secondary',
                    fontWeight: isScaleEnabled && isScaleConnected ? 600 : 500,
                  }}
                >
                  {t('recepcion.escaneo.usarBascula')}
                </Typography>
              }
              sx={{
                ml: 0,
                mr: 0,
                alignSelf: { xs: 'flex-start', sm: 'center' },
              }}
            />
          </Stack>
        </Box>
      </Box>

      {draft.pedidosSeleccionados.map((p, pIdx) => (
        <Accordion
          key={p.id}
          expanded={
            expandedPanel === false ? pIdx === 0 : expandedPanel === p.id
          }
          onChange={(e, isExpanded) =>
            setExpandedPanel(isExpanded ? p.id : 'none')
          }
          TransitionProps={{ unmountOnExit: true }}
          elevation={0}
          sx={{
            mb: 2,
            border: 1,
            borderColor: 'divider',
            '&:before': { display: 'none' },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2" color="primary">
              {p.proveedor}
              <Typography
                component="span"
                variant="caption"
                sx={{ ml: 1, color: 'text.secondary' }}
              >
                (
                {t('recepcion.escaneo.itemsRecibidos', {
                  count: p.lineas.filter((l) => Number(l.cantidadRecibida) > 0)
                    .length,
                })}
                )
              </Typography>
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0, pb: 2 }}>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ tableLayout: 'fixed', minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '25%' }}>
                      {t('comun.producto')}
                    </TableCell>
                    <TableCell align="center" sx={{ width: '7%' }}>
                      {t('comun.unidad')}
                    </TableCell>
                    <TableCell align="center" sx={{ width: '8%' }}>
                      {t('recepcion.escaneo.pedida')}
                    </TableCell>
                    <TableCell align="center" sx={{ width: '15%' }}>
                      {t('recepcion.escaneo.albaran')}
                    </TableCell>
                    <TableCell align="center" sx={{ width: '15%' }}>
                      {t('recepcion.escaneo.recibida')}
                    </TableCell>
                    <TableCell sx={{ width: '15%' }}>
                      {t('comun.estado')}
                    </TableCell>
                    <TableCell align="center" sx={{ width: '15%' }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {p.lineas.map((l, lIdx) => (
                    <TableRow key={l.pedidoProductoId} hover>
                      <TableCell
                        sx={{
                          lineHeight: 1.2,
                          whiteSpace: 'normal',
                          wordWrap: 'break-word',
                          p: 1,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 500, display: 'block' }}
                        >
                          {l.nombreProducto}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: 'text.secondary', display: 'block' }}
                        >
                          {l.codigoBarras
                            ? `${t('recepcion.escaneo.ean')}: ${l.codigoBarras}`
                            : t('recepcion.escaneo.sinCodigo')}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography
                          variant="caption"
                          sx={{ color: 'text.secondary' }}
                        >
                          {l.unidad}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{l.cantidadPedida}</TableCell>
                      <TableCell align="right">
                        <TextField
                          type="text"
                          size="small"
                          value={l.cantidadAlbaran}
                          onChange={(e) =>
                            onUpdateLinea(
                              pIdx,
                              lIdx,
                              'cantidadAlbaran',
                              normalizeNumericInput(e.target.value)
                            )
                          }
                          InputProps={{
                            inputProps: { min: 0 },
                            startAdornment:
                              l.cantidadAlbaran !== '' &&
                              l.cantidadAlbaran != null ? (
                                <InputAdornment position="start">
                                  {Number(l.cantidadAlbaran) ===
                                  l.cantidadPedida ? (
                                    <CheckCircleIcon
                                      color="success"
                                      fontSize="small"
                                    />
                                  ) : Number(l.cantidadAlbaran) <
                                    l.cantidadPedida ? (
                                    <WarningAmberIcon
                                      color="warning"
                                      fontSize="small"
                                    />
                                  ) : (
                                    <InfoOutlinedIcon
                                      color="info"
                                      fontSize="small"
                                    />
                                  )}
                                </InputAdornment>
                              ) : null,
                          }}
                          sx={{
                            minWidth: 110,
                            maxWidth: 130,
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: (theme) => {
                                if (
                                  l.cantidadAlbaran === '' ||
                                  l.cantidadAlbaran == null
                                )
                                  return undefined;
                                const numAlbaran = Number(l.cantidadAlbaran);
                                if (numAlbaran === l.cantidadPedida)
                                  return theme.palette.success.main;
                                if (numAlbaran < l.cantidadPedida)
                                  return theme.palette.warning.main;
                                return theme.palette.info.main;
                              },
                              borderWidth:
                                l.cantidadAlbaran !== '' &&
                                l.cantidadAlbaran != null
                                  ? 2
                                  : undefined,
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          type="text"
                          size="small"
                          InputProps={{
                            readOnly:
                              isWeightUnit(l.unidad) &&
                              isScaleConnected &&
                              isScaleEnabled,
                            inputProps: {
                              inputMode: 'decimal',
                              pattern: '[0-9]*[.,]?[0-9]*',
                            },
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onUpdateLinea(
                                      pIdx,
                                      lIdx,
                                      'cantidadRecibida',
                                      ''
                                    );
                                  }}
                                  edge="end"
                                >
                                  <ClearIcon fontSize="small" />
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          value={l.cantidadRecibida}
                          onClick={() => {
                            if (
                              isWeightUnit(l.unidad) &&
                              isScaleConnected &&
                              isScaleEnabled
                            ) {
                              onOpenWeightScale(pIdx, lIdx);
                            }
                          }}
                          onChange={(e) =>
                            onUpdateLinea(
                              pIdx,
                              lIdx,
                              'cantidadRecibida',
                              normalizeNumericInput(e.target.value)
                            )
                          }
                          sx={{
                            minWidth: 110,
                            maxWidth: 130,
                            cursor:
                              isWeightUnit(l.unidad) &&
                              isScaleConnected &&
                              isScaleEnabled
                                ? 'pointer'
                                : 'text',
                            '& .MuiInputBase-root': {
                              backgroundColor:
                                isWeightUnit(l.unidad) &&
                                isScaleConnected &&
                                isScaleEnabled
                                  ? 'rgba(76, 175, 80, 0.15)'
                                  : 'inherit',
                              border:
                                isWeightUnit(l.unidad) &&
                                isScaleConnected &&
                                isScaleEnabled
                                  ? '1px solid #4CAF50'
                                  : 'none',
                              color:
                                isWeightUnit(l.unidad) &&
                                isScaleConnected &&
                                isScaleEnabled
                                  ? '#4CAF50'
                                  : 'inherit',
                            },
                            '& .MuiInputBase-input': {
                              cursor:
                                isWeightUnit(l.unidad) &&
                                isScaleConnected &&
                                isScaleEnabled
                                  ? 'pointer'
                                  : 'inherit',
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" fullWidth>
                          <Select
                            value={
                              l.estadoVisual || EstadoVisualProducto.OPTIMO
                            }
                            MenuProps={{
                              disableScrollLock: true,
                            }}
                            onChange={(e) =>
                              onUpdateLinea(
                                pIdx,
                                lIdx,
                                'estadoVisual',
                                e.target.value
                              )
                            }
                            sx={{ fontSize: '0.8rem' }}
                          >
                            <MenuItem value={EstadoVisualProducto.OPTIMO}>
                              {t('recepcion.escaneo.estadoOptimo')}
                            </MenuItem>
                            <MenuItem value={EstadoVisualProducto.ROTO}>
                              {t('recepcion.escaneo.estadoRoto')}
                            </MenuItem>
                            <MenuItem value={EstadoVisualProducto.DEFECTUOSO}>
                              {t('recepcion.escaneo.estadoDefecto')}
                            </MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell align="center">
                        <StatusChip status={l.estado as string} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      ))}

      {draft.productosEspontaneos.length > 0 && (
        <Paper sx={{ p: 2, bgcolor: 'background.default' }} elevation={0}>
          <Typography variant="subtitle2" color="secondary">
            {t('recepcion.escaneo.fueraDePedido')} 🆕
          </Typography>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ tableLayout: 'fixed', minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '25%' }}>
                    {t('comun.producto')}
                  </TableCell>
                  <TableCell align="center" sx={{ width: '8%' }}>
                    {t('comun.unidad')}
                  </TableCell>
                  <TableCell align="right" sx={{ width: '17%' }}>
                    {t('recepcion.escaneo.albaran')}
                  </TableCell>
                  <TableCell align="right" sx={{ width: '20%' }}>
                    {t('recepcion.escaneo.recibida')}
                  </TableCell>
                  <TableCell sx={{ width: '15%' }}>
                    {t('recepcion.escaneo.fisico')}
                  </TableCell>
                  <TableCell align="center" sx={{ width: '15%' }}>
                    {t('comun.accion')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {draft.productosEspontaneos.map((l, lIdx) => (
                  <TableRow key={lIdx}>
                    <TableCell
                      sx={{
                        lineHeight: 1.2,
                        whiteSpace: 'normal',
                        wordWrap: 'break-word',
                        p: 1,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, display: 'block' }}
                      >
                        {l.nombreProducto}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary', display: 'block' }}
                      >
                        {l.codigoBarras
                          ? `${t('recepcion.escaneo.ean')}: ${l.codigoBarras}`
                          : t('recepcion.escaneo.sinCodigo')}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary' }}
                      >
                        {l.unidad}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="text"
                        size="small"
                        value={l.cantidadAlbaran}
                        onChange={(e) =>
                          onUpdateLinea(
                            null,
                            lIdx,
                            'cantidadAlbaran',
                            normalizeNumericInput(e.target.value)
                          )
                        }
                        InputProps={{
                          inputProps: {
                            inputMode: 'decimal',
                            pattern: '[0-9]*[.,]?[0-9]*',
                          },
                          startAdornment:
                            l.cantidadAlbaran !== '' &&
                            l.cantidadAlbaran != null ? (
                              <InputAdornment position="start">
                                <InfoOutlinedIcon
                                  color="info"
                                  fontSize="small"
                                />
                              </InputAdornment>
                            ) : null,
                        }}
                        sx={{
                          minWidth: 110,
                          maxWidth: 130,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: (theme) => {
                              if (
                                l.cantidadAlbaran === '' ||
                                l.cantidadAlbaran == null
                              )
                                return undefined;
                              return theme.palette.info.main; // Es espontáneo, siempre es exceso sobre lo pedido
                            },
                            borderWidth:
                              l.cantidadAlbaran !== '' &&
                              l.cantidadAlbaran != null
                                ? 2
                                : undefined,
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        type="text"
                        size="small"
                        InputProps={{
                          readOnly:
                            isWeightUnit(l.unidad) &&
                            isScaleConnected &&
                            isScaleEnabled,
                          inputProps: {
                            inputMode: 'decimal',
                            pattern: '[0-9]*[.,]?[0-9]*',
                          },
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateLinea(
                                    null,
                                    lIdx,
                                    'cantidadRecibida',
                                    ''
                                  );
                                }}
                                edge="end"
                              >
                                <ClearIcon fontSize="small" />
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        value={l.cantidadRecibida}
                        onClick={() => {
                          if (
                            isWeightUnit(l.unidad) &&
                            isScaleConnected &&
                            isScaleEnabled
                          ) {
                            onOpenWeightScale(null, lIdx);
                          }
                        }}
                        onChange={(e) =>
                          onUpdateLinea(
                            null,
                            lIdx,
                            'cantidadRecibida',
                            normalizeNumericInput(e.target.value)
                          )
                        }
                        sx={{
                          minWidth: 110,
                          maxWidth: 130,
                          cursor:
                            isWeightUnit(l.unidad) &&
                            isScaleConnected &&
                            isScaleEnabled
                              ? 'pointer'
                              : 'text',
                          '& .MuiInputBase-root': {
                            backgroundColor:
                              isWeightUnit(l.unidad) &&
                              isScaleConnected &&
                              isScaleEnabled
                                ? 'rgba(76, 175, 80, 0.15)'
                                : 'inherit',
                            border:
                              isWeightUnit(l.unidad) &&
                              isScaleConnected &&
                              isScaleEnabled
                                ? '1px solid #4CAF50'
                                : 'none',
                            color:
                              isWeightUnit(l.unidad) &&
                              isScaleConnected &&
                              isScaleEnabled
                                ? '#4CAF50'
                                : 'inherit',
                          },
                          '& .MuiInputBase-input': {
                            cursor:
                              isWeightUnit(l.unidad) &&
                              isScaleConnected &&
                              isScaleEnabled
                                ? 'pointer'
                                : 'inherit',
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={l.estadoVisual || EstadoVisualProducto.OPTIMO}
                          MenuProps={{
                            disableScrollLock: true,
                          }}
                          onChange={(e) =>
                            onUpdateLinea(
                              null,
                              lIdx,
                              'estadoVisual',
                              e.target.value
                            )
                          }
                          sx={{ fontSize: '0.8rem' }}
                        >
                          <MenuItem value={EstadoVisualProducto.OPTIMO}>
                            Óptimo
                          </MenuItem>
                          <MenuItem value={EstadoVisualProducto.ROTO}>
                            Roto
                          </MenuItem>
                          <MenuItem value={EstadoVisualProducto.DEFECTUOSO}>
                            Defecto
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell align="center">
                      <StatusChip status={t('recepcion.escaneo.nuevo')} />
                      <IconButton
                        size="small"
                        onClick={() => {
                          const newEsp = draft.productosEspontaneos.filter(
                            (_, i) => i !== lIdx
                          );
                          setDraft({ ...draft, productosEspontaneos: newEsp });
                        }}
                      >
                        <DeleteIcon color="error" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
};

export default PasoEscaneo;
