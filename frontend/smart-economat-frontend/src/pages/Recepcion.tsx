import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  Alert,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Checkbox,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  IconButton,
  Tooltip,
  Snackbar,
  Backdrop,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SaveIcon from '@mui/icons-material/Save';

import {
  RecepcionDraft,
  LineaDraft,
  PasoWizard,
  RecepcionResultado,
  EstadoVisualProducto,
} from '../services/recepcion.types';
import { createRecepcion } from '../services/recepcion.service';
import { fetchPedidos } from '../services/pedido.service';
import { Pedido, EstadoPedido } from '../services/pedido.types';
import {
  getProductoByBarcode,
  searchProductosByName,
} from '../services/producto.service';
import { useAuth } from '../store/AuthContext';
import {
  CategoriaProducto,
  UnidadMedida,
} from '../services/producto.types';

const steps = [
  'Selección de Pedidos',
  'Escaneo y Conteo',
  'Revisión y Ajuste',
  'Resultado',
];

const LOCAL_STORAGE_KEY = 'recepcion_draft_v2';

const defaultDraft = (): RecepcionDraft => ({
  version: 2,
  creadoEn: new Date().toISOString(),
  modificadoEn: new Date().toISOString(),
  observaciones: '',
  nAlbaran: '',
  pedidosSeleccionados: [],
  productosEspontaneos: [],
  paso: 'SELECCION_PEDIDOS',
  erroresPorLinea: {},
  enviando: false,
});

