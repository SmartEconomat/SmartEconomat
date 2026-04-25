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
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useTranslation } from 'react-i18next';

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
import { useLocation, useNavigate } from 'react-router-dom';
import { usePermission } from '../store/auth.hooks';
import { PERMISSIONS } from '../sherlock-auth/permissions.constants';
import {
  CategoriaProducto,
  UnidadMedida,
  normalizeUnidadMedida,
} from '../services/producto.types';
import { searchByBarcode } from '../services/openfoodfacts.service';
import PasoSeleccionPedidos from '../components/recepcion/PasoSeleccionPedidos';
import PasoEscaneo from '../components/recepcion/PasoEscaneo';
import PasoRevision from '../components/recepcion/PasoRevision';
import PasoResultado from '../components/recepcion/PasoResultado';
import NewProductModal, {
  ModalProductData,
} from '../components/recepcion/NewProductModal';
import WeightScaleModal from '../components/recepcion/WeightScaleModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import RecepcionDraftConflictDialog from '../components/recepcion/RecepcionDraftConflictDialog';
import { useRecepcionDraft } from '../hooks/useRecepcionDraft';
import { delay, serialService } from '../services/serial.service';
import { formatPedidoListNumber } from '../features/pedidos/utils/pedidoFormatters';

/**
 * Computes the reception state for a line based on received vs. ordered quantities.
 *
 * These return values are state-machine tokens used throughout the app's logic
 * (comparisons, API payloads, etc.) and must NOT be translated. Display
 * translations are handled separately via `recepcion.estados.*` i18n keys.
 *
 * @param rec - Quantity actually received.
 * @param ped - Quantity originally ordered.
 * @returns One of the `LineaDraft['estado']` discriminated-union literals.
 */
const calculateEstado = (rec: number, ped: number): LineaDraft['estado'] => {
  if (rec === 0) return 'No entregado';
  if (rec === ped) return 'OK';
  if (rec < ped) return 'Parcial';
  return 'Exceso';
};

/**
 * Returns `true` when the given unit of measure represents a weight-based unit
 * (kilograms, grams or milligrams), which requires the scale workflow instead
 * of integer counting.
 *
 * @param unidad - The unit-of-measure string to test, e.g. `'kg'`, `'uds'`.
 */
const isWeightUnit = (unidad: string | undefined): boolean => {
  if (!unidad) return false;
  const u = unidad.toLowerCase();
  return u === 'kg' || u === 'g' || u === 'mg';
};

/**
 * Returns `true` when `value` is a non-empty, non-whitespace-only string.
 * Used to check whether free-text draft fields (observations, dates, etc.)
 * actually contain meaningful user input.
 *
 * @param value - Optional string to test.
 */
const hasDraftText = (value?: string): boolean =>
  typeof value === 'string' && value.trim().length > 0;

/**
 * Returns `true` when the draft line has a non-empty `cantidadAlbaran` field,
 * meaning the user has entered a delivery-note quantity for this product line.
 *
 * @param linea - The `LineaDraft` to inspect.
 */
const hasCantidadAlbaran = (linea: LineaDraft): boolean =>
  linea.cantidadAlbaran !== '' && linea.cantidadAlbaran != null;

/**
 * Returns `true` when a draft line is considered "active" — i.e. the user has
 * touched it in some way that must be serialised and validated before submission.
 * A line is active if it has been manually intervened, has a positive received
 * quantity, has an albaran quantity, has free-text fields filled in, or has a
 * non-optimal visual state.
 *
 * @param linea - The `LineaDraft` to inspect.
 */
const isLineaDraftActiva = (linea: LineaDraft): boolean =>
  Boolean(
    linea.intervenida ||
    Number(linea.cantidadRecibida) > 0 ||
    hasCantidadAlbaran(linea) ||
    hasDraftText(linea.observaciones) ||
    hasDraftText(linea.fechaCaducidad) ||
    linea.estadoVisual !== EstadoVisualProducto.OPTIMO
  );

type SerialNavigator = Navigator & {
  serial: {
    addEventListener: (
      type: 'connect' | 'disconnect',
      listener: EventListenerOrEventListenerObject
    ) => void;
    removeEventListener: (
      type: 'connect' | 'disconnect',
      listener: EventListenerOrEventListenerObject
    ) => void;
  };
};

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

type RecepcionLocationState = {
  autoResumeRecepcionDraft?: boolean;
};

const getScaleHeaderChipConfig = (
  isScaleSupported: boolean,
  isScaleConnected: boolean,
  isScaleEnabled: boolean,
  isScaleBusy: boolean,
  scaleStatusText: string
) => {
  if (!isScaleSupported) {
    return {
      icon: <WarningAmberIcon />,
      label: scaleStatusText,
      color: 'warning' as const,
    };
  }

  if (isScaleBusy) {
    return {
      icon: <InfoOutlinedIcon />,
      label: scaleStatusText,
      color: 'info' as const,
    };
  }

  if (isScaleConnected && isScaleEnabled) {
    return {
      icon: <CheckCircleIcon />,
      label: scaleStatusText,
      color: 'success' as const,
    };
  }

  if (isScaleConnected) {
    return {
      icon: <InfoOutlinedIcon />,
      label: scaleStatusText,
      color: 'info' as const,
    };
  }

  return {
    icon: <WarningAmberIcon />,
    label: scaleStatusText,
    color: 'default' as const,
  };
};

