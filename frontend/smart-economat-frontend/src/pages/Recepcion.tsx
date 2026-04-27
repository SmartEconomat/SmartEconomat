import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';

const calculateEstado = (
  rec: number,
  ped: number,
  t: (key: string) => string
): LineaDraft['estado'] => {
  if (rec === 0)
    return t('recepcion.status.noEntregado') as LineaDraft['estado'];
  if (rec === ped) return t('recepcion.status.ok') as LineaDraft['estado'];
  if (rec < ped) return t('recepcion.status.parcial') as LineaDraft['estado'];
  return t('recepcion.status.exceso') as LineaDraft['estado'];
};

const isWeightUnit = (unidad: string | undefined): boolean => {
  if (!unidad) return false;
  const u = unidad.toLowerCase();
  return u === 'kg' || u === 'g' || u === 'mg';
};

const hasDraftText = (value?: string): boolean =>
  typeof value === 'string' && value.trim().length > 0;

const hasCantidadAlbaran = (linea: LineaDraft): boolean =>
  linea.cantidadAlbaran !== '' && linea.cantidadAlbaran != null;

const isLineaDraftActiva = (linea: LineaDraft): boolean =>
  Boolean(
    linea.intervenida ||
    Number(linea.cantidadRecibida) > 0 ||
    hasCantidadAlbaran(linea) ||
    hasDraftText(linea.observaciones) ||
    hasDraftText(linea.fechaCaducidad) ||
    linea.estadoVisual !== EstadoVisualProducto.OPTIMO
  );

