import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  ListSubheader,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { normalizeNumericInput } from '../utils/numberUtils';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import DataTable, { Column } from '../components/ui/DataTable';
import PageToolbar from '../components/ui/PageToolbar';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import HistoryIcon from '@mui/icons-material/History';
import StatusChip from '../components/ui/StatusChip';
import {
  cancelDistribucion,
  confirmDistribucion,
  createDistribucion,
  fetchDistribucionById,
  fetchDistribuciones,
  fetchDistribucionesDisponibles,
} from '../services/distribucion.service';
import type {
  CreateDistribucionPayload,
  Distribucion,
  DistribucionDisponible,
} from '../services/distribucion.types';
import { baseFetch, parseApiResponse } from '../services/api.service';
import { UbicacionService } from '../services/ubicacion.service';
import type { Ubicacion } from '../services/ubicacion.types';
import { useAuth } from '../store/auth.hooks';
import { useToast } from '../store/toast.hooks';
import { usePermission } from '../store/auth.hooks';
import { PERMISSIONS } from '../sherlock-auth/permissions.constants';
import { TipoMovimiento } from '../services/movimiento.types';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatLocalizedDateTime } from '../utils/intlFormat';

type DistribucionTab = 'disponibles' | 'historial';

type DraftLineState = {
  pedidoUsuarioLineaId: string;
  productoNombre: string;
  cantidadPendiente: number;
  cantidad: string;
  observaciones: string;
};

type PerfilDistribucion = {
  ubicacionId?: string | null;
  ubicaciones?: Array<{ id: string; nombre?: string }> | null;
};

type DistribucionLocationState = {
  prefillSearchTerm?: string;
  openDetailDistribucionId?: string;
};

const collectUbicacionIdsFromPerfil = (
  perfil?: PerfilDistribucion | null
): string[] => {
  if (!perfil) {
    return [];
  }

  const ids = new Set<string>();
  if (perfil.ubicacionId) {
    ids.add(perfil.ubicacionId);
  }
  for (const u of perfil.ubicaciones ?? []) {
    if (u?.id) {
      ids.add(u.id);
    }
  }
  return Array.from(ids);
};

const DistribucionPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const toast = useToast();
  const canList = usePermission(PERMISSIONS.distribuciones.listar);
  const canCreate = usePermission(PERMISSIONS.distribuciones.crear);
  const canConfirm = usePermission(PERMISSIONS.distribuciones.confirmar);
  const canCancel = usePermission(PERMISSIONS.distribuciones.cancelar);

  const [activeTab, setActiveTab] = useState<DistribucionTab>('disponibles');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disponibles, setDisponibles] = useState<DistribucionDisponible[]>([]);
  const [historial, setHistorial] = useState<Distribucion[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [totalItems, setTotalItems] = useState(0);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [userUbicacionIds, setUserUbicacionIds] = useState<string[]>([]);
  const [distributeOpen, setDistributeOpen] = useState(false);
  const [selectedDisponible, setSelectedDisponible] =
    useState<DistribucionDisponible | null>(null);
  const [selectedHistorial, setSelectedHistorial] =
    useState<Distribucion | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [originId, setOriginId] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [draftLines, setDraftLines] = useState<DraftLineState[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [sortConfigDisponibles, setSortConfigDisponibles] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [sortConfigHistorial, setSortConfigHistorial] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleSortDisponibles = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (
      sortConfigDisponibles &&
      sortConfigDisponibles.key === key &&
      sortConfigDisponibles.direction === 'asc'
    ) {
      direction = 'desc';
    }
    setSortConfigDisponibles({ key, direction });
  };

  const handleSortHistorial = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (
      sortConfigHistorial &&
      sortConfigHistorial.key === key &&
      sortConfigHistorial.direction === 'asc'
    ) {
      direction = 'desc';
    }
    setSortConfigHistorial({ key, direction });
  };

  const preferredUbicacionIds = useMemo(() => {
    const pedidoUserUbicaciones = selectedDisponible?.ubicacionesUsuario ?? [];
    const suggestedDestinationId =
      selectedDisponible?.ubicacionDestinoSugerida?.id || '';

    const preferredIds = new Set<string>();

    pedidoUserUbicaciones.forEach((ubicacion) => {
      if (ubicacion.id) {
        preferredIds.add(ubicacion.id);
      }
    });

    if (suggestedDestinationId) {
      preferredIds.add(suggestedDestinationId);
    }

    if (preferredIds.size > 0) {
      return Array.from(preferredIds);
    }

    return userUbicacionIds;
  }, [selectedDisponible, userUbicacionIds]);

  useEffect(() => {
    if (canList === false) {
      navigate('/');
    }
  }, [canList, navigate]);

  const loadUserUbicaciones = useCallback(async () => {
    if (!user?.id) {
      setUserUbicacionIds([]);
      return;
    }

    const profileResponse = await baseFetch('/usuarios/perfil');
    const profileResult = await parseApiResponse<PerfilDistribucion>(
      profileResponse,
      t('distribucion.toast.errorDetalle')
    );

    const profileUbicacionIds = collectUbicacionIdsFromPerfil(
      profileResult.data
    );

    if (profileUbicacionIds.length > 0) {
      setUserUbicacionIds(profileUbicacionIds);
      return;
    }

    setUserUbicacionIds([]);
  }, [t, user?.id]);

  const loadUbicaciones = useCallback(async () => {
    const data = await UbicacionService.findAll();
    setUbicaciones(data);

    const ubicacionPrincipal = data.find(
      (ubicacion) => ubicacion.nombre === 'Almacén Principal'
    );
    setOriginId(
      (current) => current || ubicacionPrincipal?.id || data[0]?.id || ''
    );
  }, []);

  const loadDisponibles = useCallback(async () => {
    const data = await fetchDistribucionesDisponibles({
      searchTerm,
      limit: 50,
    });
    setDisponibles(data);
  }, [searchTerm]);

  const loadHistorial = useCallback(async () => {
    const data = await fetchDistribuciones({
      page,
      limit: pageSize,
      searchTerm,
    });
    setHistorial(data.data);
    setTotalItems(data.total);
  }, [page, pageSize, searchTerm]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadUbicaciones(), loadUserUbicaciones()]);
      if (activeTab === 'disponibles') {
        await loadDisponibles();
      } else {
        await loadHistorial();
      }
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : t('distribucion.toast.errorDistribucion');
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [
    activeTab,
    loadDisponibles,
    loadHistorial,
    loadUbicaciones,
    loadUserUbicaciones,
    t,
  ]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const getFirstUserUbicacionId = useCallback(() => {
    const ownIds = new Set(preferredUbicacionIds);
    return (
      ubicaciones.find(
        (ubicacion) => ownIds.has(ubicacion.id) && ubicacion.id !== originId
      )?.id || ''
    );
  }, [originId, preferredUbicacionIds, ubicaciones]);

  const getFirstAvailableDestinationId = useCallback(() => {
    const ownIds = new Set(preferredUbicacionIds);
    return (
      ubicaciones.find(
        (ubicacion) => ownIds.has(ubicacion.id) && ubicacion.id !== originId
      )?.id || ''
    );
  }, [originId, preferredUbicacionIds, ubicaciones]);

  const getInitialDestinationId = useCallback(
    (disponible: DistribucionDisponible) => {
      const suggestedDestinationId =
        disponible.ubicacionDestinoSugerida?.id || '';

      if (
        suggestedDestinationId &&
        suggestedDestinationId !== originId &&
        preferredUbicacionIds.includes(suggestedDestinationId)
      ) {
        return getFirstUserUbicacionId() || suggestedDestinationId;
      }

      return getFirstUserUbicacionId() || getFirstAvailableDestinationId();
    },
    [
      getFirstAvailableDestinationId,
      getFirstUserUbicacionId,
      originId,
      preferredUbicacionIds,
    ]
  );

  const resolveValidDestinationId = useCallback(
    (disponible: DistribucionDisponible, availableUbicaciones: Ubicacion[]) => {
      const validDestinationIds = new Set(
        availableUbicaciones
          .filter((ubicacion) => ubicacion.id !== originId)
          .map((ubicacion) => ubicacion.id)
      );

      const candidateIds = Array.from(
        new Set([
          destinationId,
          disponible.ubicacionDestinoSugerida?.id || '',
          ...(disponible.ubicacionesUsuario || []).map(
            (ubicacion) => ubicacion.id
          ),
          ...preferredUbicacionIds,
          ...availableUbicaciones.map((ubicacion) => ubicacion.id),
        ])
      );

      return (
        candidateIds.find(
          (candidateId) => candidateId && validDestinationIds.has(candidateId)
        ) || ''
      );
    },
    [destinationId, originId, preferredUbicacionIds]
  );

  const openDistributeDialog = (disponible: DistribucionDisponible) => {
    setSelectedDisponible(disponible);
    setDestinationId(getInitialDestinationId(disponible));
    setObservaciones('');
    setDraftLines(
      disponible.lineas.map((linea) => ({
        pedidoUsuarioLineaId: linea.pedidoUsuarioLineaId,
        productoNombre: linea.productoNombre,
        cantidadPendiente: linea.cantidadPendiente,
        cantidad: linea.cantidadPendiente.toString(),
        observaciones: '',
      }))
    );
    setDistributeOpen(true);
  };

  useEffect(() => {
    if (!distributeOpen || !selectedDisponible) {
      return;
    }

    const suggestedDestinationId =
      selectedDisponible.ubicacionDestinoSugerida?.id || '';
    const preferredDestinationId = getInitialDestinationId(selectedDisponible);

    if (!preferredDestinationId) {
      return;
    }

    setDestinationId((current) => {
      if (!current || current === suggestedDestinationId) {
        return preferredDestinationId;
      }

      return current;
    });
  }, [getInitialDestinationId, distributeOpen, selectedDisponible]);

  const closeDistributeDialog = () => {
    if (submitting) return;
    setDistributeOpen(false);
    setSelectedDisponible(null);
    setDraftLines([]);
    setObservaciones('');
  };

  const handleDraftLineChange = (
    pedidoUsuarioLineaId: string,
    field: 'cantidad' | 'observaciones',
    value: string
  ) => {
    setDraftLines((current) =>
      current.map((linea) =>
        linea.pedidoUsuarioLineaId === pedidoUsuarioLineaId
          ? { ...linea, [field]: value }
          : linea
      )
    );
  };

  const handleCreateDistribucion = async () => {
    if (!selectedDisponible) return;

    const lineas = draftLines
      .map((linea) => ({
        pedidoUsuarioLineaId: linea.pedidoUsuarioLineaId,
        cantidad: Number(linea.cantidad),
        observaciones: linea.observaciones || undefined,
        cantidadPendiente: linea.cantidadPendiente,
      }))
      .filter((linea) => linea.cantidad > 0);

    if (lineas.length === 0) {
      toast.error(t('distribucion.toast.lineaRequerida'));
      return;
    }

    const invalidLine = lineas.find(
      (linea) =>
        Number.isNaN(linea.cantidad) || linea.cantidad > linea.cantidadPendiente
    );

    if (invalidLine) {
      toast.error(t('distribucion.toast.lineasInvalidas'));
      return;
    }

    if (!destinationId) {
      toast.error(t('distribucion.toast.destinoRequerido'));
      return;
    }

    const effectiveDestinationId = resolveValidDestinationId(
      selectedDisponible,
      ubicaciones
    );

    if (!effectiveDestinationId) {
      toast.error(t('distribucion.toast.destinoNoValido'));
      return;
    }

    if (effectiveDestinationId === originId) {
      toast.error(t('distribucion.toast.destinoIgualOrigen'));
      return;
    }

    if (effectiveDestinationId !== destinationId) {
      setDestinationId(effectiveDestinationId);
    }

    const payload: CreateDistribucionPayload = {
      pedidoUsuarioId: selectedDisponible.pedidoUsuarioId,
      ubicacionOrigenId: originId || undefined,
      ubicacionDestinoId: effectiveDestinationId,
      alumnoSlotId: selectedDisponible.alumnoSlot?.id,
      observaciones: observaciones || undefined,
      lineas: lineas.map((linea) => ({
        pedidoUsuarioLineaId: linea.pedidoUsuarioLineaId,
        cantidad: linea.cantidad,
        observaciones: linea.observaciones,
      })),
    };

    setSubmitting(true);
    try {
      await createDistribucion(payload);
      toast.success(t('distribucion.toast.distribucionRealizada'));
      closeDistributeDialog();
      await loadData();
      setActiveTab('historial');
    } catch (createError) {
      const errorMessage =
        createError instanceof Error
          ? createError.message
          : t('distribucion.toast.errorDistribucion');

      const normalizedError = errorMessage.toLowerCase();
      if (
        normalizedError.includes('ubicación destino no encontrada') ||
        normalizedError.includes('ubicacion destino no encontrada')
      ) {
        const refreshedUbicaciones = await UbicacionService.findAll();
        setUbicaciones(refreshedUbicaciones);

        const refreshedFallbackId = resolveValidDestinationId(
          selectedDisponible,
          refreshedUbicaciones
        );
        if (refreshedFallbackId) {
          setDestinationId(refreshedFallbackId);
        }

        toast.error(t('distribucion.toast.errorUbicacionDestino'));
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await confirmDistribucion(id);
      toast.success(t('distribucion.toast.distribucionConfirmada'));
      await loadData();
      if (selectedHistorial?.id === id) {
        const detail = await fetchDistribucionById(id);
        setSelectedHistorial(detail);
      }
    } catch (confirmError) {
      toast.error(
        confirmError instanceof Error
          ? confirmError.message
          : t('distribucion.toast.errorConfirmar')
      );
    }
  };

  const handleCancel = async (id: string) => {
    const motivo =
      window.prompt(t('distribucion.motivoCancelacion')) || undefined;
    try {
      await cancelDistribucion(id, motivo);
      toast.success(t('distribucion.toast.distribucionCancelada'));
      await loadData();
      if (selectedHistorial?.id === id) {
        setDetailOpen(false);
        setSelectedHistorial(null);
      }
    } catch (cancelError) {
      toast.error(
        cancelError instanceof Error
          ? cancelError.message
          : t('distribucion.toast.errorCancelar')
      );
    }
  };

  const handleViewDetail = useCallback(
    async (id: string) => {
      try {
        const detail = await fetchDistribucionById(id);
        setSelectedHistorial(detail);
        setDetailOpen(true);
      } catch (detailError) {
        toast.error(
          detailError instanceof Error
            ? detailError.message
            : t('distribucion.toast.errorDetalle')
        );
      }
    },
    [t, toast]
  );

  const handleOpenMovimientosTrace = useCallback(
    (distribucionId: string) => {
      setDetailOpen(false);
      navigate('/movimientos', {
        state: {
          prefillSearchTerm: distribucionId,
          prefillTypes: [
            TipoMovimiento.SALIDA_DISTRIBUCION,
            TipoMovimiento.ENTRADA_DISTRIBUCION,
          ],
        },
      });
    },
    [navigate]
  );

  useEffect(() => {
    const routeState = location.state as DistribucionLocationState | null;
    if (!routeState) {
      return;
    }

    const prefillSearchTerm = routeState.prefillSearchTerm?.trim();
    if (prefillSearchTerm) {
      setSearchTerm(prefillSearchTerm);
      setActiveTab('historial');
    }

    const detailId = routeState.openDetailDistribucionId?.trim();
    if (detailId) {
      setActiveTab('historial');
      void handleViewDetail(detailId);
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [handleViewDetail, location.pathname, location.state, navigate]);

  const disponiblesColumns: Column<DistribucionDisponible>[] = useMemo(
    () => [
      {
        id: 'numeroGlobal',
        label: t('distribucion.columns.pedido'),
        render: (row) => `#${row.numeroGlobal}`,
        sortable: true,
        sortType: 'number',
      },
      {
        id: 'usuario',
        label: t('distribucion.columns.usuario'),
        render: (row) => row.usuario?.nombre || row.usuario?.username || '—',
        sortable: true,
        sortType: 'string',
      },
      {
        id: 'alumnoSlot',
        label: t('distribucion.columns.aula'),
        render: (row) =>
          row.alumnoSlot
            ? t('distribucion.tabla.aulaClase', {
                aula: row.alumnoSlot.aula,
                numeroClase: row.alumnoSlot.numeroClase,
              })
            : t('distribucion.empty.sinAula'),
        sortable: true,
        sortType: 'string',
      },
      {
        id: 'lineas',
        label: t('distribucion.columns.pendiente'),
        render: (row) => {
          const totalPendiente = row.lineas.reduce(
            (sum, linea) => sum + linea.cantidadPendiente,
            0
          );
          return t('distribucion.tabla.resumenPendiente', {
            count: row.lineas.length,
            total: totalPendiente.toFixed(3),
          });
        },
        sortable: true,
        sortType: 'number',
      },
      {
        id: 'ubicacionDestinoSugerida',
        label: t('distribucion.columns.destinoSugerido'),
        render: (row) =>
          row.ubicacionDestinoSugerida?.nombre ||
          t('distribucion.columns.destino'),
        sortable: true,
        sortType: 'string',
      },
      {
        id: 'estado',
        label: t('distribucion.columns.estadoPedido'),
        render: (row) => <StatusChip status={row.estado} />,
        sortable: true,
        sortType: 'string',
      },
    ],
    [t]
  );

  const sortedDisponibles = useMemo(() => {
    if (!sortConfigDisponibles) return disponibles;

    const { key, direction } = sortConfigDisponibles;
    return [...disponibles].sort((a, b) => {
      let valA: string | number | boolean | null | undefined;
      let valB: string | number | boolean | null | undefined;

      switch (key) {
        case 'numeroGlobal':
          valA = Number(a.numeroGlobal);
          valB = Number(b.numeroGlobal);
          break;
        case 'usuario':
          valA = (a.usuario?.nombre || a.usuario?.username || '').toLowerCase();
          valB = (b.usuario?.nombre || b.usuario?.username || '').toLowerCase();
          break;
        case 'alumnoSlot':
          valA = (a.alumnoSlot?.aula || '').toLowerCase();
          valB = (b.alumnoSlot?.aula || '').toLowerCase();
          break;
        case 'lineas':
          valA = a.lineas.reduce((sum, l) => sum + l.cantidadPendiente, 0);
          valB = b.lineas.reduce((sum, l) => sum + l.cantidadPendiente, 0);
          break;
        case 'ubicacionDestinoSugerida':
          valA = (a.ubicacionDestinoSugerida?.nombre || '').toLowerCase();
          valB = (b.ubicacionDestinoSugerida?.nombre || '').toLowerCase();
          break;
        case 'estado':
          valA = (a.estado || '').toLowerCase();
          valB = (b.estado || '').toLowerCase();
          break;
        default:
          valA = (a as unknown as Record<string, string | number>)[key];
          valB = (b as unknown as Record<string, string | number>)[key];
      }

      if (valA === undefined || valA === null)
        return direction === 'asc' ? -1 : 1;
      if (valB === undefined || valB === null)
        return direction === 'asc' ? 1 : -1;
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [disponibles, sortConfigDisponibles]);

  const historialColumns: Column<Distribucion>[] = useMemo(
    () => [
      {
        id: 'pedidoUsuario',
        label: t('distribucion.columns.pedido'),
        render: (row) => `#${row.pedidoUsuario?.numeroGlobal || '—'}`,
        sortable: true,
        sortType: 'number',
      },
      {
        id: 'estado',
        label: t('distribucion.columns.estado'),
        render: (row) => <StatusChip status={row.estado} />,
        sortable: true,
        sortType: 'string',
      },
      {
        id: 'ubicacionOrigen',
        label: t('distribucion.columns.origen'),
        render: (row) => row.ubicacionOrigen?.nombre || '—',
        sortable: true,
        sortType: 'string',
      },
      {
        id: 'ubicacionDestino',
        label: t('distribucion.columns.destino'),
        render: (row) => row.ubicacionDestino?.nombre || '—',
        sortable: true,
        sortType: 'string',
      },
      {
        id: 'fechaPreparacion',
        label: t('distribucion.columns.fechaEntrega'),
        render: (row) => formatLocalizedDateTime(row.fechaPreparacion),
        sortable: true,
        sortType: 'date',
      },
      {
        id: 'lineas',
        label: t('distribucion.columns.lineas'),
        render: (row) => `${row.lineas?.length || 0}`,
        sortable: true,
        sortType: 'number',
      },
    ],
    [t]
  );

  const sortedHistorial = useMemo(() => {
    if (!sortConfigHistorial) return historial;

    const { key, direction } = sortConfigHistorial;
    return [...historial].sort((a, b) => {
      let valA: string | number | boolean | null | undefined;
      let valB: string | number | boolean | null | undefined;

      switch (key) {
        case 'pedidoUsuario':
          valA = Number(a.pedidoUsuario?.numeroGlobal || 0);
          valB = Number(b.pedidoUsuario?.numeroGlobal || 0);
          break;
        case 'estado':
          valA = (a.estado || '').toLowerCase();
          valB = (b.estado || '').toLowerCase();
          break;
        case 'ubicacionOrigen':
          valA = (a.ubicacionOrigen?.nombre || '').toLowerCase();
          valB = (b.ubicacionOrigen?.nombre || '').toLowerCase();
          break;
        case 'ubicacionDestino':
          valA = (a.ubicacionDestino?.nombre || '').toLowerCase();
          valB = (b.ubicacionDestino?.nombre || '').toLowerCase();
          break;
        case 'fechaPreparacion':
          valA = new Date(a.fechaPreparacion).getTime();
          valB = new Date(b.fechaPreparacion).getTime();
          break;
        case 'lineas':
          valA = a.lineas?.length || 0;
          valB = b.lineas?.length || 0;
          break;
        default:
          valA = (a as unknown as Record<string, string | number>)[key];
          valB = (b as unknown as Record<string, string | number>)[key];
      }

      if (valA === undefined || valA === null)
        return direction === 'asc' ? -1 : 1;
      if (valB === undefined || valB === null)
        return direction === 'asc' ? 1 : -1;
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [historial, sortConfigHistorial]);

  const renderDisponiblesActions = (row: DistribucionDisponible) => (
    <Tooltip title={t('distribucion.actions.distribuir')}>
      <span>
        <IconButton
          id="btn-distribuir-stock"
          size="small"
          color="primary"
          disabled={!canCreate}
          onClick={() => openDistributeDialog(row)}
        >
          <CallSplitIcon fontSize="small" />
        </IconButton>
      </span>
    </Tooltip>
  );

  const renderHistorialActions = (row: Distribucion) => {
    const isRecipient = user?.id === row.pedidoUsuario?.usuario?.id;
    const canConfirmAction = canConfirm && isRecipient;

    return (
      <Stack direction="row" spacing={0.5} justifyContent="center">
        {(row.estado === 'preparada' || row.estado === 'borrador') && (
          <Tooltip
            title={
              !isRecipient
                ? t('distribucion.actions.soloDestinatario')
                : t('distribucion.actions.confirmarRecepcion')
            }
          >
            <span>
              <IconButton
                id="btn-confirmar-entrega"
                size="small"
                color="success"
                disabled={!canConfirmAction}
                onClick={(e) => {
                  e.stopPropagation();
                  void handleConfirm(row.id);
                }}
              >
                <CheckCircleOutlineIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}
        {!['entregada', 'parcial', 'cancelada'].includes(row.estado) && (
          <Tooltip title={t('distribucion.actions.cancelarEntrega')}>
            <span>
              <IconButton
                size="small"
                color="error"
                disabled={!canCancel}
                onClick={(e) => {
                  e.stopPropagation();
                  void handleCancel(row.id);
                }}
              >
                <CancelOutlinedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Stack>
    );
  };

  const detailLineas = selectedHistorial?.lineas || [];

  const ownUserUbicaciones = useMemo(() => {
    const ownIds = new Set(preferredUbicacionIds);

    return ubicaciones.filter((ubicacion) => ownIds.has(ubicacion.id));
  }, [preferredUbicacionIds, ubicaciones]);

  const usingFallbackDestinationOptions = useMemo(
    () => ownUserUbicaciones.length === 0 && ubicaciones.length > 0,
    [ownUserUbicaciones, ubicaciones]
  );

  const userUbicaciones = useMemo(() => {
    if (ownUserUbicaciones.length > 0) {
      return ownUserUbicaciones;
    }

    return ubicaciones;
  }, [ownUserUbicaciones, ubicaciones]);

  const selectedOriginUbicacion = useMemo(
    () => ubicaciones.find((ubicacion) => ubicacion.id === originId) || null,
    [originId, ubicaciones]
  );

  const hasAvailableDestinationOptions = useMemo(
    () => userUbicaciones.some((ubicacion) => ubicacion.id !== originId),
    [originId, userUbicaciones]
  );

  const destinationHelperText = useMemo(() => {
    if (!selectedOriginUbicacion) {
      return '';
    }

    if (!hasAvailableDestinationOptions) {
      return t('distribucion.helper.sinUbicaciones', {
        nombre: selectedOriginUbicacion.nombre,
      });
    }

    if (usingFallbackDestinationOptions) {
      return t('distribucion.helper.fallbackUbicaciones', {
        nombre: selectedOriginUbicacion.nombre,
      });
    }

    return t('distribucion.helper.soloPropias', {
      nombre: selectedOriginUbicacion.nombre,
    });
  }, [
    hasAvailableDestinationOptions,
    selectedOriginUbicacion,
    t,
    usingFallbackDestinationOptions,
  ]);

  const visibleUserUbicaciones = useMemo(
    () => userUbicaciones.filter((ubicacion) => ubicacion.id !== originId),
    [originId, userUbicaciones]
  );

  const renderDestinoMenuItems = useCallback(() => {
    const items: React.ReactNode[] = [];

    if (visibleUserUbicaciones.length > 0) {
      items.push(
        <ListSubheader key="user-locations-header" disableSticky>
          {t('distribucion.helper.ubicacionesUsuario')}
        </ListSubheader>
      );
    }

    visibleUserUbicaciones.forEach((ubicacion) => {
      items.push(
        <MenuItem key={ubicacion.id} value={ubicacion.id}>
          {ubicacion.nombre}
        </MenuItem>
      );
    });

    return items;
  }, [t, visibleUserUbicaciones]);

  useEffect(() => {
    if (!distributeOpen || !selectedDisponible) {
      return;
    }

    setDestinationId((current) => {
      if (current && current !== originId) {
        return current;
      }

      return getInitialDestinationId(selectedDisponible);
    });
  }, [getInitialDestinationId, originId, distributeOpen, selectedDisponible]);

  return (
    <Box>
      <PageToolbar
        title={t('distribucion.titulo')}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchId="search-distribucion"
        searchPlaceholder={t('distribucion.searchPlaceholder')}
        totalItems={
          activeTab === 'disponibles' ? disponibles.length : totalItems
        }
        totalItemsLabel={
          activeTab === 'disponibles'
            ? t('distribucion.totalItemsDisponibles')
            : t('distribucion.totalItemsHistorial')
        }
      />

      <Paper
        elevation={2}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          id="distribucion-tabs"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_event, value: DistribucionTab) => setActiveTab(value)}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab
              value="disponibles"
              label={t('distribucion.tabs.disponibles')}
              icon={<LocalShippingOutlinedIcon />}
            />
            <Tab
              value="historial"
              label={t('distribucion.tabs.historial')}
              icon={<HistoryIcon />}
            />
          </Tabs>
        </Box>

        <Box id="distribucion-content-area" sx={{ p: { xs: 2, sm: 4 } }}>
          {!loading && error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {activeTab === 'disponibles' ? (
            <DataTable
              columns={disponiblesColumns}
              data={sortedDisponibles}
              isLoading={loading}
              emptyStateMessage={t('distribucion.empty.sinPedidos')}
              renderActions={renderDisponiblesActions}
              onRowClick={openDistributeDialog}
              actionsLabel={t('distribucion.actions.distribuir')}
              hideTopBar
              sortConfig={sortConfigDisponibles || undefined}
              onSort={handleSortDisponibles}
            />
          ) : (
            <DataTable
              columns={historialColumns}
              data={sortedHistorial}
              isLoading={loading}
              emptyStateMessage={t('distribucion.empty.sinDistribuciones')}
              renderActions={renderHistorialActions}
              onRowClick={(row) => void handleViewDetail(row.id)}
              actionsLabel={t('comun.acciones')}
              hideTopBar
              sortConfig={sortConfigHistorial || undefined}
              onSort={handleSortHistorial}
              pagination={{
                currentPage: page,
                totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
                totalItems,
                pageSize,
                onPageChange: (_event, nextPage) => setPage(nextPage),
              }}
            />
          )}
        </Box>
      </Paper>

      <Dialog
        open={distributeOpen}
        onClose={closeDistributeDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {t('distribucion.dialog.nuevaEntrega')}{' '}
          {selectedDisponible ? `#${selectedDisponible.numeroGlobal}` : ''}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label={t('distribucion.dialog.ubicacionOrigen')}
              value={originId}
              onChange={(event) => setOriginId(event.target.value)}
            >
              {ubicaciones.map((ubicacion) => (
                <MenuItem key={ubicacion.id} value={ubicacion.id}>
                  {ubicacion.nombre}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label={t('distribucion.dialog.ubicacionDestino')}
              value={destinationId}
              onChange={(event) => setDestinationId(event.target.value)}
              helperText={destinationHelperText}
              error={!hasAvailableDestinationOptions}
            >
              {renderDestinoMenuItems()}
            </TextField>

            <TextField
              label={t('distribucion.dialog.observaciones')}
              value={observaciones}
              onChange={(event) => setObservaciones(event.target.value)}
              multiline
              minRows={2}
            />

            <Typography variant="subtitle2" color="text.secondary">
              {t('distribucion.dialog.lineasEntregar')}
            </Typography>

            {draftLines.map((linea) => (
              <Box
                key={linea.pedidoUsuarioLineaId}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 2,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                  {linea.productoNombre}
                </Typography>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <TextField
                    label={t('distribucion.dialog.cantidadPendiente')}
                    value={linea.cantidadPendiente}
                    InputProps={{ readOnly: true }}
                    fullWidth
                  />
                  <TextField
                    label={t('distribucion.dialog.cantidadEntregar')}
                    type="text"
                    inputProps={{
                      inputMode: 'decimal',
                      pattern: '[0-9]*[.,]?[0-9]*',
                    }}
                    value={linea.cantidad}
                    onChange={(event) =>
                      handleDraftLineChange(
                        linea.pedidoUsuarioLineaId,
                        'cantidad',
                        normalizeNumericInput(event.target.value)
                      )
                    }
                    fullWidth
                  />
                  <TextField
                    label={t('distribucion.dialog.observaciones')}
                    value={linea.observaciones}
                    onChange={(event) =>
                      handleDraftLineChange(
                        linea.pedidoUsuarioLineaId,
                        'observaciones',
                        event.target.value
                      )
                    }
                    fullWidth
                  />
                </Stack>
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDistributeDialog} disabled={submitting}>
            {t('distribucion.dialog.cancelar')}
          </Button>
          <Button
            onClick={() => void handleCreateDistribucion()}
            disabled={submitting || !canCreate}
            variant="contained"
          >
            {t('distribucion.dialog.distribuir')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {t('distribucion.detail.titulo')}{' '}
          {selectedHistorial?.pedidoUsuario?.numeroGlobal
            ? `#${selectedHistorial.pedidoUsuario.numeroGlobal}`
            : ''}
        </DialogTitle>
        <DialogContent dividers>
          {selectedHistorial && (
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  label={t('distribucion.detail.estado')}
                  value={selectedHistorial.estado}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
                <TextField
                  label={t('distribucion.detail.origen')}
                  value={selectedHistorial.ubicacionOrigen?.nombre || ''}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
                <TextField
                  label={t('distribucion.detail.destino')}
                  value={selectedHistorial.ubicacionDestino?.nombre || ''}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
              </Stack>

              <Typography variant="subtitle2" color="text.secondary">
                {t('distribucion.detail.lineas')}
              </Typography>
              {detailLineas.map((linea) => (
                <Box
                  key={linea.id}
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    p: 2,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {linea.productoProveedor?.producto?.nombre ||
                      t('comun.producto')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('distribucion.detail.pedido')}: {linea.cantidadPedida} ·{' '}
                    {t('distribucion.detail.recepcionado')}:{' '}
                    {linea.cantidadRecepcionadaAtribuida} ·{' '}
                    {t('distribucion.detail.yaDistribuido')}:{' '}
                    {linea.cantidadYaDistribuida} ·{' '}
                    {t('distribucion.detail.preparado')}:{' '}
                    {linea.cantidadADistribuir} ·{' '}
                    {t('distribucion.detail.entregado')}:{' '}
                    {linea.cantidadEntregada}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
          <Box>
            {(selectedHistorial?.estado === 'preparada' ||
              selectedHistorial?.estado === 'borrador') && (
              <Stack direction="row" spacing={1}>
                <Tooltip
                  title={
                    user?.id !== selectedHistorial?.pedidoUsuario?.usuario?.id
                      ? t('distribucion.actions.soloDestinatario')
                      : ''
                  }
                >
                  <span>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<CheckCircleOutlineIcon />}
                      disabled={
                        !canConfirm ||
                        user?.id !==
                          selectedHistorial?.pedidoUsuario?.usuario?.id
                      }
                      onClick={() => void handleConfirm(selectedHistorial.id)}
                    >
                      {t('distribucion.detail.confirmarRecepcion')}
                    </Button>
                  </span>
                </Tooltip>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelOutlinedIcon />}
                  disabled={!canCancel}
                  onClick={() => void handleCancel(selectedHistorial.id)}
                >
                  {t('distribucion.detail.cancelarEntrega')}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() =>
                    handleOpenMovimientosTrace(selectedHistorial.id)
                  }
                >
                  {t('distribucion.detail.verMovimientos')}
                </Button>
              </Stack>
            )}
          </Box>
          <Button onClick={() => setDetailOpen(false)} color="inherit">
            {t('distribucion.detail.cerrar')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DistribucionPage;