/**
 * Wizard page that guides the user through the goods-reception process in four
 * sequential steps:
 *
 * 1. **Order Selection** — choose which pending purchase orders to receive.
 * 2. **Scanning & Counting** — scan barcodes or search by name to log received
 *    quantities, optionally using a Web Serial weight scale.
 * 3. **Review & Adjustment** — verify quantities, enter observations and expiry
 *    dates, validate business rules before submission.
 * 4. **Result** — displays the outcome of the completed reception transaction.
 *
 * The component persists a draft to the server in real time and can recover an
 * interrupted reception from a previous session via the recovery dialog.
 */
const Recepcion: React.FC = () => {
  const { t } = useTranslation();

  const steps = [
    t('recepcion.pasos.seleccionPedidos'),
    t('recepcion.pasos.escaneoConteo'),
    t('recepcion.pasos.revisionAjuste'),
    t('recepcion.pasos.resultado'),
  ];

  const [activeStep, setActiveStep] = useState(0);
  const [resultado, setResultado] = useState<RecepcionResultado | null>(null);

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [expandedPanel, setExpandedPanel] = useState<string | false>(false);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);
  const [isRecoveryDialogOpen, setIsRecoveryDialogOpen] = useState(false);

  // Báscula Modal State
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [weightTarget, setWeightTarget] = useState<{
    pIdx: number | null;
    lIdx: number;
  } | null>(null);
  const [capturedWeight, setCapturedWeight] = useState<number | null>(null);
  const [isWeighing, setIsWeighing] = useState(false);
  const [isScaleSupported, setIsScaleSupported] = useState(false);
  const [isScaleConnected, setIsScaleConnected] = useState(false);
  const [isScaleEnabled, setIsScaleEnabled] = useState(false);
  const [isScaleBusy, setIsScaleBusy] = useState(false);
  const [scaleStatusText, setScaleStatusText] = useState(
    t('recepcion.bascula.sinBasculaAutorizada')
  );
  const scaleManuallyDisabledRef = useRef(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const recoveryHandledRef = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  const canCreate = usePermission(PERMISSIONS.recepciones.crear);
  const shouldAutoResumeDraft = Boolean(
    (location.state as RecepcionLocationState | null)?.autoResumeRecepcionDraft
  );

  const {
    applyPendingRecoveryDraft,
    clearDraft: clearRemoteDraft,
    conflict,
    draft,
    isReady,
    keepLocalDraft,
    pendingRecoveryDraft,
    setDraft,
    syncError,
    syncStatus,
    useRemoteDraft,
  } = useRecepcionDraft({
    activeStep,
    autoResume: shouldAutoResumeDraft,
    defaultDraft,
    setActiveStep,
  });
  const draftRef = useRef(draft);
  const scaleHeaderChip = getScaleHeaderChipConfig(
    isScaleSupported,
    isScaleConnected,
    isScaleEnabled,
    isScaleBusy,
    scaleStatusText
  );
  const isSearchingRef = useRef(false);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    if (!isReady || recoveryHandledRef.current || !pendingRecoveryDraft) {
      return;
    }

    recoveryHandledRef.current = true;
    setIsRecoveryDialogOpen(true);
  }, [isReady, pendingRecoveryDraft]);

  useEffect(() => {
    if (activeStep === 1 && searchInputRef.current) {
      // Diferir el focus al siguiente frame para que el DOM esté estable
      // y el focus trap de cualquier modal/dialog previo se haya resuelto.
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }, [activeStep]);

  useEffect(() => {
    const supported = serialService.isSupported();
    setIsScaleSupported(supported);

    if (!supported) {
      setScaleStatusText(t('recepcion.bascula.webSerialNoDisponible'));
      return;
    }

    let cancelled = false;
    const serialNavigator = navigator as SerialNavigator;

    /**
     * Checks whether the browser already has an authorized serial port saved
     * from a previous session and updates scale-status state accordingly.
     */
    const checkAuthorizedScale = async () => {
      setIsScaleBusy(true);

      try {
        const ports = await serialService.getAuthorizedPorts();
        if (cancelled) return;

        if (ports.length > 0) {
          setIsScaleConnected(false);
          setIsScaleEnabled(false);
          setScaleStatusText(t('recepcion.bascula.guardadaListaParaConectar'));
        } else {
          setIsScaleConnected(false);
          setScaleStatusText(t('recepcion.bascula.sinBasculaAutorizada'));
        }
      } catch {
        if (!cancelled) {
          setIsScaleConnected(false);
          setIsScaleStatusDisconnected();
        }
      } finally {
        if (!cancelled) {
          setIsScaleBusy(false);
        }
      }
    };

    /** Handles the Web Serial `connect` event — marks the scale as active. */
    const handleConnect = () => {
      setIsScaleConnected(true);
      setIsScaleEnabled(true);
      setScaleStatusText(t('recepcion.bascula.conectada'));
    };

    /** Handles the Web Serial `disconnect` event — stops reading and resets state. */
    const handleDisconnect = () => {
      serialService.stopContinuousRead();
      setIsScaleConnected(false);
      setIsScaleEnabled(false);
      setIsWeighing(false);
      setCapturedWeight(null);
      setIsScaleStatusDisconnected();
    };

    void checkAuthorizedScale();

    if (serialNavigator.serial?.addEventListener) {
      serialNavigator.serial.addEventListener('connect', handleConnect);
      serialNavigator.serial.addEventListener('disconnect', handleDisconnect);
    }

    return () => {
      cancelled = true;
      if (serialNavigator.serial?.removeEventListener) {
        serialNavigator.serial.removeEventListener('connect', handleConnect);
        serialNavigator.serial.removeEventListener(
          'disconnect',
          handleDisconnect
        );
      }
      serialService.stopContinuousRead();
      void serialService.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Sets the scale status chip to "disconnected" text.
   * Only disables the scale toggle if the user did not manually disable it.
   */
  const setIsScaleStatusDisconnected = () => {
    setScaleStatusText(t('recepcion.bascula.desconectada'));
    if (!scaleManuallyDisabledRef.current) {
      setIsScaleEnabled(false);
    }
  };

  /**
   * Handles the user toggling the scale on or off from the UI switch.
   * When disabled, stops any ongoing continuous read and resets weighing state.
   *
   * @param enabled - Whether the user is enabling (`true`) or disabling (`false`) the scale.
   */
  const handleScaleToggle = (enabled: boolean) => {
    scaleManuallyDisabledRef.current = !enabled;
    setIsScaleEnabled(enabled);

    if (!enabled) {
      serialService.stopContinuousRead();
      setIsWeighing(false);
      setCapturedWeight(null);
      setScaleStatusText(
        isScaleConnected
          ? t('recepcion.bascula.desactivada')
          : t('recepcion.bascula.desconectada')
      );
      return;
    }

    if (isScaleConnected) {
      setScaleStatusText(t('recepcion.bascula.conectada'));
    }
  };

  /**
   * Triggers the browser's native Web Serial port-selection dialog so the user
   * can authorise a new scale device. On success, opens the serial connection
   * and enables the scale. On failure, sets an error message.
   */
  const requestScaleAccess = async () => {
    if (!isScaleSupported) {
      setError(t('recepcion.errors.webSerialNoSoportado'));
      return;
    }

    setIsScaleBusy(true);
    setError(null);

    try {
      // Forzamos el diálogo nativo siempre que den a Vincular, según petición
      const selected = await serialService.requestPort();
      if (!selected) {
        setScaleStatusText(t('recepcion.bascula.seleccionCancelada'));
        return;
      }

      await serialService.connect();
      setIsScaleConnected(true);
      setIsScaleEnabled(true);
      scaleManuallyDisabledRef.current = false;
      setScaleStatusText(t('recepcion.bascula.conectada'));
    } catch {
      setIsScaleConnected(false);
      setScaleStatusText(t('recepcion.bascula.noSePudoConectar'));
      setError(t('recepcion.errors.noPudoAbrirPuerto'));
    } finally {
      setIsScaleBusy(false);
    }
  };

  // Data
  const [pedidosDisponibles, setPedidosDisponibles] = useState<Pedido[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);

  useEffect(() => {
    if (canCreate === false) {
      navigate('/');
    }
  }, [canCreate, navigate]);

  useEffect(() => {
    void loadPedidos();
  }, []);

  // --- 2. Acciones del Backend ---

  /**
   * Fetches all purchase orders in `POR_RECEPCIONAR` state from the backend,
   * paginating automatically until all pages are retrieved (up to 50 pages of
   * 50 items). Deduplicates results by ID and stores them in state.
   */
  const loadPedidos = async () => {
    setLoadingPedidos(true);
    try {
      const estadosRecepcionables = [EstadoPedido.POR_RECEPCIONAR].join(',');

      const pageSize = 50;
      const maxPages = 50;
      let page = 1;
      let totalPages = 1;

      const pedidos: Pedido[] = [];
      const seenIds = new Set<string>();

      while (page <= totalPages && page <= maxPages) {
        const resp = await fetchPedidos(
          page,
          pageSize,
          '',
          estadosRecepcionables
        );
        totalPages = Math.max(Number(resp.totalPages || 1), 1);

        for (const pedido of resp.data as Pedido[]) {
          if (!seenIds.has(pedido.id)) {
            seenIds.add(pedido.id);
            pedidos.push(pedido);
          }
        }

        page += 1;
      }

      setPedidosDisponibles(pedidos);
    } catch {
      setError(t('recepcion.errors.cargarPedidos'));
    } finally {
      setLoadingPedidos(false);
    }
  };

  /**
   * Maps a `Pedido` (purchase order) into an array of `LineaDraft` objects with
   * zero received quantities, ready to be populated during the scanning step.
   *
   * @param pedido - The purchase order to convert.
   */
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
      intervenida: false,
      estado: calculateEstado(0, Number(pp.cantidad)),
      unidad: pp.productoProveedor?.producto?.unidad || UnidadMedida.UNIDAD,
    }));

  /**
   * Creates the draft representation of a pedido (with its lines) to store in
   * the wizard draft state. Builds the human-readable description from the order
   * number and supplier name.
   *
   * @param pedido - The purchase order to wrap.
   */
  const createDraftPedido = (pedido: Pedido) => ({
    id: pedido.id,
    descripcion: `Pedido ${formatPedidoListNumber(pedido, 'pedido-proveedor')} - ${pedido.proveedor?.nombre}`,
    proveedor: pedido.proveedor?.nombre || 'Desconocido',
    lineas: mapPedidoToDraft(pedido),
  });

  /**
   * Selects all available purchase orders that are not already in the draft.
   */
  const handleSelectAll = () => {
    setDraft((prevDraft) => {
      const newDraftPedidos = [...prevDraft.pedidosSeleccionados];
      pedidosDisponibles.forEach((pedido) => {
        if (!newDraftPedidos.some((p) => p.id === pedido.id)) {
          newDraftPedidos.push(createDraftPedido(pedido));
        }
      });
      return { ...prevDraft, pedidosSeleccionados: newDraftPedidos };
    });
  };

  /**
   * Removes all selected purchase orders from the draft.
   */
  const handleDeselectAll = () => {
    setDraft((prevDraft) => ({ ...prevDraft, pedidosSeleccionados: [] }));
  };

  /**
   * Selects all orders from the given supplier (by provider name) that are not
   * already in the draft.
   *
   * @param e - The change event from a select/dropdown control whose `value` is
   *   the provider name string.
   */
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

  /**
   * Removes all draft orders that belong to the given supplier.
   *
   * @param e - The change event from a select/dropdown control whose `value` is
   *   the provider name string.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDeselectProvider = (e: any) => {
    const providerName = e.target.value as string;
    if (!providerName) return;

    setDraft((prevDraft) => {
      const newDraftPedidos = prevDraft.pedidosSeleccionados.filter(
        (p) => p.proveedor !== providerName
      );
      return { ...prevDraft, pedidosSeleccionados: newDraftPedidos };
    });
  };

  /**
   * Toggles a single purchase order in/out of the draft selection.
   *
   * @param pedido - The purchase order to toggle.
   */
  const handleTogglePedido = (pedido: Pedido) => {
    setDraft((prevDraft) => {
      const isSelected = prevDraft.pedidosSeleccionados.some(
        (p) => p.id === pedido.id
      );
      let newPedidos = [...prevDraft.pedidosSeleccionados];

      if (isSelected) {
        newPedidos = newPedidos.filter((p) => p.id !== pedido.id);
      } else {
        newPedidos.push(createDraftPedido(pedido));
      }

      return { ...prevDraft, pedidosSeleccionados: newPedidos };
    });
  };

  // --- 3. Lógica de Escaneo (Paso 2) ---

  /**
   * Performs a product lookup for the current `searchQuery` (or an overriding
   * query string). The lookup sequence is:
   * 1. Local draft (already scanned lines).
   * 2. Backend product database by barcode.
   * 3. OpenFoodFacts (if the query looks like a barcode).
   * 4. Backend product database by name.
   * 5. New-product creation modal (fallback).
   *
   * Concurrent calls are debounced via `isSearchingRef`.
   *
   * @param overrideQuery - Optional query to use instead of `searchQuery`
   *   (useful when called programmatically, e.g. from a barcode scanner event).
   */
  const handleSearch = async (overrideQuery?: string | unknown) => {
    // Si ya estamos buscando o hay un modal abierto, ignoramos la nueva petición
    if (isSearchingRef.current || searching || openModal || weightModalOpen)
      return;

    const queryToUse =
      typeof overrideQuery === 'string' ? overrideQuery : searchQuery;
    if (!queryToUse.trim()) return;

    isSearchingRef.current = true;
    setSearching(true);
    setError(null);

    try {
      // 0. Priorizar búsqueda LOCAL en lo ya recepcionado o pedidos seleccionados
      const localPED = draft.pedidosSeleccionados
        .flatMap((p) => p.lineas)
        .find((l) => l.codigoBarras === queryToUse);
      const localESP = draft.productosEspontaneos.find(
        (l) => l.codigoBarras === queryToUse
      );

      const localMatch = localPED || localESP;
      if (localMatch) {
        processProductFound({
          id: localMatch.idProducto || '',
          codigoBarras: localMatch.codigoBarras,
          nombre: localMatch.nombreProducto,
          unidad: localMatch.unidad as UnidadMedida,
        });
        return;
      }

      // 1. Intentar por código de barras en BD Maestra
      let prod = await getProductoByBarcode(queryToUse);

      // Si no existe pero es un código numérico (escaner), intentar en OpenFoodFacts
      if (!prod && /^\d{8,14}$/.test(queryToUse)) {
        const offProduct = await searchByBarcode(queryToUse);
        if (offProduct) {
          setModalData({
            nombre: offProduct.name,
            marca: offProduct.brand || '',
            unidad: UnidadMedida.UNIDAD,
            tipo: CategoriaProducto.OTRO,
            contenido: 1,
            codigoBarras: queryToUse,
          });
          setOpenModal(true);
          return;
        }
      }

      // 2. Si no hay barcode, intentar búsqueda por nombre (Buscador)
      if (!prod) {
        const results = await searchProductosByName(queryToUse);
        if (results.length === 1) {
          prod = results[0];
        } else if (results.length > 1) {
          // Si hay varios, podríamos mostrar un selector, pero por ahora abrimos modal
          // con el primer resultado sugerido o dejamos al usuario crear
          setModalData({
            nombre: '',
            marca: '',
            unidad: UnidadMedida.KG,
            tipo: CategoriaProducto.OTRO,
            contenido: 1,
            codigoBarras:
              typeof queryToUse === 'string' && /^\d{8,14}$/.test(queryToUse)
                ? queryToUse
                : '',
          });
          setOpenModal(true);
          setSearching(false);
          return;
        }
      }

      if (prod) {
        processProductFound(prod);
      } else {
        // No encontrado -> Modal creación
        setModalData({
          nombre: '',
          marca: '',
          unidad: UnidadMedida.KG,
          tipo: CategoriaProducto.OTRO,
          contenido: 1,
          codigoBarras:
            typeof queryToUse === 'string' && /^\d{8,14}$/.test(queryToUse)
              ? queryToUse
              : '',
        });
        setOpenModal(true);
      }
    } catch {
      setModalData({
        nombre: '',
        marca: '',
        unidad: UnidadMedida.KG,
        tipo: CategoriaProducto.OTRO,
        contenido: 1,
        codigoBarras:
          typeof queryToUse === 'string' && /^\d{8,14}$/.test(queryToUse)
            ? queryToUse
            : '',
      });
      setOpenModal(true);
    } finally {
      isSearchingRef.current = false;
      setSearching(false);
      setSearchQuery('');
      if (searchInputRef.current) {
        requestAnimationFrame(() => searchInputRef.current?.focus());
      }
    }
  };

  /**
   * Processes a successfully resolved product: increments its received quantity
   * in the matching draft line (or spontaneous-product list), handling the weight
   * scale flow for weight-based units.
   *
   * @param prod - Minimal product descriptor returned by the lookup functions.
   */
  const processProductFound = (prod: {
    id: string;
    codigoBarras?: string;
    nombre: string;
    unidad?: UnidadMedida;
  }) => {
    setDraft((prevDraft) => {
      const newPedidos = [...prevDraft.pedidosSeleccionados].map((p) => ({
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
          return prevDraft; // Detenemos aquí
        }

        newPedidos[targetMatch.pIdx].lineas[targetMatch.lIdx] = {
          ...tLinea,
          cantidadRecibida: currRec + 1,
          intervenida: true,
          estado: calculateEstado(currRec + 1, tLinea.cantidadPedida),
        };

        setExpandedPanel(foundPedidoId);
        return { ...prevDraft, pedidosSeleccionados: newPedidos };
      } else {
        // 2. Si no está en pedido, añadir a espontáneos
        const existingEsp = prevDraft.productosEspontaneos.find(
          (l) =>
            l.idProducto === prod.id ||
            (l.codigoBarras === prod.codigoBarras && prod.codigoBarras) ||
            l.nombreProducto.toLowerCase() === prod.nombre.toLowerCase()
        );

        if (existingEsp) {
          const newEsp = prevDraft.productosEspontaneos.map((l) => {
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
                  intervenida: true,
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

          if (isWeightUnit(existingEsp.unidad)) {
            setTimeout(() => openWeightScale(null, indexEsp), 0);
          }
          return { ...prevDraft, productosEspontaneos: newEsp };
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
            intervenida: !isWeightUnit(prod.unidad),
            estado: 'Nuevo',
          };

          if (isWeightUnit(prod.unidad)) {
            setTimeout(
              () =>
                openWeightScale(null, prevDraft.productosEspontaneos.length),
              200
            );
          }
          return {
            ...prevDraft,
            productosEspontaneos: [...prevDraft.productosEspontaneos, newLinea],
          };
        }
      }
    });
  };

  /**
   * Updates a single field on a draft line (either in a selected pedido or in
   * the spontaneous-products list). Recalculates the line's `estado` and
   * `intervenida` flag as needed.
   *
   * @param pIdx - Index of the parent pedido in `pedidosSeleccionados`, or
   *   `null` for spontaneous products.
   * @param lIdx - Index of the line within the pedido (or spontaneous list).
   * @param field - Name of the `LineaDraft` field to update.
   * @param value - New value for the field.
   */
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
    } else if (
      field === 'cantidadAlbaran' &&
      typeof value === 'string' &&
      value !== ''
    ) {
      const numValue = Number(value);
      finalValue = !isNaN(numValue) && numValue >= 0 ? String(numValue) : '0';
    } else if (field === 'cantidadAlbaran' && typeof value === 'number') {
      finalValue = value >= 0 ? String(value) : '0';
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

        if (
          field === 'cantidadRecibida' ||
          field === 'cantidadAlbaran' ||
          field === 'estadoVisual' ||
          field === 'fechaCaducidad' ||
          field === 'observaciones' ||
          field === 'isWeighedWithScale'
        ) {
          newLinea.intervenida = true;
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

        if (
          field === 'cantidadRecibida' ||
          field === 'cantidadAlbaran' ||
          field === 'estadoVisual' ||
          field === 'fechaCaducidad' ||
          field === 'observaciones' ||
          field === 'isWeighedWithScale'
        ) {
          newLinea.intervenida = true;
        }

        if (field === 'cantidadRecibida') {
          newLinea.isWeighedWithScale = false;
        }

        newEsp[lIdx] = newLinea;
        return { ...prevDraft, productosEspontaneos: newEsp };
      }
    });
  };

  /**
   * Opens the weight-scale modal for the specified draft line.
   * Does nothing if the scale is not currently connected.
   *
   * @param pIdx - Parent pedido index, or `null` for spontaneous products.
   * @param lIdx - Line index within the pedido or spontaneous list.
   */
  const openWeightScale = (pIdx: number | null, lIdx: number) => {
    // Si la báscula no está conectada, no abrimos el modal (opcional, pero ayuda a la fluidez)
    if (!isScaleConnected) return;

    setWeightTarget({ pIdx, lIdx });
    setWeightModalOpen(true);
    void startWeighing();
  };

  /**
   * Starts a continuous weight read from the connected serial scale.
   * Updates `capturedWeight` as new readings arrive and sets `isWeighing` state
   * during the read loop. On error or disconnection, cleans up all related state.
   */
  const startWeighing = async () => {
    if (!isScaleConnected || !isScaleEnabled) {
      setError(t('recepcion.errors.basculaNoActiva'));
      return;
    }

    setIsWeighing(true);
    setCapturedWeight(null);
    setScaleStatusText(t('recepcion.bascula.leyendoPeso'));

    try {
      const connected = await serialService.ensureConnection();
      if (!connected) {
        setIsWeighing(false);
        setIsScaleConnected(false);
        setScaleStatusText(t('recepcion.bascula.sinBasculaAutorizada'));
        setError(t('recepcion.errors.sinBasculaDisponible'));
        return;
      }

      setIsScaleConnected(true);
      await delay(75);
      await serialService.restartContinuousRead(
        (weight) => {
          setCapturedWeight(weight);
          setIsWeighing(false);
          setScaleStatusText(t('recepcion.bascula.pesoRecibido'));
        },
        () => {
          setIsWeighing(false);
          setIsScaleConnected(false);
          setScaleStatusText(t('recepcion.bascula.errorLectura'));
          setError(t('recepcion.errors.perdidaComunicacion'));
        }
      );
    } catch {
      setIsWeighing(false);
      setIsScaleConnected(false);
      setScaleStatusText(t('recepcion.bascula.noSePudoLeer'));
      setError(t('recepcion.errors.noSePudoIniciarLectura'));
    }
  };

  /**
   * Commits the current `capturedWeight` to the target draft line and closes the
   * weight-scale modal. No-op if `capturedWeight` or `weightTarget` is null.
   */
  const confirmWeight = () => {
    if (capturedWeight !== null && weightTarget) {
      const { pIdx, lIdx } = weightTarget;
      handleUpdateLinea(pIdx, lIdx, 'cantidadRecibida', capturedWeight);
      handleUpdateLinea(pIdx, lIdx, 'isWeighedWithScale', true);
    }
    closeWeightScale();
  };

  /**
   * Stops any ongoing serial read and closes the weight-scale modal, resetting
   * all weighing-related state.
   */
  const closeWeightScale = () => {
    serialService.stopContinuousRead();
    setWeightModalOpen(false);
    setWeightTarget(null);
    setIsWeighing(false);
    setCapturedWeight(null);
    if (isScaleConnected && isScaleEnabled) {
      setScaleStatusText(t('recepcion.bascula.conectada'));
    }
  };

  // --- 5. Validación y Envío (Paso 3) ---

  /**
   * Validates the current draft state before submission. Checks:
   * - At least one product has a positive received quantity.
   * - All active lines with discrepancies have mandatory observations filled in.
   * - All spontaneous (unplanned) products have observations filled in.
   *
   * Sets `error` state and returns `false` on validation failure.
   *
   * @returns `true` if the draft is valid and ready to submit; `false` otherwise.
   */
  const validarDraft = (): boolean => {
    const errores: Record<string, string[]> = {};
    const isValid = true;

    // Al menos 1 producto con cantidad > 0
    const totalItems = draft.pedidosSeleccionados
      .flatMap((p) => p.lineas)
      .concat(draft.productosEspontaneos);
    const hasReception = totalItems.some((l) => Number(l.cantidadRecibida) > 0);

    if (!hasReception) {
      setError(t('recepcion.errors.minProducto'));
      return false;
    }

    const lineasActivasPedidos = draft.pedidosSeleccionados.flatMap((pedido) =>
      pedido.lineas.filter((linea) => isLineaDraftActiva(linea))
    );

    // Validar observaciones si hay discrepancia
    for (const l of lineasActivasPedidos) {
      const hasDiscrepancy =
        Number(l.cantidadRecibida) !== l.cantidadPedida ||
        (hasCantidadAlbaran(l) &&
          Number(l.cantidadAlbaran) !== l.cantidadPedida) ||
        l.estadoVisual !== EstadoVisualProducto.OPTIMO;

      if (hasDiscrepancy && !hasDraftText(l.observaciones)) {
        setError(
          t('recepcion.errors.discrepanciaObservaciones', {
            nombre: l.nombreProducto,
          })
        );
        return false;
      }
    }

    const lineasActivasEspontaneas = draft.productosEspontaneos.filter(
      (linea) => isLineaDraftActiva(linea)
    );

    for (const esp of lineasActivasEspontaneas) {
      // Los productos espontáneos siempre son discrepancias (exceso no planificado)
      if (!hasDraftText(esp.observaciones)) {
        setError(
          t('recepcion.errors.espontaneoObservaciones', {
            nombre: esp.nombreProducto || esp.productoNuevo?.nombre,
          })
        );
        return false;
      }
    }

    setDraft({ ...draft, erroresPorLinea: errores });
    return isValid;
  };

  /**
   * Validates the draft and submits it to the backend via `createRecepcion`.
   * On success, advances to the result step and clears the remote draft.
   * On failure, sets a descriptive error message. Handles the special case
   * where the referenced order no longer exists (ORDER_NOT_FOUND).
   */
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
        .filter((l) => isLineaDraftActiva(l) && Number(l.cantidadRecibida) > 0)
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
        setError(t('recepcion.errors.pedidoNoEncontrado'));
      } else {
        setError(
          t('recepcion.errors.errorTransaccion', { detalle: errorMessage })
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 5. Render Helpers ---

  /**
   * Returns the JSX content for the currently active wizard step.
   *
   * @param step - Zero-based step index.
   */
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

  /** Renders Step 1 — Order Selection. */
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

  /** Renders Step 2 — Scanning & Counting. */
  const renderStep2 = () => (
    <PasoEscaneo
      searchInputRef={searchInputRef}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      onSearch={handleSearch}
      searching={searching}
      isScaleSupported={isScaleSupported}
      isScaleConnected={isScaleConnected}
      isScaleEnabled={isScaleEnabled}
      setIsScaleEnabled={handleScaleToggle}
      isScaleBusy={isScaleBusy}
      onRequestScaleAccess={requestScaleAccess}
      draft={draft}
      setDraft={setDraft}
      expandedPanel={expandedPanel}
      setExpandedPanel={setExpandedPanel}
      onUpdateLinea={handleUpdateLinea}
      isWeightUnit={isWeightUnit}
      onOpenWeightScale={openWeightScale}
    />
  );

  /** Renders Step 3 — Review & Adjustment. */
  const renderStep3 = () => (
    <PasoRevision
      draft={draft}
      setDraft={setDraft}
      expandedPanel={expandedPanel}
      setExpandedPanel={setExpandedPanel}
      onUpdateLinea={handleUpdateLinea}
    />
  );

  /** Renders Step 4 — Result. */
  const renderStep4 = () => (
    <PasoResultado resultado={resultado} onResetWizard={resetWizard} />
  );

  /**
   * Resets the entire wizard back to step 0: clears the remote draft, resets
   * local result/error state and reloads the available purchase orders.
   */
  const resetWizard = async () => {
    await clearRemoteDraft();
    setActiveStep(0);
    setResultado(null);
    setError(null);
    await loadPedidos();
  };

  /**
   * Applies the pending recovery draft and closes the recovery dialog.
   */
  const handleRecoverDraft = () => {
    applyPendingRecoveryDraft();
    setIsRecoveryDialogOpen(false);
  };

  /**
   * Discards the pending recovery draft and resets the wizard to a clean state.
   */
  const handleDiscardRecoveredDraft = () => {
    setIsRecoveryDialogOpen(false);
    recoveryHandledRef.current = true;
    void resetWizard();
  };

  /**
   * Advances the wizard to the next step.
   * If on the last editable step (step 2), triggers form submission instead.
   * Guards against advancing from step 0 when no orders are selected.
   */
  const handleNext = () => {
    if (activeStep === 0 && draft.pedidosSeleccionados.length === 0) return;
    if (activeStep === 2) {
      handleSubmit();
    } else {
      const nextStep = activeStep + 1;
      setActiveStep(nextStep);
      setDraft((prev) => {
        const pasos: PasoWizard[] = [
          'SELECCION_PEDIDOS',
          'ESCANEO_LOTE',
          'REVISION_FINAL',
          'RESULTADO',
        ];
        return { ...prev, paso: pasos[nextStep] };
      });
    }
  };

  /**
   * Returns the wizard to the previous step and updates the draft's `paso`
   * field accordingly.
   */
  const handleBack = () => {
    const prevStep = activeStep - 1;
    setActiveStep(prevStep);
    setDraft((prev) => {
      const pasos: PasoWizard[] = [
        'SELECCION_PEDIDOS',
        'ESCANEO_LOTE',
        'REVISION_FINAL',
        'RESULTADO',
      ];
      return { ...prev, paso: pasos[prevStep] };
    });
  };

  // --- 6. Modal Nuevo Producto ---

  const [modalData, setModalData] = useState<ModalProductData>({
    nombre: '',
    marca: '',
    unidad: UnidadMedida.KG,
    tipo: CategoriaProducto.OTRO,
    contenido: 1,
    codigoBarras: '',
  });

  /**
   * Handles confirmation from the new-product modal: creates a new spontaneous
   * `LineaDraft` and appends it to `productosEspontaneos`. If the product is
   * weight-based and the scale is active, opens the weighing modal after a short
   * delay to allow the modal to close first.
   */
  const handleConfirmNewProduct = () => {
    const isWeight = isWeightUnit(modalData.unidad);
    const newLinea: LineaDraft = {
      pedidoProductoId: null,
      idProducto: '',
      codigoBarras: modalData.codigoBarras,
      nombreProducto: modalData.nombre,
      unidad: modalData.unidad,
      cantidadPedida: 0,
      cantidadAlbaran: '',
      cantidadRecibida: isWeight ? 0 : 1, // Start at 0 for weighable items until weighed
      isWeighedWithScale: false,
      estadoVisual: EstadoVisualProducto.OPTIMO,
      fechaCaducidad: '',
      observaciones: '',
      intervenida: !isWeight,
      estado: 'Nuevo',
      productoNuevo: {
        pendienteCreacion: true,
        codigoBarras: modalData.codigoBarras,
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
      codigoBarras: '',
    });

    if (isWeight && isScaleConnected && isScaleEnabled) {
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
            gap: 2,
            flexWrap: 'wrap',
            mb: 4,
          }}
        >
          <Typography variant="h4" component="h1">
            {t('recepcion.titulo')}
          </Typography>
          <Box
            id="recepcion-sync-status"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
              justifyContent: { xs: 'flex-start', md: 'flex-end' },
              minWidth: 120,
              minHeight: 32,
            }}
          >
            {activeStep === 1 && (
              <Tooltip
                title={t('recepcion.bascula.estadoTooltip', {
                  estado: scaleHeaderChip.label,
                })}
              >
                <Chip
                  icon={scaleHeaderChip.icon}
                  label={scaleHeaderChip.label}
                  size="small"
                  color={scaleHeaderChip.color}
                  variant="outlined"
                />
              </Tooltip>
            )}
            {syncStatus === 'saving' && (
              <Tooltip title={t('recepcion.sync.guardandoTooltip')}>
                <Chip
                  icon={<SaveIcon />}
                  label={t('recepcion.sync.guardando')}
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              </Tooltip>
            )}
            {syncStatus === 'synced' && (
              <Tooltip title={t('recepcion.sync.sincronizadoTooltip')}>
                <Chip
                  icon={<CheckCircleIcon />}
                  label={t('recepcion.sync.sincronizado')}
                  size="small"
                  color="success"
                  variant="outlined"
                />
              </Tooltip>
            )}
            {syncStatus === 'error' && (
              <Tooltip title={syncError || t('recepcion.sync.errorTooltip')}>
                <Chip
                  icon={<ErrorOutlineIcon />}
                  label={t('recepcion.sync.error')}
                  size="small"
                  color="error"
                  variant="outlined"
                />
              </Tooltip>
            )}
            {syncStatus === 'conflict' && (
              <Tooltip title={t('recepcion.sync.conflictoTooltip')}>
                <Chip
                  icon={<WarningAmberIcon />}
                  label={t('recepcion.sync.conflicto')}
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              </Tooltip>
            )}
          </Box>
        </Box>

        {!isReady ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 10,
              gap: 2,
            }}
          >
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary">
              {t('recepcion.recuperandoBorrador')}
            </Typography>
          </Box>
        ) : (
          <>
            <Stepper
              id="recepcion-stepper"
              activeStep={activeStep}
              sx={{ mb: 4 }}
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && (
              <Alert
                severity="error"
                sx={{ mb: 3 }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}

            {!error && syncError && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                {syncError}
              </Alert>
            )}

            {renderStepContent(activeStep)}
          </>
        )}

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
              id="btn-discard-recepcion"
              variant="outlined"
              onClick={() => setIsDiscardDialogOpen(true)}
              color="secondary"
            >
              {t('recepcion.acciones.descartar')}
            </Button>

            <Box>
              <Button
                id="btn-back-step"
                disabled={activeStep === 0 || isSubmitting}
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                {t('recepcion.acciones.atras')}
              </Button>
              <Button
                id="btn-next-step"
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
                    ? t('recepcion.acciones.procesando')
                    : t('recepcion.acciones.finalizarRecepcion')
                  : t('recepcion.acciones.siguiente')}
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
        statusText={scaleStatusText}
        onClose={closeWeightScale}
        onStartWeighing={() => {
          void startWeighing();
        }}
        onConfirmWeight={confirmWeight}
        productName={(() => {
          if (!weightTarget) return '';
          const { pIdx, lIdx } = weightTarget;
          if (pIdx !== null) {
            return (
              draft.pedidosSeleccionados[pIdx]?.lineas[lIdx]?.nombreProducto ||
              ''
            );
          }
          return draft.productosEspontaneos[lIdx]?.nombreProducto || '';
        })()}
      />

      <RecepcionDraftConflictDialog
        open={!!conflict}
        remoteDraft={conflict?.remoteDraft}
        onUseRemote={useRemoteDraft}
        onKeepLocal={keepLocalDraft}
      />

      <ConfirmDialog
        isOpen={isRecoveryDialogOpen && !!pendingRecoveryDraft}
        onClose={handleRecoverDraft}
        onConfirm={handleRecoverDraft}
        title={t('recepcion.recovery.titulo')}
        message={
          <>
            {t('recepcion.recovery.mensaje')}
            <br />
            <br />
            {t('recepcion.recovery.ultimaActualizacion')}{' '}
            <strong>
              {(() => {
                const updatedAt =
                  pendingRecoveryDraft?.updatedAt ??
                  draft.serverUpdatedAt ??
                  draft.modificadoEn;
                if (!updatedAt) {
                  return t('recepcion.recovery.fechaDesconocida');
                }

                const parsed = new Date(updatedAt);
                if (Number.isNaN(parsed.getTime())) {
                  return t('recepcion.recovery.fechaDesconocida');
                }

                return parsed.toLocaleString('es-ES');
              })()}
            </strong>
          </>
        }
        confirmText={t('recepcion.recovery.confirmar')}
        cancelText={t('recepcion.recovery.cancelar')}
        confirmColor="primary"
        onCancel={handleDiscardRecoveredDraft}
      />

      <ConfirmDialog
        isOpen={isDiscardDialogOpen}
        onClose={() => setIsDiscardDialogOpen(false)}
        onConfirm={() => {
          setIsDiscardDialogOpen(false);
          void resetWizard();
        }}
        title={t('recepcion.descartar.titulo')}
        message={t('recepcion.descartar.mensaje')}
        confirmText={t('recepcion.descartar.confirmar')}
        cancelText={t('recepcion.descartar.cancelar')}
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
        <Typography variant="h6">{t('recepcion.procesando.titulo')}</Typography>
        <Typography variant="body2">
          {t('recepcion.procesando.descripcion')}
        </Typography>
      </Backdrop>
    </Box>
  );
};

export default Recepcion;
