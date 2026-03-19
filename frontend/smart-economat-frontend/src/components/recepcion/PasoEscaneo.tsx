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
import {
  RecepcionDraft,
  EstadoVisualProducto,
} from '../../services/recepcion.types';

interface PasoEscaneoProps {
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearch: () => void;
  searching: boolean;
  isScaleSupported: boolean;
  isScaleConnected: boolean;
  isScaleEnabled: boolean;
  setIsScaleEnabled: (enabled: boolean) => void;
  isScaleBusy: boolean;
  onRequestScaleAccess: () => void;
  draft: RecepcionDraft;
  setDraft: React.Dispatch<React.SetStateAction<RecepcionDraft>>;
  expandedPanel: string | false;
  setExpandedPanel: (panel: string | false) => void;
  onUpdateLinea: (
    pIdx: number | null,
    lIdx: number,
    field: string,
    value: string | number | boolean | undefined
  ) => void;
  isWeightUnit: (u: string | undefined) => boolean;
  onOpenWeightScale: (pIdx: number | null, lIdx: number) => void;
}

const handleNumberInputKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
  if (['e', 'E', '+', '-'].includes(e.key)) {
    e.preventDefault();
  }
};

const formatNumberInput = (value: string) => {
  let val = value.replace(/-/g, ''); // Fix against pasting negative numbers
  if (val.length > 1 && val.startsWith('0') && !val.startsWith('0.')) {
    val = val.replace(/^0+/, '');
    if (val === '') val = '0';
  }
  return val;
};

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
  const [scannerOpen, setScannerOpen] = React.useState(false);

  const handleBarcodeScan = (code: string) => {
    setSearchQuery(code);
    // Usamos un pequeño timeout para asegurar que el estado se actualice antes de buscar
    setTimeout(() => {
      onSearch();
    }, 100);
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
            label="Escanear Código de Barras o ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
            placeholder="EAN-13 o ID de bulto..."
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Escanear con cámara">
                    <IconButton
                      onClick={() => setScannerOpen(true)}
                      size="small"
                      color="primary"
                    >
                      <BarcodeIcon />
                    </IconButton>
                  </Tooltip>
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
            title="Escanear Producto"
          />
        </Box>

        <Box
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
            Opciones de báscula
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
                {isScaleConnected ? 'Cambiar puerto' : 'Vincular'}
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
                  Usar báscula
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
                ({p.lineas.filter((l) => Number(l.cantidadRecibida) > 0).length}{' '}
                ítems recibidos)
              </Typography>
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0, pb: 2 }}>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ tableLayout: 'fixed', minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '25%' }}>Producto</TableCell>
                    <TableCell align="center" sx={{ width: '7%' }}>
                      Unidad
                    </TableCell>
                    <TableCell align="center" sx={{ width: '8%' }}>
                      Pedida
                    </TableCell>
                    <TableCell align="center" sx={{ width: '15%' }}>
                      Albarán
                    </TableCell>
                    <TableCell align="center" sx={{ width: '15%' }}>
                      Recibida
                    </TableCell>
                    <TableCell sx={{ width: '15%' }}>Estado</TableCell>
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
                            ? `EAN: ${l.codigoBarras}`
                            : 'Sin código'}
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
                          type="number"
                          size="small"
                          value={l.cantidadAlbaran}
                          onKeyDown={handleNumberInputKeyDown}
                          onChange={(e) =>
                            onUpdateLinea(
                              pIdx,
                              lIdx,
                              'cantidadAlbaran',
                              formatNumberInput(e.target.value)
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
                          type="number"
                          size="small"
                          InputProps={{
                            readOnly:
                              isWeightUnit(l.unidad) &&
                              isScaleConnected &&
                              isScaleEnabled,
                            inputProps: { min: 0 },
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
                          onKeyDown={handleNumberInputKeyDown}
                          onChange={(e) =>
                            onUpdateLinea(
                              pIdx,
                              lIdx,
                              'cantidadRecibida',
                              formatNumberInput(e.target.value)
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
            Especial / Fuera de Pedido 🆕
          </Typography>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ tableLayout: 'fixed', minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '25%' }}>Producto</TableCell>
                  <TableCell align="center" sx={{ width: '8%' }}>
                    Unidad
                  </TableCell>
                  <TableCell align="right" sx={{ width: '17%' }}>
                    Albarán
                  </TableCell>
                  <TableCell align="right" sx={{ width: '20%' }}>
                    Recibida
                  </TableCell>
                  <TableCell sx={{ width: '15%' }}>Físico</TableCell>
                  <TableCell align="center" sx={{ width: '15%' }}>
                    Acción
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
                          ? `EAN: ${l.codigoBarras}`
                          : 'Sin código'}
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
                        type="number"
                        size="small"
                        value={l.cantidadAlbaran}
                        onKeyDown={handleNumberInputKeyDown}
                        onChange={(e) =>
                          onUpdateLinea(
                            null,
                            lIdx,
                            'cantidadAlbaran',
                            formatNumberInput(e.target.value)
                          )
                        }
                        InputProps={{
                          inputProps: { min: 0 },
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
                        type="number"
                        size="small"
                        InputProps={{
                          readOnly:
                            isWeightUnit(l.unidad) &&
                            isScaleConnected &&
                            isScaleEnabled,
                          inputProps: { min: 0 },
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
                        onKeyDown={handleNumberInputKeyDown}
                        onChange={(e) =>
                          onUpdateLinea(
                            null,
                            lIdx,
                            'cantidadRecibida',
                            formatNumberInput(e.target.value)
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
                      <StatusChip status="Nuevo" />
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
