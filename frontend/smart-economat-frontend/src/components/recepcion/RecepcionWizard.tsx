import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Stepper,
    Step,
    StepLabel,
    Button,
    Typography,
    Paper,
    Alert,
    CircularProgress,
    Chip,
    Tooltip,
    Snackbar,
    Backdrop,
    IconButton
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';

import {
    RecepcionDraft,
    LineaDraft,
    PasoWizard,
    RecepcionResultado,
    EstadoVisualProducto,
} from '../../services/recepcion.types';
import { createRecepcion } from '../../services/recepcion.service';
import { fetchPedidos } from '../../services/pedido.service';
import { Pedido, EstadoPedido } from '../../services/pedido.types';
import {
    getProductoByBarcode,
    searchProductosByName,
} from '../../services/producto.service';
import { useAuth } from '../../store/AuthContext';
import {
    CategoriaProducto,
    UnidadMedida,
} from '../../services/producto.types';
import PasoSeleccionPedidos from './PasoSeleccionPedidos';
import PasoEscaneo from './PasoEscaneo';
import PasoRevision from './PasoRevision';
import PasoResultado from './PasoResultado';
import NewProductModal from './NewProductModal';
import WeightScaleModal from './WeightScaleModal';

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

interface RecepcionWizardProps {
    onClose?: () => void;
    onSuccess?: () => void;
}