const getSteps = (t: (key: string) => string) => [
  t('recepcion.stepper.selection'),
  t('recepcion.stepper.scanning'),
  t('recepcion.stepper.review'),
  t('recepcion.stepper.result'),
];

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
  scaleStatusText: string,
  t: TFunction
) => {
  if (!isScaleSupported) {
    return {
      icon: <WarningAmberIcon />,
      label: t('recepcion.scale.notAvailable'),
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

const Recepcion: React.FC = () => {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState(0);
  const steps = getSteps(t);
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
    t('recepcion.scale.notAuthorized')
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
    scaleStatusText,
    t
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

  const setIsScaleStatusDisconnected = useCallback(() => {
    setScaleStatusText(t('recepcion.scale.disconnected'));
    if (!scaleManuallyDisabledRef.current) {
      setIsScaleEnabled(false);
    }
  }, [t]);

  useEffect(() => {
    const supported = serialService.isSupported();
    setIsScaleSupported(supported);

    if (!supported) {
      setScaleStatusText(t('recepcion.scale.notAvailable'));
      return;
    }

    let cancelled = false;
    const serialNavigator = navigator as SerialNavigator;

    const checkAuthorizedScale = async () => {
      setIsScaleBusy(true);

      try {
        const ports = await serialService.getAuthorizedPorts();
        if (cancelled) return;

        if (ports.length > 0) {
          setIsScaleConnected(false);
          setIsScaleEnabled(false);
          setScaleStatusText(t('recepcion.scale.deactivated'));
        } else {
          setIsScaleConnected(false);
          setScaleStatusText(t('recepcion.scale.notAuthorized'));
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

    const handleConnect = () => {
      setIsScaleConnected(true);
      setIsScaleEnabled(true);
      setScaleStatusText(t('recepcion.scale.connected'));
    };

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
  }, [setIsScaleStatusDisconnected, t]);

  const handleScaleToggle = (enabled: boolean) => {
    scaleManuallyDisabledRef.current = !enabled;
    setIsScaleEnabled(enabled);

    if (!enabled) {
      serialService.stopContinuousRead();
      setIsWeighing(false);
      setCapturedWeight(null);
      setScaleStatusText(
        isScaleConnected
          ? t('recepcion.scale.deactivated')
          : t('recepcion.scale.disconnected')
      );
      return;
    }

    if (isScaleConnected) {
      setScaleStatusText(t('recepcion.scale.connected'));
    }
  };

  const requestScaleAccess = async () => {
    if (!isScaleSupported) {
      setError(t('recepcion.scale.noSupport'));
      return;
    }

    setIsScaleBusy(true);
    setError(null);

    try {
      // Forzamos el diálogo nativo siempre que den a Vincular, según petición
      const selected = await serialService.requestPort();
      if (!selected) {
        setScaleStatusText(t('recepcion.scale.notAuthorized'));
        return;
      }

      await serialService.connect();
      setIsScaleConnected(true);
      setIsScaleEnabled(true);
      scaleManuallyDisabledRef.current = false;
      setScaleStatusText('Báscula conectada');
    } catch {
      setIsScaleConnected(false);
      setScaleStatusText(t('recepcion.scale.disconnected'));
      setError(t('recepcion.scale.portError'));
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

  const loadPedidos = useCallback(async () => {
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
      setError(t('recepcion.feedback.loadPedidosError'));
    } finally {
      setLoadingPedidos(false);
    }
  }, [t]);

  useEffect(() => {
    void loadPedidos();
  }, [loadPedidos]);

  // --- 2. Acciones del Backend ---

  const mapPedidoToDraft = (pedido: Pedido): LineaDraft[] =>
    (pedido.pedidoProductos || []).map((pp: PedidoProducto) => ({
      pedidoProductoId: pp.id,
      idProducto: pp.productoProveedor?.producto?.id,
      codigoBarras: pp.productoProveedor?.producto?.codigoBarras,
      nombreProducto:
        pp.productoProveedor?.producto?.nombre || t('recepcion.table.product'),
      cantidadPedida: Number(pp.cantidad),
      cantidadAlbaran: '',
      cantidadRecibida: 0,
      isWeighedWithScale: false,
      estadoVisual: EstadoVisualProducto.OPTIMO,
      fechaCaducidad: '',
      observaciones: '',
      intervenida: false,
      estado: calculateEstado(0, Number(pp.cantidad), t),
      unidad: pp.productoProveedor?.producto?.unidad || UnidadMedida.UNIDAD,
    }));

  // Helper para crear el objeto del pedido en el draft
  const createDraftPedido = (pedido: Pedido) => ({
    id: pedido.id,
    descripcion: `Pedido ${formatPedidoListNumber(pedido, 'pedido-proveedor')} - ${pedido.proveedor?.nombre}`,
    proveedor: pedido.proveedor?.nombre || t('recepcion.feedback.desconocido'),
    lineas: mapPedidoToDraft(pedido),
  });

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

  const handleDeselectAll = () => {
    setDraft((prevDraft) => ({ ...prevDraft, pedidosSeleccionados: [] }));
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

    setDraft((prevDraft) => {
      const newDraftPedidos = prevDraft.pedidosSeleccionados.filter(
        (p) => p.proveedor !== providerName
      );
      return { ...prevDraft, pedidosSeleccionados: newDraftPedidos };
    });
  };

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
          estado: calculateEstado(currRec + 1, tLinea.cantidadPedida, t),
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
                  estado: t('recepcion.status.exceso') as LineaDraft['estado'],
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
            estado: t('recepcion.status.nuevo') as LineaDraft['estado'],
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
            newLinea.cantidadPedida,
            t
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

  const openWeightScale = (pIdx: number | null, lIdx: number) => {
    // Si la báscula no está conectada, no abrimos el modal (opcional, pero ayuda a la fluidez)
    if (!isScaleConnected) return;

    setWeightTarget({ pIdx, lIdx });
    setWeightModalOpen(true);
    void startWeighing();
  };

  const startWeighing = async () => {
    if (!isScaleConnected || !isScaleEnabled) {
      setError(t('recepcion.feedback.scaleNotEnabled'));
      return;
    }

    setIsWeighing(true);
    setCapturedWeight(null);
    setScaleStatusText('Leyendo peso en tiempo real');

    try {
      const connected = await serialService.ensureConnection();
      if (!connected) {
        setIsWeighing(false);
        setIsScaleConnected(false);
        setScaleStatusText(t('recepcion.status.noScaleAuthorized'));
        setError(t('recepcion.feedback.noScaleFound'));
        return;
      }

      setIsScaleConnected(true);
      await delay(75);
      await serialService.restartContinuousRead(
        (weight) => {
          setCapturedWeight(weight);
          setIsWeighing(false);
          setScaleStatusText('Peso recibido desde báscula');
        },
        () => {
          setIsWeighing(false);
          setIsScaleConnected(false);
          setScaleStatusText(t('recepcion.status.scaleError'));
          setError(t('recepcion.feedback.scaleCommunicationLost'));
        }
      );
    } catch {
      setIsWeighing(false);
      setIsScaleConnected(false);
      setScaleStatusText(t('recepcion.status.scaleReadError'));
      setError(t('recepcion.feedback.scaleReadError'));
    }
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
    serialService.stopContinuousRead();
    setWeightModalOpen(false);
    setWeightTarget(null);
    setIsWeighing(false);
    setCapturedWeight(null);
    if (isScaleConnected && isScaleEnabled) {
      setScaleStatusText('Báscula conectada');
    }
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
      setError(t('recepcion.feedback.noReceptionItems'));
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
          t('recepcion.feedback.discrepancyNoteRequired', {
            product: l.nombreProducto,
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
          t('recepcion.feedback.spontaneousNoteRequired', {
            product: esp.nombreProducto || esp.productoNuevo?.nombre,
          })
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
        setError(t('recepcion.feedback.orderNotFound'));
      } else {
        setError(
          t('recepcion.feedback.transactionError', { message: errorMessage })
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

  const handleRecoverDraft = () => {
    applyPendingRecoveryDraft();
    setIsRecoveryDialogOpen(false);
  };

  const handleDiscardRecoveredDraft = () => {
    setIsRecoveryDialogOpen(false);
    recoveryHandledRef.current = true;
    void resetWizard();
  };

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
            {t('recepcion.title')}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
              justifyContent: { xs: 'flex-start', md: 'flex-end' },
            }}
          >
            {activeStep === 1 && (
              <Tooltip title={`Estado de báscula: ${scaleHeaderChip.label}`}>
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
              <Tooltip title="Sincronizando borrador con el servidor">
                <Chip
                  icon={<SaveIcon />}
                  label={t('common.saving')}
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
                  label={t('common.synced')}
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
                  label={t('common.syncError')}
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
                  label={t('common.conflict')}
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
              {t('recepcion.feedback.recoveringDraft')}
            </Typography>
          </Box>
        ) : (
          <>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
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
              variant="outlined"
              onClick={() => setIsDiscardDialogOpen(true)}
              color="secondary"
            >
              {t('common.discard')}
            </Button>

            <Box>
              <Button
                disabled={activeStep === 0 || isSubmitting}
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                {t('common.back')}
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
                    ? t('common.processing')
                    : t('recepcion.actions.finish')
                  : t('common.next')}
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
        title={t('recepcion.dialogs.recoveryTitle')}
        message={
          <>
            {t('recepcion.dialogs.recoveryMessage')}
            <br />
            <br />
            Última actualización:{' '}
            <strong>
              {(() => {
                const updatedAt =
                  pendingRecoveryDraft?.updatedAt ?? draft.serverUpdatedAt;
                if (!updatedAt) {
                  return 'desconocida';
                }

                const parsed = new Date(updatedAt);
                if (Number.isNaN(parsed.getTime())) {
                  return 'desconocida';
                }

                return parsed.toLocaleString('es-ES');
              })()}
            </strong>
          </>
        }
        confirmText={t('recepcion.actions.recover')}
        cancelText={t('recepcion.actions.discard')}
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
        title={t('recepcion.dialogs.discardTitle')}
        message={t('recepcion.dialogs.discardMessage')}
        confirmText={t('recepcion.actions.discardConfirm')}
        cancelText={t('common.cancel')}
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
        <Typography variant="h6">
          {t('recepcion.feedback.processingMassive')}
        </Typography>
        <Typography variant="body2">
          {t('recepcion.feedback.acidWarning')}
        </Typography>
      </Backdrop>
    </Box>
  );
};

export default Recepcion;