const Recepcion: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [draft, setDraft] = useState<RecepcionDraft>(defaultDraft());
  const [resultado, setResultado] = useState<RecepcionResultado | null>(null);
  
  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);
  const [expandedPanel, setExpandedPanel] = useState<string | false>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeStep === 1 && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [activeStep]);

  // Data
  const [pedidosDisponibles, setPedidosDisponibles] = useState<Pedido[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const { user } = useAuth();

  // Ref for persistence logic
  const draftRef = useRef(draft);
  useEffect(() => { draftRef.current = draft; }, [draft]);

  // --- 1. Persistencia Robusta ---
  
  // Restaurar al inicio
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Validar antigüedad (ej. > 24h descartar)
        const diff = Date.now() - new Date(parsed.modificadoEn).getTime();
        if (diff < 24 * 60 * 60 * 1000) {
           setDraft(parsed);
           const stepIdx = ['SELECCION_PEDIDOS', 'ESCANEO_LOTE', 'REVISION_FINAL', 'RESULTADO'].indexOf(parsed.paso);
           if (stepIdx >= 0) setActiveStep(stepIdx);
        }
      } catch (e) {
        console.error("Error al cargar draft", e);
      }
    }
    
    // Cargar pedidos
    loadPedidos();
  }, []);

  // Guardar con Throttle (simplificado con setTimeout para el ejercicio)
  useEffect(() => {
    if (activeStep === 3) return; // No guardar el paso de resultado

    setAutoSaveStatus('saving');
    const timer = setTimeout(() => {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
        ...draft,
        modificadoEn: new Date().toISOString()
      }));
      setAutoSaveStatus('saved');
    }, 1000);

    return () => clearTimeout(timer);
  }, [draft, activeStep]);

  // Listener beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (activeStep > 0 && activeStep < 3) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(draftRef.current));
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeStep]);


  // --- 2. Acciones del Backend ---

  const loadPedidos = async () => {
    setLoadingPedidos(true);
    try {
      const resp = await fetchPedidos(1, 100);
      // Solo pedidos pendientes, en proceso o parciales
      setPedidosDisponibles(resp.data.filter((p: Pedido) => 
        p.estado === EstadoPedido.PENDIENTE || 
        p.estado === EstadoPedido.EN_PROCESO || 
        p.estado === EstadoPedido.PARCIAL
      ));
    } catch (err) {
      setError('Error al cargar pedidos compatibles.');
    } finally {
      setLoadingPedidos(false);
    }
  };

  const mapPedidoToDraft = (pedido: Pedido): any => ({
    id: pedido.id,
    descripcion: `Pedido ${pedido.id.substring(0,8)} - ${pedido.proveedor?.nombre}`,
    proveedor: pedido.proveedor?.nombre || 'Desconocido',
    lineas: (pedido.pedidoProductos || []).map((pp: any) => ({
      pedidoProductoId: pp.id,
      idProducto: pp.productoProveedor?.producto?.id,
      codigoBarras: pp.productoProveedor?.producto?.codigoBarras,
      nombreProducto: pp.productoProveedor?.producto?.nombre || 'Producto',
      unidad: pp.productoProveedor?.producto?.unidad || 'unidades',
      cantidadPedida: Number(pp.cantidad),
      cantidadRecibida: 0,
      estadoVisual: EstadoVisualProducto.OPTIMO,
      fechaCaducidad: '',
      observaciones: '',
      estado: calculateEstado(0, Number(pp.cantidad))
    }))
  });

  const handleSelectAll = () => {
    const newDraftPedidos = [...draft.pedidosSeleccionados];
    pedidosDisponibles.forEach((pedido) => {
      if (!newDraftPedidos.some((p) => p.id === pedido.id)) {
        newDraftPedidos.push(mapPedidoToDraft(pedido));
      }
    });
    setDraft({ ...draft, pedidosSeleccionados: newDraftPedidos });
  };

  const handleDeselectAll = () => {
    setDraft({ ...draft, pedidosSeleccionados: [] });
  };

  const handleSelectProvider = (e: any) => {
    const providerName = e.target.value;
    if (!providerName) return;

    const pedidosDelProveedor = pedidosDisponibles.filter(
      (p) => p.proveedor?.nombre === providerName
    );

    const newDraftPedidos = [...draft.pedidosSeleccionados];
    
    pedidosDelProveedor.forEach((pedido) => {
      if (!newDraftPedidos.some((p) => p.id === pedido.id)) {
        newDraftPedidos.push(mapPedidoToDraft(pedido));
      }
    });

    setDraft({ ...draft, pedidosSeleccionados: newDraftPedidos });
  };

  const handleDeselectProvider = (e: any) => {
    const providerName = e.target.value;
    if (!providerName) return;

    const newDraftPedidos = draft.pedidosSeleccionados.filter(
      (p) => p.proveedor !== providerName
    );

    setDraft({ ...draft, pedidosSeleccionados: newDraftPedidos });
  };

  const handleTogglePedido = (pedido: Pedido) => {
    const isSelected = draft.pedidosSeleccionados.some(p => p.id === pedido.id);
    let newPedidos = [...draft.pedidosSeleccionados];

    if (isSelected) {
      newPedidos = newPedidos.filter(p => p.id !== pedido.id);
    } else {
      newPedidos.push(mapPedidoToDraft(pedido));
    }

    setDraft({ ...draft, pedidosSeleccionados: newPedidos });
  };


  // --- 3. Lógica de Escaneo (Paso 2) ---

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError(null);

    try {
      // 1. Intentar por código de barras
      let prod = await getProductoByBarcode(searchQuery);
      
      // 2. Si no hay barcode, intentar búsqueda por nombre (Buscador)
      if (!prod) {
        const results = await searchProductosByName(searchQuery);
        if (results.length === 1) {
          prod = results[0];
        } else if (results.length > 1) {
           // Si hay varios, podríamos mostrar un selector, pero por ahora abrimos modal
           // con el primer resultado sugerido o dejamos al usuario crear
           setOpenModal(true);
           setSearching(false);
           return;
        }
      }

      if (prod) {
        processProductFound(prod);
      } else {
        // No encontrado -> Modal creación
        setOpenModal(true);
      }
    } catch (e) {
      setOpenModal(true);
    } finally {
      setSearching(false);
      setSearchQuery('');
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }
  };

  const processProductFound = (prod: any) => {
    let foundInPedidos = false;
    let foundPedidoId: string | null = null;
    let unitAdded = false;

    const newPedidos = [...draft.pedidosSeleccionados].map(p => ({
      ...p,
      lineas: [...p.lineas]
    }));

    // 1. Array de coincidencias en los pedidos seleccionados
    const matches: { pIdx: number; lIdx: number; l: any }[] = [];
    newPedidos.forEach((p, pIdx) => {
      p.lineas.forEach((l, lIdx) => {
        const matchId = l.idProducto === prod.id;
        const matchBarcode = l.codigoBarras === prod.codigoBarras && prod.codigoBarras;
        const matchName = l.nombreProducto.toLowerCase() === prod.nombre.toLowerCase();

        if (matchId || matchBarcode || matchName) {
           matches.push({ pIdx, lIdx, l });
        }
      });
    });

    if (matches.length > 0) {
      foundInPedidos = true;

      // Buscar si algún match le falta stock
      let targetMatch = matches.find(m => {
        const currRec = m.l.cantidadRecibida === '' ? 0 : Number(m.l.cantidadRecibida);
        return currRec < m.l.cantidadPedida;
      });

      // Si todos los matches ya están llenos, sumar al primer match (exceso)
      if (!targetMatch) {
         targetMatch = matches[0];
      }

      foundPedidoId = newPedidos[targetMatch.pIdx].id;
      const tLinea = newPedidos[targetMatch.pIdx].lineas[targetMatch.lIdx];
      const currRec = tLinea.cantidadRecibida === '' ? 0 : Number(tLinea.cantidadRecibida);
      
      newPedidos[targetMatch.pIdx].lineas[targetMatch.lIdx] = {
        ...tLinea,
        cantidadRecibida: currRec + 1,
        estado: calculateEstado(currRec + 1, tLinea.cantidadPedida)
      };

      setDraft({ ...draft, pedidosSeleccionados: newPedidos });
      if (foundPedidoId) setExpandedPanel(foundPedidoId);
    } else {
      // 2. Si no esta, añadir a espontáneos
      const existingEsp = draft.productosEspontaneos.find(l => 
        l.idProducto === prod.id || 
        (l.codigoBarras === prod.codigoBarras && prod.codigoBarras) ||
        l.nombreProducto.toLowerCase() === prod.nombre.toLowerCase()
      );

      if (existingEsp) {
         const newEsp = draft.productosEspontaneos.map(l => {
           const match = l.idProducto === prod.id || 
                         (l.codigoBarras === prod.codigoBarras && prod.codigoBarras) ||
                         l.nombreProducto.toLowerCase() === prod.nombre.toLowerCase();
           return match
             ? { ...l, cantidadRecibida: Number(l.cantidadRecibida) + 1, estado: '🔵 Exceso' as any } 
             : l;
         });
         setDraft({ ...draft, productosEspontaneos: newEsp });
      } else {
         const newLinea: LineaDraft = {
            pedidoProductoId: null,
            idProducto: prod.id,
            codigoBarras: prod.codigoBarras,
            nombreProducto: prod.nombre,
            unidad: prod.unidad || 'uds',
            cantidadPedida: 0,
            cantidadRecibida: 1,
            estadoVisual: EstadoVisualProducto.OPTIMO,
            fechaCaducidad: '',
            observaciones: '',
            estado: '🆕 Nuevo' as any
         };
         setDraft({ ...draft, productosEspontaneos: [...draft.productosEspontaneos, newLinea] });
      }
    }
  };

  const calculateEstado = (rec: number, ped: number): any => {
    if (rec === 0) return '❌ No entregado';
    if (rec === ped) return '✅ OK';
    if (rec < ped) return '⚠️ Parcial';
    return '🔵 Exceso';
  };

  const handleUpdateLinea = (pIdx: number | null, lIdx: number, field: string, value: any) => {
    if (field === 'cantidadRecibida') {
      const numValue = Number(value);
      value = (!isNaN(numValue) && numValue >= 0) ? numValue : 0;
    }
    if (pIdx !== null) {
      const newPedidos = [...draft.pedidosSeleccionados];
      const linea = { ...newPedidos[pIdx].lineas[lIdx], [field]: value };
      if (field === 'cantidadRecibida') {
        linea.estado = calculateEstado(Number(value), linea.cantidadPedida);
      }
      newPedidos[pIdx].lineas[lIdx] = linea;
      setDraft({ ...draft, pedidosSeleccionados: newPedidos });
    } else {
      const newEsp = [...draft.productosEspontaneos];
      newEsp[lIdx] = { ...newEsp[lIdx], [field]: value };
      setDraft({ ...draft, productosEspontaneos: newEsp });
    }
  };


  // --- 4. Validación y Envío (Paso 3) ---

  const validarDraft = (): boolean => {
    const errores: Record<string, string[]> = {};
    let isValid = true;

    // Al menos 1 producto con cantidad > 0
    const totalItems = draft.pedidosSeleccionados.flatMap(p => p.lineas).concat(draft.productosEspontaneos);
    const hasReception = totalItems.some(l => Number(l.cantidadRecibida) > 0);
    
    if (!hasReception) {
       setError("Debes recepcionar al menos un producto.");
       return false;
    }

    // Validar observaciones si hay discrepancia (negocio)
    draft.pedidosSeleccionados.forEach(p => {
      p.lineas.forEach(l => {
        if (Number(l.cantidadRecibida) !== l.cantidadPedida && !l.observaciones) {
          // No es bloqueante por ahora pero ejemplo de regla
        }
      });
    });

    setDraft({ ...draft, erroresPorLinea: errores });
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validarDraft()) return;

    setIsSubmitting(true);
    setError(null);

    const payload: any = {
      pedidos: draft.pedidosSeleccionados.map(p => ({
         pedidoId: p.id,
         nAlbaran: p.nAlbaran || draft.nAlbaran,
         observaciones: draft.observaciones
      })),
      nAlbaran: draft.nAlbaran,
      observaciones: draft.observaciones,
      productos: draft.pedidosSeleccionados.flatMap(p => p.lineas)
                   .filter(l => Number(l.cantidadRecibida) > 0)
                   .map(l => ({
                      pedidoProductoId: l.pedidoProductoId!,
                      cantidadRecibida: Number(l.cantidadRecibida),
                      estadoVisual: l.estadoVisual,
                      fechaCaducidad: l.fechaCaducidad ? new Date(l.fechaCaducidad) : undefined,
                      observaciones: l.observaciones
                   })),
      productosNuevos: draft.productosEspontaneos.map(p => ({
         pendienteCreacion: true,
         codigoBarras: p.productoNuevo?.codigoBarras || p.codigoBarras || '',
         nombre: p.productoNuevo?.nombre || p.nombreProducto,
         marca: p.productoNuevo?.marca || '',
         unidad: p.productoNuevo?.unidad || p.unidad || UnidadMedida.KG,
         tipo: p.productoNuevo?.tipo || CategoriaProducto.OTRO,
         contenido: p.productoNuevo?.contenido || 1,
         cantidadRecibida: Number(p.cantidadRecibida),
         estadoVisual: p.estadoVisual,
         fechaCaducidad: p.fechaCaducidad ? new Date(p.fechaCaducidad) : undefined,
         observaciones: p.observaciones
      }))
    };

    try {
      const res = await createRecepcion(payload);
      setResultado(res);
      setActiveStep(3);
      // Solo eliminamos el borrador si la operación fue exitosa
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setDraft(defaultDraft()); 
    } catch (err: any) {
      const errorMessage = err.message || '';
      if (errorMessage.includes('Pedido no encontrado') || errorMessage.includes('ORDER_NOT_FOUND')) {
         localStorage.removeItem(LOCAL_STORAGE_KEY);
         setDraft(defaultDraft());
         setActiveStep(0);
         setError(`Error crítico: El pedido que intentabas recepcionar ya no existe o fue procesado. El borrador local obsoleto ha sido eliminado por seguridad. Por favor, selecciona nuevamente los pedidos a recepcionar.`);
      } else {
         setError(`Error crítico en la transacción: ${errorMessage}. Los datos siguen guardados localmente; puedes intentar enviarlos de nuevo.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  // --- 5. Render Helpers ---

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0: return renderStep1();
      case 1: return renderStep2();
      case 2: return renderStep3();
      case 3: return renderStep4();
      default: return null;
    }
  };

  const uniqueProviders = Array.from(
    new Set(pedidosDisponibles.map((p) => p.proveedor?.nombre).filter(Boolean))
  ) as string[];

  const renderStep1 = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Selecciona los pedidos que estás recibiendo</Typography>
      </Box>
      {loadingPedidos ? <CircularProgress /> : (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
            <Button variant="outlined" size="small" onClick={handleSelectAll}>
              Seleccionar Todos
            </Button>
            <Button variant="outlined" size="small" onClick={handleDeselectAll}>
              Deseleccionar Todos
            </Button>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Añadir por Proveedor</InputLabel>
              <Select
                value=""
                label="Añadir por Proveedor"
                onChange={handleSelectProvider}
              >
                <MenuItem value="" disabled>Selecciona un proveedor</MenuItem>
                {uniqueProviders.map(provider => (
                  <MenuItem key={provider} value={provider}>{provider}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Deseleccionar por Prov.</InputLabel>
              <Select
                value=""
                label="Deseleccionar por Prov."
                onChange={handleDeselectProvider}
              >
                <MenuItem value="" disabled>Selecciona un proveedor</MenuItem>
                {uniqueProviders.map(provider => (
                  <MenuItem key={provider} value={provider}>{provider}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <List sx={{ width: '100%', bgcolor: 'background.paper', maxHeight: '55vh', overflow: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
            {pedidosDisponibles.map((pedido) => (
              <ListItem 
                 key={pedido.id} 
                 divider 
                 disablePadding
              >
                <ListItemButton 
                  onClick={() => handleTogglePedido(pedido)}
                  selected={draft.pedidosSeleccionados.some(p => p.id === pedido.id)}
                >
                  <Checkbox checked={draft.pedidosSeleccionados.some(p => p.id === pedido.id)} />
                  <ListItemText 
                    primary={`${pedido.proveedor?.nombre} - Ref: ${pedido.id.substring(0,8)}`}
                    secondary={`Fecha: ${new Date(pedido.fechaPedido).toLocaleDateString()} | Estado: ${pedido.estado}`}
                  />
                  <Chip label={pedido.estado} color={pedido.estado === EstadoPedido.PENDIENTE ? 'primary' : 'warning'} size="small" />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Box>
  );

  const renderStep2 = () => (
    <Box>
      <Box sx={{ position: 'sticky', top: 0, zIndex: 10, bgcolor: 'background.paper', pb: 2, display: 'flex', gap: 2 }}>
        <TextField 
          inputRef={searchInputRef}
          fullWidth
          label="Escanear Código de Barras o ID"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="EAN-13 o ID de bulto..."
          InputProps={{
             endAdornment: searching && <CircularProgress size={20} />
          }}
        />
        <Button variant="contained" onClick={handleSearch} disabled={searching}>Añadir</Button>
      </Box>

      {draft.pedidosSeleccionados.map((p, pIdx) => (
        <Accordion 
          key={p.id} 
          expanded={expandedPanel === p.id} 
          onChange={(e, isExpanded) => setExpandedPanel(isExpanded ? p.id : false)}
          TransitionProps={{ unmountOnExit: true }}
          elevation={0}
          sx={{ mb: 2, border: '1px solid #eee', '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
             <Typography variant="subtitle2" color="primary">
               {p.proveedor} 
               <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                 ({p.lineas.filter(l => Number(l.cantidadRecibida) > 0).length} ítems recibidos)
               </Typography>
             </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0, pb: 2 }}>
            <Table size="small" sx={{ tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '20%' }}>Producto</TableCell>
                  <TableCell align="center" sx={{ width: '6%' }}>Unidad</TableCell>
                  <TableCell align="right" sx={{ width: '8%' }}>Pedida</TableCell>
                  <TableCell align="right" sx={{ width: '10%' }}>Recibida</TableCell>
                  <TableCell sx={{ width: '15%' }}>Físico</TableCell>
                  <TableCell sx={{ width: '18%' }}>Caducidad</TableCell>
                  <TableCell align="center" sx={{ width: '23%' }}>Sync</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {p.lineas.map((l, lIdx) => (
                  <TableRow key={l.pedidoProductoId} hover>
                    <TableCell sx={{ lineHeight: 1.2, whiteSpace: 'normal', wordWrap: 'break-word', p: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, display: 'block' }}>{l.nombreProducto}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                        {l.codigoBarras ? `EAN: ${l.codigoBarras}` : 'Sin código'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{l.unidad}</Typography>
                    </TableCell>
                    <TableCell align="right">{l.cantidadPedida}</TableCell>
                    <TableCell align="right">
                      <TextField 
                        type="number" 
                        size="small" 
                        InputProps={{ inputProps: { min: 0 } }}
                        value={l.cantidadRecibida} 
                        onChange={(e) => handleUpdateLinea(pIdx, lIdx, 'cantidadRecibida', e.target.value)}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={l.estadoVisual || EstadoVisualProducto.OPTIMO}
                          onChange={(e) => handleUpdateLinea(pIdx, lIdx, 'estadoVisual', e.target.value)}
                          sx={{ fontSize: '0.8rem' }}
                        >
                          <MenuItem value={EstadoVisualProducto.OPTIMO}>Óptimo</MenuItem>
                          <MenuItem value={EstadoVisualProducto.ROTO}>Roto</MenuItem>
                          <MenuItem value={EstadoVisualProducto.DEFECTUOSO}>Defecto</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="date"
                        size="small"
                        fullWidth
                        value={l.fechaCaducidad || ''}
                        onChange={(e) => handleUpdateLinea(pIdx, lIdx, 'fechaCaducidad', e.target.value)}
                        slotProps={{ inputLabel: { shrink: true } }}
                        inputProps={{ style: { fontSize: '0.8rem', padding: '6px' } }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={l.estado} size="small" color={getStatusColor(l.estado)} variant="outlined" sx={{ minWidth: '110px' }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AccordionDetails>
        </Accordion>
      ))}

      {draft.productosEspontaneos.length > 0 && (
        <Paper sx={{ p: 2, bgcolor: '#fafafa' }} elevation={0}>
           <Typography variant="subtitle2" color="secondary">Especial / Fuera de Pedido 🆕</Typography>
           <Table size="small" sx={{ tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '20%' }}>Producto</TableCell>
                  <TableCell align="center" sx={{ width: '8%' }}>Unidad</TableCell>
                  <TableCell align="right" sx={{ width: '12%' }}>Recibida</TableCell>
                  <TableCell sx={{ width: '15%' }}>Físico</TableCell>
                  <TableCell sx={{ width: '20%' }}>Caducidad</TableCell>
                  <TableCell align="center" sx={{ width: '25%' }}>Acción</TableCell>
                </TableRow>
              </TableHead>
            <TableBody>
              {draft.productosEspontaneos.map((l, lIdx) => (
                <TableRow key={lIdx}>
                  <TableCell sx={{ lineHeight: 1.2, whiteSpace: 'normal', wordWrap: 'break-word', p: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, display: 'block' }}>{l.nombreProducto}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                      {l.codigoBarras ? `EAN: ${l.codigoBarras}` : 'Sin código'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{l.unidad}</Typography>
                  </TableCell>
                  <TableCell align="right">
                     <TextField 
                      type="number" 
                      size="small" 
                      InputProps={{ inputProps: { min: 0 } }}
                      value={l.cantidadRecibida} 
                      onChange={(e) => handleUpdateLinea(null, lIdx, 'cantidadRecibida', e.target.value)}
                      sx={{ width: 80 }}
                    />
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" fullWidth>
                      <Select
                        value={l.estadoVisual || EstadoVisualProducto.OPTIMO}
                        onChange={(e) => handleUpdateLinea(null, lIdx, 'estadoVisual', e.target.value)}
                        sx={{ fontSize: '0.8rem' }}
                      >
                        <MenuItem value={EstadoVisualProducto.OPTIMO}>Óptimo</MenuItem>
                        <MenuItem value={EstadoVisualProducto.ROTO}>Roto</MenuItem>
                        <MenuItem value={EstadoVisualProducto.DEFECTUOSO}>Defecto</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="date"
                      size="small"
                      fullWidth
                      value={l.fechaCaducidad || ''}
                      onChange={(e) => handleUpdateLinea(null, lIdx, 'fechaCaducidad', e.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                      inputProps={{ style: { fontSize: '0.8rem', padding: '6px' } }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Chip label="🆕 NUEVO" size="small" />
                    <IconButton size="small" onClick={() => {
                        const newEsp = draft.productosEspontaneos.filter((_, i) => i !== lIdx);
                        setDraft({ ...draft, productosEspontaneos: newEsp });
                    }}><DeleteIcon color="error" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
           </Table>
        </Paper>
      )}
    </Box>
  );

  const getStatusColor = (status: string): any => {
    if (status === '✅ OK') return 'success';
    if (status === '⚠️ Parcial') return 'warning';
    if (status === '🔵 Exceso') return 'info';
    if (status === '❌ No entregado') return 'error';
    return 'default';
  };

  const renderStep3 = () => (
    <Box>
      <Alert severity="warning" sx={{ mb: 2 }}>Revisa los totales y añade el Nº de Albarán del repartidor.</Alert>
      <Box sx={{ mb: 3 }}>
         <TextField label="Firma / Observaciones generales" value={draft.observaciones} onChange={(e) => setDraft({...draft, observaciones: e.target.value})} fullWidth multiline rows={1} />
      </Box>

      {draft.pedidosSeleccionados.map((p, pIdx) => (
        <Accordion 
          key={p.id} 
          expanded={expandedPanel === p.id} 
          onChange={(e, isExpanded) => setExpandedPanel(isExpanded ? p.id : false)}
          TransitionProps={{ unmountOnExit: true }}
          elevation={0}
          sx={{ mb: 2, border: '1px solid #eee', '&:before': { display: 'none' } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
             <Box display="flex" justifyContent="space-between" alignItems="center" width="100%" onClick={(e) => e.stopPropagation()}>
               <Typography variant="subtitle2" color="primary">{p.proveedor} - {p.descripcion}</Typography>
               <TextField 
                 size="small" 
                 label="Nº Albarán del Pedido" 
                 value={p.nAlbaran || ''} 
                 onChange={(e) => {
                    const newPedidos = [...draft.pedidosSeleccionados];
                    newPedidos[pIdx] = { ...p, nAlbaran: e.target.value };
                    setDraft({ ...draft, pedidosSeleccionados: newPedidos });
                 }}
                 sx={{ width: 200, mr: 2 }}
               />
             </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
             <TableContainer component={Paper} variant="outlined" sx={{ mt: 1, border: 'none', boxShadow: 'none' }}>
               <Table size="small" sx={{ tableLayout: 'fixed' }}>
                 <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '20%' }}>Item</TableCell>
                    <TableCell align="center" sx={{ width: '8%' }}>Unidad</TableCell>
                    <TableCell align="right" sx={{ width: '8%' }}>Exp.</TableCell>
                    <TableCell align="right" sx={{ width: '12%' }}>Real</TableCell>
                    <TableCell sx={{ width: '15%' }}>Estado Físico</TableCell>
                    <TableCell sx={{ width: '18%' }}>Caducidad</TableCell>
                    <TableCell sx={{ width: '19%' }}>Notas</TableCell>
                  </TableRow>
                 </TableHead>
                 <TableBody>
                   {p.lineas.filter(l => Number(l.cantidadRecibida) > 0 || l.estado === '❌ No entregado').map((l, lIdx) => {
                      const realLineIdx = p.lineas.findIndex(ln => ln.pedidoProductoId === l.pedidoProductoId);
                      return (
                        <TableRow key={l.pedidoProductoId}>
                          <TableCell sx={{ lineHeight: 1.2, whiteSpace: 'normal', wordWrap: 'break-word', p: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, display: 'block' }}>{l.nombreProducto}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              {l.codigoBarras ? `EAN: ${l.codigoBarras}` : 'Sin código'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{l.unidad}</Typography>
                          </TableCell>
                          <TableCell align="right">{l.cantidadPedida}</TableCell>
                          <TableCell align="right" sx={{ color: Number(l.cantidadRecibida) !== l.cantidadPedida ? 'orange' : 'inherit', fontWeight: 'bold' }}>{l.cantidadRecibida || 0}</TableCell>
                          <TableCell>
                            <FormControl size="small" fullWidth>
                              <Select
                                value={l.estadoVisual}
                                onChange={(e) => handleUpdateLinea(pIdx, realLineIdx, 'estadoVisual', e.target.value)}
                              >
                                <MenuItem value={EstadoVisualProducto.OPTIMO}>Óptimo</MenuItem>
                                <MenuItem value={EstadoVisualProducto.ROTO}>Roto</MenuItem>
                                <MenuItem value={EstadoVisualProducto.DEFECTUOSO}>Defectuoso</MenuItem>
                              </Select>
                            </FormControl>
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="date"
                              size="small"
                              fullWidth
                              value={l.fechaCaducidad || ''}
                              onChange={(e) => handleUpdateLinea(pIdx, realLineIdx, 'fechaCaducidad', e.target.value)}
                              slotProps={{
                                  inputLabel: { shrink: true }
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField 
                              placeholder="Discrepancia..." 
                              size="small" fullWidth 
                              value={l.observaciones}
                              onChange={(e) => {
                                  handleUpdateLinea(pIdx, realLineIdx, 'observaciones', e.target.value);
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                   })}
                 </TableBody>
               </Table>
             </TableContainer>
          </AccordionDetails>
        </Accordion>
      ))}

      {draft.productosEspontaneos.length > 0 && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#fafafa', border: '1px solid #eee' }} elevation={0}>
          <Typography variant="subtitle2" color="secondary">Especial / Fuera de Pedido 🆕</Typography>
          
          <TableContainer component={Paper} variant="outlined" sx={{ mt: 1, border: 'none', boxShadow: 'none', bgcolor: 'transparent' }}>
            <Table size="small" sx={{ tableLayout: 'fixed' }}>
              <TableHead>
               <TableRow>
                 <TableCell sx={{ width: '25%' }}>Item</TableCell>
                 <TableCell align="center" sx={{ width: '10%' }}>Unidad</TableCell>
                 <TableCell align="right" sx={{ width: '10%' }}>Exp.</TableCell>
                 <TableCell align="right" sx={{ width: '10%' }}>Real</TableCell>
                 <TableCell sx={{ width: '15%' }}>Estado Físico</TableCell>
                 <TableCell sx={{ width: '15%' }}>Caducidad</TableCell>
                 <TableCell sx={{ width: '15%' }}>Notas</TableCell>
               </TableRow>
              </TableHead>
              <TableBody>
                {draft.productosEspontaneos.map((l, lIdx) => (
                  <TableRow key={lIdx}>
                    <TableCell>{l.nombreProducto}</TableCell>
                    <TableCell align="center">
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{l.unidad}</Typography>
                    </TableCell>
                    <TableCell align="right">0</TableCell>
                    <TableCell align="right" sx={{ color: 'orange', fontWeight: 'bold' }}>{l.cantidadRecibida || 0}</TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={l.estadoVisual || EstadoVisualProducto.OPTIMO}
                          onChange={(e) => handleUpdateLinea(null, lIdx, 'estadoVisual', e.target.value)}
                        >
                          <MenuItem value={EstadoVisualProducto.OPTIMO}>Óptimo</MenuItem>
                          <MenuItem value={EstadoVisualProducto.ROTO}>Roto</MenuItem>
                          <MenuItem value={EstadoVisualProducto.DEFECTUOSO}>Defectuoso</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="date"
                        size="small"
                        fullWidth
                        value={l.fechaCaducidad || ''}
                        onChange={(e) => handleUpdateLinea(null, lIdx, 'fechaCaducidad', e.target.value)}
                        slotProps={{
                            inputLabel: { shrink: true }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField 
                        placeholder="Discrepancia..." 
                        size="small" fullWidth 
                        value={l.observaciones}
                        onChange={(e) => {
                            handleUpdateLinea(null, lIdx, 'observaciones', e.target.value);
                        }}
                      />
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

  const renderStep4 = () => (
    <Box textAlign="center" sx={{ py: 3 }}>
       <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
       <Typography variant="h5" gutterBottom>¡Recepción Registrada con éxito!</Typography>
       <Typography variant="body1" color="text.secondary">ID Registro: {resultado?.id}</Typography>
       
       <Box sx={{ mt: 4, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f0f4ff' }}>
             <Typography variant="subtitle2" gutterBottom>Impacto en Inventario</Typography>
             <Box display="flex" gap={4}>
                <Box>
                   <Typography variant="h4">{resultado?.movimientosGenerados}</Typography>
                   <Typography variant="caption">Movimientos</Typography>
                </Box>
                <Box>
                   <Typography variant="h4">{resultado?.inventariosCreados}</Typography>
                   <Typography variant="caption">Lotes (FEFO)</Typography>
                </Box>
                {resultado?.productosCreados && resultado.productosCreados.length > 0 && (
                   <Box>
                      <Typography variant="h4">{resultado.productosCreados.length}</Typography>
                      <Typography variant="caption">Prods. Nuevos</Typography>
                   </Box>
                )}
             </Box>
          </Paper>

          {resultado?.incidencias && resultado.incidencias.length > 0 && (
             <Box>
                <Typography variant="subtitle2" color="warning.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                   <WarningAmberIcon /> Se han generado {resultado.incidencias.length} incidencias automáticas
                </Typography>
                {resultado.incidencias.map((inc, i) => (
                   <Alert key={i} severity="warning" sx={{ mt: 1 }}>
                      {inc.datosOriginales.productos.length} productos con discrepancia en pedido de {inc.id.substring(0,8)}...
                   </Alert>
                ))}
             </Box>
          )}

          <Alert severity="info" icon={<SaveIcon />}>Toda la trazabilidad ha sido volcada y los pedidos elásticos han actualizado su estado.</Alert>
       </Box>

       <Button variant="contained" onClick={resetWizard} sx={{ mt: 4 }} size="large">Nueva Recepción</Button>
    </Box>
  );

  const resetWizard = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setDraft(defaultDraft());
    setActiveStep(0);
    setResultado(null);
    setError(null);
    loadPedidos();
  };

  const handleNext = () => {
    if (activeStep === 0 && draft.pedidosSeleccionados.length === 0) return;
    if (activeStep === 2) {
      handleSubmit();
    } else {
      const nextStep = (activeStep + 1);
      setActiveStep(nextStep);
      // Actualizar meta en draft
      const pasos: PasoWizard[] = ['SELECCION_PEDIDOS', 'ESCANEO_LOTE', 'REVISION_FINAL', 'RESULTADO'];
      setDraft({ ...draft, paso: pasos[nextStep] });
    }
  };

  const handleBack = () => {
    const prevStep = activeStep - 1;
    setActiveStep(prevStep);
    const pasos: PasoWizard[] = ['SELECCION_PEDIDOS', 'ESCANEO_LOTE', 'REVISION_FINAL', 'RESULTADO'];
    setDraft({ ...draft, paso: pasos[prevStep] });
  };


  // --- 6. Modal Nuevo Producto ---

  const [modalData, setModalData] = useState({
     nombre: '',
     marca: '',
     unidad: UnidadMedida.KG,
     tipo: CategoriaProducto.OTRO,
     contenido: 1
  });

  const handleConfirmNewProduct = () => {
     const newLinea: LineaDraft = {
        pedidoProductoId: null,
        nombreProducto: modalData.nombre,
        unidad: modalData.unidad,
        cantidadPedida: 0,
        cantidadRecibida: 1,
        estadoVisual: EstadoVisualProducto.OPTIMO,
        fechaCaducidad: '',
        observaciones: '',
        estado: '🆕 Nuevo' as any,
        productoNuevo: {
           pendienteCreacion: true,
           codigoBarras: searchQuery,
           nombre: modalData.nombre,
           marca: modalData.marca,
           unidad: modalData.unidad,
           tipo: modalData.tipo,
           contenido: modalData.contenido,
           cantidadRecibida: 1
        }
     };
     setDraft({ ...draft, productosEspontaneos: [...draft.productosEspontaneos, newLinea] });
     setOpenModal(false);
     setModalData({ nombre: '', marca: '', unidad: UnidadMedida.KG, tipo: CategoriaProducto.OTRO, contenido: 1 });
  };


  return (
    <Box sx={{ maxWidth: 1000, margin: 'auto', p: 3 }}>
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
           <Typography variant="h4" component="h1">Gestión de Recepción</Typography>
           {autoSaveStatus === 'saved' && (
              <Tooltip title="Borrador guardado localmente">
                <Chip icon={<CheckCircleIcon />} label="Auto-guardado" size="small" color="success" variant="outlined" />
              </Tooltip>
           )}
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
        </Stepper>

        {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

        {renderStepContent(activeStep)}

        {activeStep < 3 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 2, borderTop: '1px solid #eee' }}>
             <Button variant="text" onClick={() => {
                if (window.confirm("¿Seguro que quieres borrar el borrador actual?")) resetWizard();
             }} color="error">Descartar</Button>
             
             <Box>
                <Button disabled={activeStep === 0 || isSubmitting} onClick={handleBack} sx={{ mr: 1 }}>Atrás</Button>
                <Button 
                  variant="contained" 
                  onClick={handleNext} 
                  disabled={
                    isSubmitting || 
                    (activeStep === 0 && draft.pedidosSeleccionados.length === 0) ||
                    (activeStep === 1 && !draft.pedidosSeleccionados.some(p => p.lineas.some(l => Number(l.cantidadRecibida) > 0)) && !draft.productosEspontaneos.some(l => Number(l.cantidadRecibida) > 0))
                  }
                >
                   {activeStep === 2 ? (isSubmitting ? 'Procesando...' : 'Finalizar Recepción') : 'Siguiente'}
                </Button>
             </Box>
          </Box>
        )}
      </Paper>

      <Dialog open={openModal} onClose={() => setOpenModal(false)}>
         <DialogTitle>Añadir Producto Desconocido</DialogTitle>
         <DialogContent dividers>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Este producto no figura en el catálogo ni en los pedidos seleccionados.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 400 }}>
               <TextField label="Nombre del Producto" value={modalData.nombre} onChange={e => setModalData({...modalData, nombre: e.target.value})} fullWidth />
               <TextField label="Marca" value={modalData.marca} onChange={e => setModalData({...modalData, marca: e.target.value})} fullWidth />
               <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField label="Unidad" select value={modalData.unidad} onChange={e=>setModalData({...modalData, unidad: e.target.value as any})} fullWidth>
                     {Object.values(UnidadMedida).map(u => <MenuItem key={u} value={u}>{u.toUpperCase()}</MenuItem>)}
                  </TextField>
                  <TextField label="Categoría" select value={modalData.tipo} onChange={e=>setModalData({...modalData, tipo: e.target.value as any})} fullWidth>
                     {Object.values(CategoriaProducto).map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </TextField>
               </Box>
               <TextField label="Contenido (Neto)" type="number" InputProps={{ inputProps: { min: 0 } }} value={modalData.contenido} onChange={e => setModalData({...modalData, contenido: Math.max(0, Number(e.target.value) || 0)})} fullWidth />
            </Box>
         </DialogContent>
         <DialogActions>
            <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
            <Button variant="contained" onClick={handleConfirmNewProduct} disabled={!modalData.nombre}>Confirmar y Añadir</Button>
         </DialogActions>
      </Dialog>

      <Snackbar open={!!error} autoHideDuration={10000} onClose={() => setError(null)}>
        <Alert onClose={() => setError(null)} severity="error" variant="filled">
          {error}
        </Alert>
      </Snackbar>

      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1, flexDirection: 'column', gap: 2 }}
        open={isSubmitting}
      >
        <CircularProgress color="inherit" />
        <Typography variant="h6">Procesando Recepción Masiva...</Typography>
        <Typography variant="body2">Garantizando integridad transaccional (ACID). Por favor, no cierres el navegador.</Typography>
      </Backdrop>
    </Box>
  );
};

export default Recepcion;