const RecepcionWizard: React.FC<RecepcionWizardProps> = ({ onClose, onSuccess }) => {
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

    // Báscula Modal State
    const [weightModalOpen, setWeightModalOpen] = useState(false);
    const [weightTarget, setWeightTarget] = useState<{ pIdx: number | null; lIdx: number } | null>(null);
    const [capturedWeight, setCapturedWeight] = useState<number | null>(null);
    const [isWeighing, setIsWeighing] = useState(false);
    const [isScaleConnected, setIsScaleConnected] = useState(true);

    const searchInputRef = useRef<HTMLInputElement>(null);

    // Data
    const [pedidosDisponibles, setPedidosDisponibles] = useState<Pedido[]>([]);
    const [loadingPedidos, setLoadingPedidos] = useState(false);
    const { user } = useAuth();

    const draftRef = useRef(draft);
    useEffect(() => { draftRef.current = draft; }, [draft]);

    useEffect(() => {
        if (activeStep === 1 && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [activeStep]);

    // Restoration
    useEffect(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
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
        loadPedidos();
    }, []);

    // Auto-save
    useEffect(() => {
        if (activeStep === 3) return;

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

    const loadPedidos = async () => {
        setLoadingPedidos(true);
        try {
            const resp = await fetchPedidos(1, 100);
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
        descripcion: `Pedido ${pedido.id.substring(0, 8)} - ${pedido.proveedor?.nombre}`,
        proveedor: pedido.proveedor?.nombre || 'Desconocido',
        lineas: (pedido.pedidoProductos || []).map((pp: any) => ({
            pedidoProductoId: pp.id,
            idProducto: pp.productoProveedor?.producto?.id,
            codigoBarras: pp.productoProveedor?.producto?.codigoBarras,
            nombreProducto: pp.productoProveedor?.producto?.nombre || 'Producto',
            unidad: pp.productoProveedor?.producto?.unidad || 'unidades',
            cantidadPedida: Number(pp.cantidad),
            cantidadAlbaran: '',
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
        const pedidosDelProveedor = pedidosDisponibles.filter(p => p.proveedor?.nombre === providerName);
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
        const newDraftPedidos = draft.pedidosSeleccionados.filter(p => p.proveedor !== providerName);
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

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        setError(null);
        try {
            let prod = await getProductoByBarcode(searchQuery);
            if (!prod) {
                const results = await searchProductosByName(searchQuery);
                if (results.length === 1) {
                    prod = results[0];
                } else if (results.length > 1) {
                    setOpenModal(true);
                    setSearching(false);
                    return;
                }
            }
            if (prod) {
                processProductFound(prod);
            } else {
                setOpenModal(true);
            }
        } catch (e) {
            setOpenModal(true);
        } finally {
            setSearching(false);
            setSearchQuery('');
        }
    };

    const processProductFound = (prod: any) => {
        const newPedidos = [...draft.pedidosSeleccionados].map(p => ({ ...p, lineas: [...p.lineas] }));
        const matches: { pIdx: number; lIdx: number; l: any }[] = [];
        newPedidos.forEach((p, pIdx) => {
            p.lineas.forEach((l, lIdx) => {
                if (l.idProducto === prod.id || (l.codigoBarras === prod.codigoBarras && prod.codigoBarras) || l.nombreProducto.toLowerCase() === prod.nombre.toLowerCase()) {
                    matches.push({ pIdx, lIdx, l });
                }
            });
        });

        if (matches.length > 0) {
            let targetMatch = matches.find(m => Number(m.l.cantidadRecibida) < m.l.cantidadPedida) || matches[0];
            const tLinea = newPedidos[targetMatch.pIdx].lineas[targetMatch.lIdx];
            const currRec = Number(tLinea.cantidadRecibida);

            if (isWeightUnit(tLinea.unidad)) {
                openWeightScale(targetMatch.pIdx, targetMatch.lIdx);
                setExpandedPanel(newPedidos[targetMatch.pIdx].id);
                return;
            }

            newPedidos[targetMatch.pIdx].lineas[targetMatch.lIdx] = {
                ...tLinea,
                cantidadRecibida: currRec + 1,
                estado: calculateEstado(currRec + 1, tLinea.cantidadPedida)
            };
            setDraft({ ...draft, pedidosSeleccionados: newPedidos });
            setExpandedPanel(newPedidos[targetMatch.pIdx].id);
        } else {
            const existingEsp = draft.productosEspontaneos.find(l => l.idProducto === prod.id || (l.codigoBarras === prod.codigoBarras && prod.codigoBarras) || l.nombreProducto.toLowerCase() === prod.nombre.toLowerCase());
            if (existingEsp) {
                const newEsp = draft.productosEspontaneos.map(l => {
                    const match = l.idProducto === prod.id || (l.codigoBarras === prod.codigoBarras && prod.codigoBarras) || l.nombreProducto.toLowerCase() === prod.nombre.toLowerCase();
                    return match ? { ...l, cantidadRecibida: isWeightUnit(l.unidad) ? Number(l.cantidadRecibida) : Number(l.cantidadRecibida) + 1, estado: 'Exceso' as any } : l;
                });
                const indexEsp = newEsp.findIndex(l => l.idProducto === prod.id || (l.codigoBarras === prod.codigoBarras && prod.codigoBarras) || l.nombreProducto.toLowerCase() === prod.nombre.toLowerCase());
                setDraft({ ...draft, productosEspontaneos: newEsp });
                if (isWeightUnit(existingEsp.unidad)) {
                    setTimeout(() => openWeightScale(null, indexEsp), 0);
                }
            } else {
                const newLinea: LineaDraft = {
                    pedidoProductoId: null,
                    idProducto: prod.id,
                    codigoBarras: prod.codigoBarras,
                    nombreProducto: prod.nombre,
                    unidad: prod.unidad || 'uds',
                    cantidadPedida: 0,
                    cantidadAlbaran: '',
                    cantidadRecibida: isWeightUnit(prod.unidad) ? 0 : 1,
                    isWeighedWithScale: false,
                    estadoVisual: EstadoVisualProducto.OPTIMO,
                    fechaCaducidad: '',
                    observaciones: '',
                    estado: 'Nuevo' as any
                };
                setDraft(prev => ({ ...prev, productosEspontaneos: [...prev.productosEspontaneos, newLinea] }));
                if (isWeightUnit(prod.unidad)) {
                    setTimeout(() => openWeightScale(null, draft.productosEspontaneos.length), 0);
                }
            }
        }
    };

    const calculateEstado = (rec: number, ped: number): any => {
        if (rec === 0) return 'No entregado';
        if (rec === ped) return 'OK';
        if (rec < ped) return 'Parcial';
        return 'Exceso';
    };

    const handleUpdateLinea = (pIdx: number | null, lIdx: number, field: string, value: any) => {
        let finalValue = value;
        if (field === 'cantidadRecibida') {
            const numValue = Number(value);
            finalValue = (!isNaN(numValue) && numValue >= 0) ? numValue : 0;
        }

        setDraft(prevDraft => {
            if (pIdx !== null) {
                const newPedidos = [...prevDraft.pedidosSeleccionados];
                const newPedido = { ...newPedidos[pIdx] };
                const newLineas = [...newPedido.lineas];
                const newLinea = { ...newLineas[lIdx], [field]: finalValue };
                if (field === 'cantidadRecibida') {
                    newLinea.estado = calculateEstado(Number(finalValue), newLinea.cantidadPedida);
                    newLinea.isWeighedWithScale = false;
                }
                newLineas[lIdx] = newLinea;
                newPedido.lineas = newLineas;
                newPedidos[pIdx] = newPedido;
                return { ...prevDraft, pedidosSeleccionados: newPedidos };
            } else {
                const newEsp = [...prevDraft.productosEspontaneos];
                const newLinea = { ...newEsp[lIdx], [field]: finalValue };
                if (field === 'cantidadRecibida') newLinea.isWeighedWithScale = false;
                newEsp[lIdx] = newLinea;
                return { ...prevDraft, productosEspontaneos: newEsp };
            }
        });
    };

    const isWeightUnit = (unidad: string | undefined): boolean => {
        if (!unidad) return false;
        const u = unidad.toLowerCase();
        return u === 'kg' || u === 'g' || u === 'mg';
    };

    const openWeightScale = (pIdx: number | null, lIdx: number) => {
        setWeightTarget({ pIdx, lIdx });
        setWeightModalOpen(true);
        startWeighing();
    };

    const startWeighing = () => {
        setIsWeighing(true);
        setCapturedWeight(null);
        setTimeout(() => {
            const randomWeight = (Math.random() * (150.0 - 0.1) + 0.1).toFixed(2);
            setCapturedWeight(Number(randomWeight));
            setIsWeighing(false);
        }, 3000);
    };

    const confirmWeight = () => {
        if (capturedWeight !== null && weightTarget) {
            const { pIdx, lIdx } = weightTarget;
            handleUpdateLinea(pIdx, lIdx, 'cantidadRecibida', capturedWeight);
            handleUpdateLinea(pIdx, lIdx, 'isWeighedWithScale', true);
        }
        closeWeightScale();
    };

    const closeWeightScale = () => {
        setWeightModalOpen(false);
        setWeightTarget(null);
        setIsWeighing(false);
        setCapturedWeight(null);
    };

    const validarDraft = (): boolean => {
        const totalItems = draft.pedidosSeleccionados.flatMap(p => p.lineas).concat(draft.productosEspontaneos);
        const hasReception = totalItems.some(l => Number(l.cantidadRecibida) > 0);
        if (!hasReception) {
            setError("Debes recepcionar al menos un producto.");
            return false;
        }
        for (const p of draft.pedidosSeleccionados) {
            for (const l of p.lineas) {
                if (Number(l.cantidadRecibida) > 0 || l.estado === 'No entregado') {
                    const hasDiscrepancy = Number(l.cantidadRecibida) !== l.cantidadPedida || (l.cantidadAlbaran !== '' && l.cantidadAlbaran != null && Number(l.cantidadAlbaran) !== l.cantidadPedida) || l.estadoVisual !== EstadoVisualProducto.OPTIMO;
                    if (hasDiscrepancy && (!l.observaciones || l.observaciones.trim() === '')) {
                        setError(`Falla Validativa: El producto "${l.nombreProducto}" presenta discrepancias con el pedido o estado y su campo de notas es obligatorio.`);
                        return false;
                    }
                }
            }
        }
        for (const esp of draft.productosEspontaneos) {
            if (!esp.observaciones || esp.observaciones.trim() === '') {
                setError(`Falla Validativa: El producto espontáneo "${esp.nombreProducto}" requiere obligatoriamente una nota justificativa.`);
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validarDraft()) return;
        setIsSubmitting(true);
        setError(null);
        const payload: any = {
            pedidos: draft.pedidosSeleccionados.map(p => ({ pedidoId: p.id, nAlbaran: p.nAlbaran || draft.nAlbaran, observaciones: draft.observaciones })),
            nAlbaran: draft.nAlbaran,
            observaciones: draft.observaciones,
            productos: draft.pedidosSeleccionados.flatMap(p => p.lineas).filter(l => Number(l.cantidadRecibida) > 0).map(l => ({
                pedidoProductoId: l.pedidoProductoId!,
                cantidadRecibida: Number(l.cantidadRecibida),
                estadoVisual: l.estadoVisual,
                fechaCaducidad: l.fechaCaducidad ? new Date(l.fechaCaducidad) : undefined,
                observaciones: l.observaciones,
                isWeighedWithScale: Boolean(l.isWeighedWithScale)
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
                observaciones: p.observaciones,
                isWeighedWithScale: Boolean(p.isWeighedWithScale)
            }))
        };
        try {
            const res = await createRecepcion(payload);
            setResultado(res);
            setActiveStep(3);
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            setDraft(defaultDraft());
            if (onSuccess) onSuccess();
        } catch (err: any) {
            setError(`Error crítico en la transacción: ${err.message}.`);
        } finally {
            setIsSubmitting(false);
        }
    };

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
        if (activeStep === 2) handleSubmit();
        else setActiveStep(s => s + 1);
    };

    const [modalData, setModalData] = useState({ nombre: '', marca: '', unidad: UnidadMedida.KG, tipo: CategoriaProducto.OTRO, contenido: 1 });
    const handleConfirmNewProduct = () => {
        const isWeight = isWeightUnit(modalData.unidad);
        const newLinea: LineaDraft = {
            pedidoProductoId: null, idProducto: '', codigoBarras: searchQuery || '', nombreProducto: modalData.nombre, unidad: modalData.unidad, cantidadPedida: 0, cantidadAlbaran: '', cantidadRecibida: isWeight ? 0 : 1, isWeighedWithScale: false, estadoVisual: EstadoVisualProducto.OPTIMO, fechaCaducidad: '', observaciones: '', estado: 'Nuevo' as any,
            productoNuevo: { pendienteCreacion: true, codigoBarras: searchQuery || '', nombre: modalData.nombre, marca: modalData.marca, unidad: modalData.unidad, tipo: modalData.tipo, contenido: modalData.contenido, cantidadRecibida: isWeight ? 0 : 1, isWeighedWithScale: false }
        };
        setDraft(prev => ({ ...prev, productosEspontaneos: [...prev.productosEspontaneos, newLinea] }));
        setOpenModal(false);
        setModalData({ nombre: '', marca: '', unidad: UnidadMedida.KG, tipo: CategoriaProducto.OTRO, contenido: 1 });
        if (isWeight) setTimeout(() => openWeightScale(null, draft.productosEspontaneos.length), 50);
    };

    return (
        <Box sx={{ maxWidth: 1300, margin: 'auto', p: { xs: 1, sm: 3 } }}>
            <Paper sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2, position: 'relative' }}>
                {onClose && (
                    <IconButton onClick={onClose} sx={{ position: 'absolute', right: 16, top: 16 }}>
                        <CloseIcon />
                    </IconButton>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, pr: onClose ? 5 : 0 }}>
                    <Typography variant="h4" component="h1">Gestión de Recepción</Typography>
                    {autoSaveStatus === 'saved' && (
                        <Tooltip title="Borrador guardado localmente">
                            <Chip icon={<CheckCircleIcon />} label="Auto-guardado" size="small" color="success" variant="outlined" />
                        </Tooltip>
                    )}
                </Box>

                <Stepper activeStep={activeStep} sx={{ mb: 4, overflowX: 'auto', py: 1 }}>
                    {steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
                </Stepper>

                {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

                {activeStep === 0 && (
                    <PasoSeleccionPedidos
                        loadingPedidos={loadingPedidos}
                        pedidosDisponibles={pedidosDisponibles}
                        pedidosSeleccionadosIds={draft.pedidosSeleccionados.map(p => p.id)}
                        uniqueProviders={Array.from(new Set(pedidosDisponibles.map(p => p.proveedor?.nombre).filter(Boolean))) as string[]}
                        onSelectAll={handleSelectAll}
                        onDeselectAll={handleDeselectAll}
                        onSelectProvider={handleSelectProvider}
                        onDeselectProvider={handleDeselectProvider}
                        onTogglePedido={handleTogglePedido}
                    />
                )}
                {activeStep === 1 && (
                    <PasoEscaneo
                        searchInputRef={searchInputRef}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        onSearch={handleSearch}
                        searching={searching}
                        isScaleConnected={isScaleConnected}
                        setIsScaleConnected={setIsScaleConnected}
                        draft={draft}
                        setDraft={setDraft}
                        expandedPanel={expandedPanel}
                        setExpandedPanel={setExpandedPanel}
                        onUpdateLinea={handleUpdateLinea}
                        isWeightUnit={isWeightUnit}
                        onOpenWeightScale={openWeightScale}
                    />
                )}
                {activeStep === 2 && (
                    <PasoRevision
                        draft={draft}
                        setDraft={setDraft}
                        expandedPanel={expandedPanel}
                        setExpandedPanel={setExpandedPanel}
                        onUpdateLinea={handleUpdateLinea}
                    />
                )}
                {activeStep === 3 && (
                    <PasoResultado resultado={resultado} onResetWizard={() => { resetWizard(); if (onClose) onClose(); }} />
                )}

                {activeStep < 3 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                        <Button variant="outlined" onClick={() => { if (window.confirm("¿Seguro que quieres borrar el borrador actual?")) resetWizard(); }} color="secondary">Descartar</Button>
                        <Box>
                            <Button disabled={activeStep === 0 || isSubmitting} onClick={() => setActiveStep(s => s - 1)} sx={{ mr: 1 }}>Atrás</Button>
                            <Button
                                variant="contained"
                                onClick={handleNext}
                                disabled={isSubmitting || (activeStep === 0 && draft.pedidosSeleccionados.length === 0)}
                            >
                                {activeStep === 2 ? (isSubmitting ? 'Procesando...' : 'Finalizar Recepción') : 'Siguiente'}
                            </Button>
                        </Box>
                    </Box>
                )}
            </Paper>

            <NewProductModal open={openModal} onClose={() => setOpenModal(false)} modalData={modalData} setModalData={setModalData} onConfirm={handleConfirmNewProduct} />
            <WeightScaleModal open={weightModalOpen} isWeighing={isWeighing} capturedWeight={capturedWeight} onClose={closeWeightScale} onStartWeighing={startWeighing} onConfirmWeight={confirmWeight} />
            <Snackbar open={!!error} autoHideDuration={10000} onClose={() => setError(null)}><Alert onClose={() => setError(null)} severity="error" variant="filled">{error}</Alert></Snackbar>
            <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 5, flexDirection: 'column', gap: 2 }} open={isSubmitting}>
                <CircularProgress color="inherit" /><Typography variant="h6">Procesando Recepción...</Typography>
            </Backdrop>
        </Box>
    );
};

export default RecepcionWizard;
