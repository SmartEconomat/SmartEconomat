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
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import CallSplitIcon from '@mui/icons-material/CallSplit';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import DataTable, { Column } from '../components/ui/DataTable';
import PageToolbar from '../components/ui/PageToolbar';
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
import { profesorService } from '../services/profesor.service';
import { UbicacionService } from '../services/ubicacion.service';
import type { Ubicacion } from '../services/ubicacion.types';
import { useAuth } from '../store/auth.hooks';
import { useToast } from '../store/toast.hooks';
import { usePermission } from '../store/auth.hooks';
import { useNavigate } from 'react-router-dom';

type DistribucionTab = 'disponibles' | 'historial';

type DraftLineState = {
  pedidoUsuarioLineaId: string;
  productoNombre: string;
  cantidadPendiente: number;
  cantidad: string;
  observaciones: string;
};

type PerfilDistribucion = {
  profesor?: {
    slots?: Array<{
      ubicacionId?: string;
      ubicacion?: {
        id?: string;
      } | null;
    }> | null;
  } | null;
  alumno?: {
    slot?: {
      ubicacionId?: string;
      ubicacion?: {
        id?: string;
      } | null;
    } | null;
  } | null;
};

const collectUbicacionIdsFromPerfil = (
  perfil?: PerfilDistribucion | null
): string[] => {
  if (!perfil) {
    return [];
  }

  const profesorUbicacionIds =
    perfil.profesor?.slots
      ?.map((slot) => slot.ubicacionId ?? slot.ubicacion?.id)
      .filter((ubicacionId): ubicacionId is string => Boolean(ubicacionId)) ??
    [];

  const alumnoUbicacionId =
    perfil.alumno?.slot?.ubicacionId ?? perfil.alumno?.slot?.ubicacion?.id;

  return Array.from(
    new Set(
      alumnoUbicacionId
        ? [...profesorUbicacionIds, alumnoUbicacionId]
        : profesorUbicacionIds
    )
  );
};

const DistribucionPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const canList = usePermission('distribuciones:listar');
  const canCreate = usePermission('distribuciones:crear');
  const canConfirm = usePermission('distribuciones:confirmar');
  const canCancel = usePermission('distribuciones:cancelar');
  const userRole = user?.rol?.toUpperCase() || '';

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

    if (pedidoUserUbicaciones.length > 0) {
      return pedidoUserUbicaciones.map((ubicacion) => ubicacion.id);
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
      'No se pudo obtener la ubicación del usuario.'
    );

    const profileUbicacionIds = collectUbicacionIdsFromPerfil(
      profileResult.data
    );

    if (profileUbicacionIds.length > 0) {
      setUserUbicacionIds(profileUbicacionIds);
      return;
    }

    if (userRole === 'PROFESOR') {
      const response = await profesorService.getSlots();
      if (response.status < 200 || response.status >= 300) {
        throw new Error(
          response.message || 'No se pudieron cargar las aulas del profesor.'
        );
      }

      const ubicacionIds = Array.from(
        new Set(
          response.data
            .map((slot) => slot.ubicacionId)
            .filter((ubicacionId): ubicacionId is string => !!ubicacionId)
        )
      );

      setUserUbicacionIds(ubicacionIds);
      return;
    }

    setUserUbicacionIds([]);
  }, [user?.id, userRole]);

  const loadUbicaciones = useCallback(async () => {
    const data = await UbicacionService.findAll();
    setUbicaciones(data);

    const almacenPrincipal = data.find(
      (ubicacion) => ubicacion.nombre === 'Almacén Principal'
    );
    setOriginId(
      (current) => current || almacenPrincipal?.id || data[0]?.id || ''
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
          : 'Error al cargar distribución';
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
      toast.error(
        'Debes indicar al menos una línea con cantidad a distribuir.'
      );
      return;
    }

    const invalidLine = lineas.find(
      (linea) =>
        Number.isNaN(linea.cantidad) || linea.cantidad > linea.cantidadPendiente
    );

    if (invalidLine) {
      toast.error(
        'Hay líneas con cantidades inválidas o superiores al pendiente.'
      );
      return;
    }

    if (!destinationId) {
      toast.error('Debes seleccionar una ubicación destino.');
      return;
    }

    if (destinationId === originId) {
      toast.error('La ubicación destino no puede ser la misma que la origen.');
      return;
    }

    const payload: CreateDistribucionPayload = {
      pedidoUsuarioId: selectedDisponible.pedidoUsuarioId,
      ubicacionOrigenId: originId || undefined,
      ubicacionDestinoId: destinationId,
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
      toast.success('Distribución realizada con éxito.');
      closeDistributeDialog();
      await loadData();
      setActiveTab('historial');
    } catch (createError) {
      toast.error(
        createError instanceof Error
          ? createError.message
          : 'No se pudo realizar la distribución.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await confirmDistribucion(id);
      toast.success('Distribución confirmada y stock trasladado.');
      await loadData();
      if (selectedHistorial?.id === id) {
        const detail = await fetchDistribucionById(id);
        setSelectedHistorial(detail);
      }
    } catch (confirmError) {
      toast.error(
        confirmError instanceof Error
          ? confirmError.message
          : 'No se pudo confirmar la distribución.'
      );
    }
  };

  const handleCancel = async (id: string) => {
    const motivo =
      window.prompt('Motivo de cancelación (opcional):') || undefined;
    try {
      await cancelDistribucion(id, motivo);
      toast.success('Distribución cancelada.');
      await loadData();
      if (selectedHistorial?.id === id) {
        setDetailOpen(false);
        setSelectedHistorial(null);
      }
    } catch (cancelError) {
      toast.error(
        cancelError instanceof Error
          ? cancelError.message
          : 'No se pudo cancelar la distribución.'
      );
    }
  };

  const handleViewDetail = async (id: string) => {
    try {
      const detail = await fetchDistribucionById(id);
      setSelectedHistorial(detail);
      setDetailOpen(true);
    } catch (detailError) {
      toast.error(
        detailError instanceof Error
          ? detailError.message
          : 'No se pudo cargar el detalle.'
      );
    }
  };

  const disponiblesColumns: Column<DistribucionDisponible>[] = useMemo(
    () => [
      {
        id: 'numeroGlobal',
        label: 'Pedido',
        render: (row) => `#${row.numeroGlobal}`,
        sortable: true,
      },
      {
        id: 'usuario',
        label: 'Usuario',
        render: (row) => row.usuario?.nombre || row.usuario?.username || '—',
        sortable: true,
      },
      {
        id: 'alumnoSlot',
        label: 'Aula',
        render: (row) =>
          row.alumnoSlot
            ? `${row.alumnoSlot.aula} · Clase ${row.alumnoSlot.numeroClase}`
            : 'Sin aula',
        sortable: true,
      },
      {
        id: 'lineas',
        label: 'Pendiente',
        render: (row) => {
          const totalPendiente = row.lineas.reduce(
            (sum, linea) => sum + linea.cantidadPendiente,
            0
          );
          return `${row.lineas.length} línea(s) · ${totalPendiente.toFixed(3)}`;
        },
        sortable: true,
      },
      {
        id: 'ubicacionDestinoSugerida',
        label: 'Destino sugerido',
        render: (row) =>
          row.ubicacionDestinoSugerida?.nombre || 'Sin sugerencia',
        sortable: true,
      },
      {
        id: 'estado',
        label: 'Estado pedido',
        render: (row) => <StatusChip status={row.estado} />,
        sortable: true,
      },
    ],
    []
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
        label: 'Pedido',
        render: (row) => `#${row.pedidoUsuario?.numeroGlobal || '—'}`,
        sortable: true,
      },
      {
        id: 'estado',
        label: 'Estado',
        render: (row) => <StatusChip status={row.estado} />,
        sortable: true,
      },
      {
        id: 'ubicacionOrigen',
        label: 'Origen',
        render: (row) => row.ubicacionOrigen?.nombre || '—',
        sortable: true,
      },
      {
        id: 'ubicacionDestino',
        label: 'Destino',
        render: (row) => row.ubicacionDestino?.nombre || '—',
        sortable: true,
      },
      {
        id: 'fechaPreparacion',
        label: 'Fecha Entrega',
        render: (row) => new Date(row.fechaPreparacion).toLocaleString(),
        sortable: true,
      },
      {
        id: 'lineas',
        label: 'Líneas',
        render: (row) => `${row.lineas?.length || 0}`,
        sortable: true,
      },
    ],
    []
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
    <Tooltip title="Distribuir productos">
      <span>
        <IconButton
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
                ? 'Solo el destinatario puede confirmar la recepción'
                : 'Confirmar recepción'
            }
          >
            <span>
              <IconButton
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
          <Tooltip title="Cancelar entrega">
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

  const userUbicaciones = useMemo(() => {
    const ownIds = new Set(preferredUbicacionIds);

    return ubicaciones.filter((ubicacion) => ownIds.has(ubicacion.id));
  }, [preferredUbicacionIds, ubicaciones]);

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
      return `No hay ubicaciones disponibles del usuario porque el origen actual es ${selectedOriginUbicacion.nombre}.`;
    }

    return `Solo se muestran las ubicaciones del usuario, excluyendo ${selectedOriginUbicacion.nombre} por estar en origen.`;
  }, [hasAvailableDestinationOptions, selectedOriginUbicacion]);

  const visibleUserUbicaciones = useMemo(
    () => userUbicaciones.filter((ubicacion) => ubicacion.id !== originId),
    [originId, userUbicaciones]
  );

  const renderDestinoMenuItems = useCallback(() => {
    const items: React.ReactNode[] = [];

    if (visibleUserUbicaciones.length > 0) {
      items.push(
        <ListSubheader key="user-locations-header" disableSticky>
          Ubicaciones del usuario
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
  }, [visibleUserUbicaciones]);

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
        title="Distribución Interna"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por pedido, usuario o aula..."
        totalItems={
          activeTab === 'disponibles' ? disponibles.length : totalItems
        }
        totalItemsLabel={
          activeTab === 'disponibles'
            ? 'pedidos distribuibles'
            : 'distribuciones'
        }
      />

      <Tabs
        value={activeTab}
        onChange={(_event, value: DistribucionTab) => setActiveTab(value)}
        sx={{ mb: 2 }}
      >
        <Tab value="disponibles" label="Disponibles" />
        <Tab value="historial" label="Historial" />
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {activeTab === 'disponibles' ? (
        <DataTable
          columns={disponiblesColumns}
          data={sortedDisponibles}
          isLoading={loading}
          emptyStateMessage="No hay pedidos listos para distribuir."
          renderActions={renderDisponiblesActions}
          onRowClick={openDistributeDialog}
          actionsLabel="Distribuir"
          hideTopBar
          sortConfig={sortConfigDisponibles || undefined}
          onSort={handleSortDisponibles}
        />
      ) : (
        <DataTable
          columns={historialColumns}
          data={sortedHistorial}
          isLoading={loading}
          emptyStateMessage="No hay distribuciones registradas."
          renderActions={renderHistorialActions}
          onRowClick={(row) => void handleViewDetail(row.id)}
          actionsLabel="Acciones"
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

      <Dialog
        open={distributeOpen}
        onClose={closeDistributeDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Nueva Entrega{' '}
          {selectedDisponible ? `#${selectedDisponible.numeroGlobal}` : ''}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              label="Ubicación origen"
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
              label="Ubicación destino"
              value={destinationId}
              onChange={(event) => setDestinationId(event.target.value)}
              helperText={destinationHelperText}
              error={!hasAvailableDestinationOptions}
            >
              {renderDestinoMenuItems()}
            </TextField>

            <TextField
              label="Observaciones"
              value={observaciones}
              onChange={(event) => setObservaciones(event.target.value)}
              multiline
              minRows={2}
            />

            <Typography variant="subtitle2" color="text.secondary">
              Líneas a entregar
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
                    label="Cantidad pendiente"
                    value={linea.cantidadPendiente}
                    InputProps={{ readOnly: true }}
                    fullWidth
                  />
                  <TextField
                    label="Cantidad a entregar"
                    type="number"
                    value={linea.cantidad}
                    onChange={(event) =>
                      handleDraftLineChange(
                        linea.pedidoUsuarioLineaId,
                        'cantidad',
                        event.target.value
                      )
                    }
                    fullWidth
                  />
                  <TextField
                    label="Observaciones"
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
            Cancelar
          </Button>
          <Button
            onClick={() => void handleCreateDistribucion()}
            disabled={submitting || !canCreate}
            variant="contained"
          >
            Distribuir
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
          Detalle de distribución{' '}
          {selectedHistorial?.pedidoUsuario?.numeroGlobal
            ? `#${selectedHistorial.pedidoUsuario.numeroGlobal}`
            : ''}
        </DialogTitle>
        <DialogContent dividers>
          {selectedHistorial && (
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField
                  label="Estado"
                  value={selectedHistorial.estado}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
                <TextField
                  label="Origen"
                  value={selectedHistorial.ubicacionOrigen?.nombre || ''}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
                <TextField
                  label="Destino"
                  value={selectedHistorial.ubicacionDestino?.nombre || ''}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
              </Stack>

              <Typography variant="subtitle2" color="text.secondary">
                Líneas
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
                    {linea.productoProveedor?.producto?.nombre || 'Producto'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Pedido: {linea.cantidadPedida} · Recepcionado:{' '}
                    {linea.cantidadRecepcionadaAtribuida} · Ya distribuido:{' '}
                    {linea.cantidadYaDistribuida} · Preparado:{' '}
                    {linea.cantidadADistribuir} · Entregado:{' '}
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
                      ? 'Solo el destinatario puede confirmar la recepción'
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
                      Confirmar Recepción
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
                  Cancelar Entrega
                </Button>
              </Stack>
            )}
          </Box>
          <Button onClick={() => setDetailOpen(false)} color="inherit">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DistribucionPage;
