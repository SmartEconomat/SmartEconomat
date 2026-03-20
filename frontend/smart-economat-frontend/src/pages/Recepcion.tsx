import React, { useState, useEffect, useRef } from 'react';
import {
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
  Box,
} from '@mui/material';
import { Theme } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SaveIcon from '@mui/icons-material/Save';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import {
  RecepcionDraft,
  LineaDraft,
  PasoWizard,
  RecepcionResultado,
  EstadoVisualProducto,
} from '../services/recepcion.types';
import { createRecepcion } from '../services/recepcion.service';
import { fetchPedidos } from '../services/pedido.service';
import { Pedido, EstadoPedido, PedidoProducto } from '../services/pedido.types';
import {
  getProductoByBarcode,
  searchProductosByName,
} from '../services/producto.service';
import { useNavigate } from 'react-router-dom';
import { usePermission } from '../store/auth.hooks';
import {
  CategoriaProducto,
  UnidadMedida,
  normalizeUnidadMedida,
} from '../services/producto.types';
import PasoSeleccionPedidos from '../components/recepcion/PasoSeleccionPedidos';
import PasoEscaneo from '../components/recepcion/PasoEscaneo';
import PasoRevision from '../components/recepcion/PasoRevision';
import PasoResultado from '../components/recepcion/PasoResultado';
import NewProductModal from '../components/recepcion/NewProductModal';
import WeightScaleModal from '../components/recepcion/WeightScaleModal';
import RecepcionDraftConflictDialog from '../components/recepcion/RecepcionDraftConflictDialog';
import { useRecepcionDraft } from '../hooks/useRecepcionDraft';

const steps = [
  'Selección de Pedidos',
  'Escaneo y Conteo',
  'Revisión y Ajuste',
  'Resultado',
];

const defaultDraft = (): RecepcionDraft => ({
  version: 2,
  creadoEn: new Date().toISOString(),
  modificadoEn: new Date().toISOString(),
  serverVersion: null,
  serverUpdatedAt: null,
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
  const [resultado, setResultado] = useState<RecepcionResultado | null>(null);

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [expandedPanel, setExpandedPanel] = useState<string | false>(false);

  // Báscula Modal State
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [weightTarget, setWeightTarget] = useState<{
    pIdx: number | null;
    lIdx: number;
  } | null>(null);
  const [capturedWeight, setCapturedWeight] = useState<number | null>(null);
  const [isWeighing, setIsWeighing] = useState(false);
  const [isScaleConnected, setIsScaleConnected] = useState(true);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const {
    clearDraft: clearRemoteDraft,
    conflict,
    draft,
    keepLocalDraft,
    setDraft,
    syncError,
    syncStatus,
    useRemoteDraft,
  } = useRecepcionDraft({
    activeStep,
    defaultDraft,
    setActiveStep,
  });
  const draftRef = useRef(draft);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    if (activeStep === 1 && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [activeStep]);

  // Data
  const [pedidosDisponibles, setPedidosDisponibles] = useState<Pedido[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const navigate = useNavigate();
  const canCreate = usePermission('recepciones:crear');

  useEffect(() => {
    if (canCreate === false) {
      navigate('/');
    }
  }, [canCreate, navigate]);

  useEffect(() => {
    void loadPedidos();
  }, []);

  // --- 2. Acciones del Backend ---

  const loadPedidos = async () => {
    setLoadingPedidos(true);
    try {
      const resp = await fetchPedidos(1, 50);
      // Solo pedidos pendientes, en proceso o parciales
      setPedidosDisponibles(
        resp.data.filter(
          (p: Pedido) =>
            p.estado === EstadoPedido.PENDIENTE ||
            p.estado === EstadoPedido.EN_PROCESO ||
            p.estado === EstadoPedido.PARCIAL
        )
      );
    } catch {
      setError('Error al cargar pedidos compatibles.');
    } finally {
      setLoadingPedidos(false);
    }
  };

  const mapPedidoToDraft = (pedido: Pedido): LineaDraft[] =>
    (pedido.pedidoProductos || []).map((pp: PedidoProducto) => ({
      pedidoProductoId: pp.id,
      idProducto: pp.productoProveedor?.producto?.id,
      codigoBarras: pp.productoProveedor?.producto?.codigoBarras,
      nombreProducto: pp.productoProveedor?.producto?.nombre || 'Producto',
      cantidadPedida: Number(pp.cantidad),
      cantidadAlbaran: '',
      cantidadRecibida: 0,
      isWeighedWithScale: false,
      estadoVisual: EstadoVisualProducto.OPTIMO,
      fechaCaducidad: '',
      observaciones: '',
      estado: calculateEstado(0, Number(pp.cantidad)),
      unidad: pp.productoProveedor?.producto?.unidad || UnidadMedida.UNIDAD,
    }));

  // Helper para crear el objeto del pedido en el draft
  const createDraftPedido = (pedido: Pedido) => ({
    id: pedido.id,
    descripcion: `Pedido ${pedido.id.substring(0, 8)} - ${pedido.proveedor?.nombre}`,
    proveedor: pedido.proveedor?.nombre || 'Desconocido',
    lineas: mapPedidoToDraft(pedido),
  });

  const handleSelectAll = () => {
    const newDraftPedidos = [...draft.pedidosSeleccionados];
    pedidosDisponibles.forEach((pedido) => {
      if (!newDraftPedidos.some((p) => p.id === pedido.id)) {
        newDraftPedidos.push(createDraftPedido(pedido));
      }
    });
    setDraft({ ...draft, pedidosSeleccionados: newDraftPedidos });
  };

  const handleDeselectAll = () => {
    setDraft({ ...draft, pedidosSeleccionados: [] });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelectProvider = (e: any) => {
    const providerName = e.target.value as string;
    if (!providerName) return;

    const pedidosDelProveedor = pedidosDisponibles.filter(
      (p) => p.proveedor?.nombre === providerName
    );

    const newDraftPedidos = [...draft.pedidosSeleccionados];

    pedidosDelProveedor.forEach((pedido) => {
      if (!newDraftPedidos.some((p) => p.id === pedido.id)) {
        newDraftPedidos.push(createDraftPedido(pedido));
      }
    });

    setDraft({ ...draft, pedidosSeleccionados: newDraftPedidos });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDeselectProvider = (e: any) => {
    const providerName = e.target.value as string;
    if (!providerName) return;

    const newDraftPedidos = draft.pedidosSeleccionados.filter(
      (p) => p.proveedor !== providerName
    );

    setDraft({ ...draft, pedidosSeleccionados: newDraftPedidos });
  };

  const handleTogglePedido = (pedido: Pedido) => {
    const isSelected = draft.pedidosSeleccionados.some(
      (p) => p.id === pedido.id
    );
    let newPedidos = [...draft.pedidosSeleccionados];

    if (isSelected) {
      newPedidos = newPedidos.filter((p) => p.id !== pedido.id);
    } else {
      newPedidos.push(createDraftPedido(pedido));
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
    } catch {
      setOpenModal(true);
    } finally {
      setSearching(false);
      setSearchQuery('');
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }
  };

  const processProductFound = (prod: {
    id: string;
    codigoBarras?: string;
    nombre: string;
    unidad?: UnidadMedida;
  }) => {
    const newPedidos = [...draft.pedidosSeleccionados].map((p) => ({
      ...p,
      lineas: [...p.lineas],
    }));

    // 1. Array de coincidencias en los pedidos seleccionados
    const matches: { pIdx: number; lIdx: number; l: LineaDraft }[] = [];
    newPedidos.forEach((p, pIdx) => {
      p.lineas.forEach((l, lIdx) => {
        const matchId = l.idProducto === prod.id;
        const matchBarcode =
          l.codigoBarras === prod.codigoBarras && prod.codigoBarras;
        const matchName =
          l.nombreProducto.toLowerCase() === prod.nombre.toLowerCase();

        if (matchId || matchBarcode || matchName) {
          matches.push({ pIdx, lIdx, l });
        }
      });
    });

    if (matches.length > 0) {
      // Buscar si algún match le falta stock
      let targetMatch = matches.find((m) => {
        const currRec =
          m.l.cantidadRecibida === '' ? 0 : Number(m.l.cantidadRecibida);
        return currRec < m.l.cantidadPedida;
      });

      // Si todos los matches ya están llenos, sumar al primer match (exceso)
      if (!targetMatch) {
        targetMatch = matches[0];
      }

      const foundPedidoId = newPedidos[targetMatch.pIdx].id;
      const tLinea = newPedidos[targetMatch.pIdx].lineas[targetMatch.lIdx];
      const currRec =
        tLinea.cantidadRecibida === '' ? 0 : Number(tLinea.cantidadRecibida);

      if (isWeightUnit(tLinea.unidad)) {
        // En lugar de sumar +1 por defecto, abrimos la balanza para capturar su peso
        openWeightScale(targetMatch.pIdx, targetMatch.lIdx);
        setExpandedPanel(foundPedidoId);
        return; // Detenemos aquí para esperar a que el usuario confirme el peso
      }

      newPedidos[targetMatch.pIdx].lineas[targetMatch.lIdx] = {
        ...tLinea,
        cantidadRecibida: currRec + 1,
        estado: calculateEstado(currRec + 1, tLinea.cantidadPedida),
      };

      setDraft({ ...draft, pedidosSeleccionados: newPedidos });
      setExpandedPanel(foundPedidoId);
    } else {
      // 2. Si no esta, añadir a espontáneos
      const existingEsp = draft.productosEspontaneos.find(
        (l) =>
          l.idProducto === prod.id ||
          (l.codigoBarras === prod.codigoBarras && prod.codigoBarras) ||
          l.nombreProducto.toLowerCase() === prod.nombre.toLowerCase()
      );

      if (existingEsp) {
        const newEsp = draft.productosEspontaneos.map((l) => {
          const match =
            l.idProducto === prod.id ||
            (l.codigoBarras === prod.codigoBarras && prod.codigoBarras) ||
            l.nombreProducto.toLowerCase() === prod.nombre.toLowerCase();
          return match
            ? {
                ...l,
                cantidadRecibida: isWeightUnit(l.unidad)
                  ? Number(l.cantidadRecibida)
                  : Number(l.cantidadRecibida) + 1,
                estado: 'Exceso' as LineaDraft['estado'],
              }
            : l;
        });

        const indexEsp = newEsp.findIndex(
          (l) =>
            l.idProducto === prod.id ||
            (l.codigoBarras === prod.codigoBarras && prod.codigoBarras) ||
            l.nombreProducto.toLowerCase() === prod.nombre.toLowerCase()
        );
        setDraft({ ...draft, productosEspontaneos: newEsp });

        if (isWeightUnit(existingEsp.unidad)) {
          // El estado tardará un render en actualizarse, pero openWeightScale usa índice directo
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
          estado: 'Nuevo',
        };
        setDraft((prev) => ({
          ...prev,
          productosEspontaneos: [...prev.productosEspontaneos, newLinea],
        }));

        if (isWeightUnit(prod.unidad)) {
          setTimeout(
            () =>
              openWeightScale(
                null,
                draftRef.current.productosEspontaneos.length
              ),
            0
          );
        }
      }
    }
  };

  const calculateEstado = (rec: number, ped: number): LineaDraft['estado'] => {
    if (rec === 0) return 'No entregado';
    if (rec === ped) return 'OK';
    if (rec < ped) return 'Parcial';
    return 'Exceso';
  };

  const handleUpdateLinea = (
    pIdx: number | null,
    lIdx: number,
    field: string,
    value: unknown
  ) => {
    let finalValue = value;
    if (field === 'cantidadRecibida') {
      const numValue = Number(value);
      finalValue = !isNaN(numValue) && numValue >= 0 ? numValue : 0;
    }

    setDraft((prevDraft) => {
      if (pIdx !== null) {
        const newPedidos = [...prevDraft.pedidosSeleccionados];
        const newPedido = { ...newPedidos[pIdx] };
        const newLineas = [...newPedido.lineas];
        const newLinea = { ...newLineas[lIdx], [field]: finalValue };

        if (field === 'cantidadRecibida') {
          newLinea.estado = calculateEstado(
            Number(finalValue),
            newLinea.cantidadPedida
          );
        }

        // Si el usuario edita a mano (escribiendo), y no teníamos isWeighedWithScale = true, lo mantenemos en false.
        // Si ya era true (pesado con báscula) y cambia el valor a mano, podríamos poner false si queremos ser estrictos.
        // Por ahora, asumimos que si cambia un campo numérico manualmente `onChange`, quita la "oficialidad" de la báscula.
        if (field === 'cantidadRecibida') {
          newLinea.isWeighedWithScale = false;
        }

        newLineas[lIdx] = newLinea;
        newPedido.lineas = newLineas;
        newPedidos[pIdx] = newPedido;

        return { ...prevDraft, pedidosSeleccionados: newPedidos };
      } else {
        const newEsp = [...prevDraft.productosEspontaneos];
        const newLinea = { ...newEsp[lIdx], [field]: finalValue };

        if (field === 'cantidadRecibida') {
          newLinea.isWeighedWithScale = false;
        }

        newEsp[lIdx] = newLinea;
        return { ...prevDraft, productosEspontaneos: newEsp };
      }
    });
  };

  // --- 4. Funciones de Báscula Analógica (Simulada) ---
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

    // Simular el tiempo de estabilización de la pesa (ej. 3 segundos)
    setTimeout(() => {
      // Simular peso capturado aleatorio entre 0.1 y 150 kg para la prueba
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

  // --- 5. Validación y Envío (Paso 3) ---

  const validarDraft = (): boolean => {
    const errores: Record<string, string[]> = {};
    const isValid = true;

    // Al menos 1 producto con cantidad > 0
    const totalItems = draft.pedidosSeleccionados
      .flatMap((p) => p.lineas)
      .concat(draft.productosEspontaneos);
    const hasReception = totalItems.some((l) => Number(l.cantidadRecibida) > 0);

    if (!hasReception) {
      setError('Debes recepcionar al menos un producto.');
      return false;
    }

    // Validar observaciones si hay discrepancia
    for (const p of draft.pedidosSeleccionados) {
      for (const l of p.lineas) {
        // Solo evaluamos lineas interactuadas
        if (Number(l.cantidadRecibida) > 0 || l.estado === 'No entregado') {
          const hasDiscrepancy =
            Number(l.cantidadRecibida) !== l.cantidadPedida ||
            (l.cantidadAlbaran !== '' &&
              l.cantidadAlbaran != null &&
              Number(l.cantidadAlbaran) !== l.cantidadPedida) ||
            l.estadoVisual !== EstadoVisualProducto.OPTIMO;

          if (
            hasDiscrepancy &&
            (!l.observaciones || l.observaciones.trim() === '')
          ) {
            setError(
              `Falla Validativa: El producto "${l.nombreProducto}" presenta discrepancias con el pedido o estado y su campo de notas es obligatorio.`
            );
            return false;
          }
        }
      }
    }

    for (const esp of draft.productosEspontaneos) {
      // Los productos espontáneos siempre son discrepancias (exceso no planificado)
      if (!esp.observaciones || esp.observaciones.trim() === '') {
        setError(
          `Falla Validativa: El producto espontáneo "${esp.nombreProducto || esp.productoNuevo?.nombre}" requiere obligatoriamente una nota justificativa.`
        );
        return false;
      }
    }

    setDraft({ ...draft, erroresPorLinea: errores });
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validarDraft()) return;

    setIsSubmitting(true);
    setError(null);

    const payload = {
      pedidos: draft.pedidosSeleccionados.map((p) => ({
        pedidoId: p.id,
        nAlbaran: p.nAlbaran || draft.nAlbaran,
        observaciones: draft.observaciones,
      })),
      nAlbaran: draft.nAlbaran,
      observaciones: draft.observaciones,
      productos: draft.pedidosSeleccionados
        .flatMap((p) => p.lineas)
        .filter((l) => Number(l.cantidadRecibida) > 0)
        .map((l) => ({
          pedidoProductoId: l.pedidoProductoId!,
          cantidadRecibida: Number(l.cantidadRecibida),
          estadoVisual: l.estadoVisual,
          fechaCaducidad: l.fechaCaducidad
            ? new Date(l.fechaCaducidad)
            : undefined,
          observaciones: l.observaciones,
          isWeighedWithScale: Boolean(l.isWeighedWithScale),
        })),
      productosNuevos: draft.productosEspontaneos.map((p) => ({
        pendienteCreacion: true,
        codigoBarras: p.productoNuevo?.codigoBarras || p.codigoBarras || '',
        nombre: p.productoNuevo?.nombre || p.nombreProducto,
        marca: p.productoNuevo?.marca || '',
        unidad:
          normalizeUnidadMedida(
            p.productoNuevo?.unidad || p.unidad || UnidadMedida.UNIDAD
          ) || UnidadMedida.UNIDAD,
        tipo: (p.productoNuevo?.tipo ||
          CategoriaProducto.OTRO) as CategoriaProducto,
        contenido: p.productoNuevo?.contenido || 1,
        cantidadRecibida: Number(p.cantidadRecibida),
        observaciones: p.observaciones,
        isWeighedWithScale: Boolean(p.isWeighedWithScale),
      })),
    };

    function isErrorWithMessage(e: unknown): e is { message: string } {
      return (
        typeof e === 'object' &&
        e !== null &&
        'message' in e &&
        typeof (e as { message: unknown }).message === 'string'
      );
    }
    try {
      const res = await createRecepcion(payload);
      setResultado(res);
      setActiveStep(3);
      await clearRemoteDraft();
    } catch (err: unknown) {
      let errorMessage = '';
      if (isErrorWithMessage(err)) {
        errorMessage = err.message;
      }
      if (
        errorMessage.includes('Pedido no encontrado') ||
        errorMessage.includes('ORDER_NOT_FOUND')
      ) {
        await clearRemoteDraft();
        setActiveStep(0);
        setError(
          `Error crítico: El pedido que intentabas recepcionar ya no existe o fue procesado. El borrador remoto obsoleto ha sido eliminado por seguridad. Por favor, selecciona nuevamente los pedidos a recepcionar.`
        );
      } else {
        setError(
          `Error crítico en la transacción: ${errorMessage}. Los datos siguen sincronizados en el servidor; puedes intentar enviarlos de nuevo.`
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 5. Render Helpers ---

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderStep1();
      case 1:
        return renderStep2();
      case 2:
        return renderStep3();
      case 3:
        return renderStep4();
      default:
        return null;
    }
  };

  const uniqueProviders = Array.from(
    new Set(pedidosDisponibles.map((p) => p.proveedor?.nombre).filter(Boolean))
  ) as string[];

  const renderStep1 = () => (
    <PasoSeleccionPedidos
      loadingPedidos={loadingPedidos}
      pedidosDisponibles={pedidosDisponibles}
      pedidosSeleccionadosIds={draft.pedidosSeleccionados.map((p) => p.id)}
      uniqueProviders={uniqueProviders}
      onSelectAll={handleSelectAll}
      onDeselectAll={handleDeselectAll}
      onSelectProvider={handleSelectProvider}
      onDeselectProvider={handleDeselectProvider}
      onTogglePedido={handleTogglePedido}
    />
  );

  const renderStep2 = () => (
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
  );
  const renderStep3 = () => (
    <PasoRevision
      draft={draft}
      setDraft={setDraft}
      expandedPanel={expandedPanel}
      setExpandedPanel={setExpandedPanel}
      onUpdateLinea={handleUpdateLinea}
    />
  );

  const renderStep4 = () => (
    <PasoResultado resultado={resultado} onResetWizard={resetWizard} />
  );

  const resetWizard = async () => {
    await clearRemoteDraft();
    setActiveStep(0);
    setResultado(null);
    setError(null);
    await loadPedidos();
  };

  const handleNext = () => {
    if (activeStep === 0 && draft.pedidosSeleccionados.length === 0) return;
    if (activeStep === 2) {
      handleSubmit();
    } else {
      const nextStep = activeStep + 1;
      setActiveStep(nextStep);
      // Actualizar meta en draft
      const pasos: PasoWizard[] = [
        'SELECCION_PEDIDOS',
        'ESCANEO_LOTE',
        'REVISION_FINAL',
        'RESULTADO',
      ];
      setDraft({ ...draft, paso: pasos[nextStep] });
    }
  };

  const handleBack = () => {
    const prevStep = activeStep - 1;
    setActiveStep(prevStep);
    const pasos: PasoWizard[] = [
      'SELECCION_PEDIDOS',
      'ESCANEO_LOTE',
      'REVISION_FINAL',
      'RESULTADO',
    ];
    setDraft({ ...draft, paso: pasos[prevStep] });
  };

  // --- 6. Modal Nuevo Producto ---

  const [modalData, setModalData] = useState({
    nombre: '',
    marca: '',
    unidad: UnidadMedida.KG,
    tipo: CategoriaProducto.OTRO,
    contenido: 1,
  });

  const handleConfirmNewProduct = () => {
    const isWeight = isWeightUnit(modalData.unidad);
    const newLinea: LineaDraft = {
      pedidoProductoId: null,
      idProducto: '',
      codigoBarras: searchQuery || '',
      nombreProducto: modalData.nombre,
      unidad: modalData.unidad,
      cantidadPedida: 0,
      cantidadAlbaran: '',
      cantidadRecibida: isWeight ? 0 : 1, // Start at 0 for weighable items until weighed
      isWeighedWithScale: false,
      estadoVisual: EstadoVisualProducto.OPTIMO,
      fechaCaducidad: '',
      observaciones: '',
      estado: 'Nuevo',
      productoNuevo: {
        pendienteCreacion: true,
        codigoBarras: searchQuery || '',
        nombre: modalData.nombre,
        marca: modalData.marca,
        unidad: modalData.unidad,
        tipo: modalData.tipo,
        contenido: modalData.contenido,
        cantidadRecibida: isWeight ? 0 : 1,
        isWeighedWithScale: false,
      },
    };

    setDraft((prev) => ({
      ...prev,
      productosEspontaneos: [...prev.productosEspontaneos, newLinea],
    }));

    setOpenModal(false);
    setModalData({
      nombre: '',
      marca: '',
      unidad: UnidadMedida.KG,
      tipo: CategoriaProducto.OTRO,
      contenido: 1,
    });

    if (isWeight) {
      setTimeout(
        () => openWeightScale(null, draft.productosEspontaneos.length),
        50
      );
    }
  };

  return (
    <Box sx={{ maxWidth: 1300, margin: 'auto', p: 3 }}>
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Typography variant="h4" component="h1">
            Gestión de Recepción
          </Typography>
          {syncStatus === 'saving' && (
            <Tooltip title="Sincronizando borrador con el servidor">
              <Chip
                icon={<SaveIcon />}
                label="Guardando..."
                size="small"
                color="warning"
                variant="outlined"
              />
            </Tooltip>
          )}
          {syncStatus === 'synced' && (
            <Tooltip title="Borrador sincronizado de forma segura">
              <Chip
                icon={<CheckCircleIcon />}
                label="Sincronizado"
                size="small"
                color="success"
                variant="outlined"
              />
            </Tooltip>
          )}
          {syncStatus === 'error' && (
            <Tooltip title={syncError || 'Error al sincronizar el borrador'}>
              <Chip
                icon={<ErrorOutlineIcon />}
                label="Error de sync"
                size="small"
                color="error"
                variant="outlined"
              />
            </Tooltip>
          )}
          {syncStatus === 'conflict' && (
            <Tooltip title="El borrador cambió en otro dispositivo">
              <Chip
                icon={<WarningAmberIcon />}
                label="Conflicto"
                size="small"
                color="warning"
                variant="outlined"
              />
            </Tooltip>
          )}
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {!error && syncError && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {syncError}
          </Alert>
        )}

        {renderStepContent(activeStep)}

        {/* Botonera inferior común */}
        {activeStep < 3 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mt: 4,
              pt: 2,
              borderTop: 1,
              borderColor: 'divider',
            }}
          >
            <Button
              variant="outlined"
              onClick={() => {
                if (
                  window.confirm(
                    '¿Seguro que quieres borrar el borrador actual?'
                  )
                ) {
                  void resetWizard();
                }
              }}
              color="secondary"
            >
              Descartar
            </Button>

            <Box>
              <Button
                disabled={activeStep === 0 || isSubmitting}
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                Atrás
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={
                  isSubmitting ||
                  (activeStep === 0 &&
                    draft.pedidosSeleccionados.length === 0) ||
                  (activeStep === 1 &&
                    !draft.pedidosSeleccionados.some((p) =>
                      p.lineas.some((l) => Number(l.cantidadRecibida) > 0)
                    ) &&
                    !draft.productosEspontaneos.some(
                      (l) => Number(l.cantidadRecibida) > 0
                    ))
                }
              >
                {activeStep === 2
                  ? isSubmitting
                    ? 'Procesando...'
                    : 'Finalizar Recepción'
                  : 'Siguiente'}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      <NewProductModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        modalData={modalData}
        setModalData={setModalData}
        onConfirm={handleConfirmNewProduct}
      />

      <WeightScaleModal
        open={weightModalOpen}
        isWeighing={isWeighing}
        capturedWeight={capturedWeight}
        onClose={closeWeightScale}
        onStartWeighing={startWeighing}
        onConfirmWeight={confirmWeight}
      />

      <RecepcionDraftConflictDialog
        open={!!conflict}
        remoteDraft={conflict?.remoteDraft}
        onUseRemote={useRemoteDraft}
        onKeepLocal={keepLocalDraft}
      />

      <Snackbar
        open={!!error}
        autoHideDuration={10000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error" variant="filled">
          {error}
        </Alert>
      </Snackbar>

      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme: Theme) => theme.zIndex.drawer + 1,
          flexDirection: 'column',
          gap: 2,
        }}
        open={isSubmitting}
      >
        <CircularProgress color="inherit" />
        <Typography variant="h6">Procesando Recepción Masiva...</Typography>
        <Typography variant="body2">
          Garantizando integridad transaccional (ACID). Por favor, no cierres el
          navegador.
        </Typography>
      </Backdrop>
    </Box>
  );
};

export default Recepcion;
