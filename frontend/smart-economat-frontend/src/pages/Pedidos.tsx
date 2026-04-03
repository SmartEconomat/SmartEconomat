import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { Box, Alert, Paper, Button, Typography } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CheckIcon from '@mui/icons-material/Check';
import LinkIcon from '@mui/icons-material/Link';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import DynamicFormModal from '../components/ui/DynamicFormModal';
import { ModalCloseReason } from '../components/ui/Modal';
import { SelectOption } from '../components/ui/Select';
import {
  EstadoPedido,
  Pedido,
  PedidoUsuario,
  PurchaseBatch,
} from '../services/pedido.types';
import { useAuth, usePermission } from '../store/auth.hooks';
import { useToast } from '../store/toast.hooks';
import { usePedidoDraft } from '../hooks/usePedidoDraft';
import ReporteSelectorModal from '../components/ui/ReporteSelectorModal';

// Nuevos componentes y hooks del refactor
import PedidoDeliveryDateDialog from '../features/pedidos/components/PedidoDeliveryDateDialog';
import PedidoDetailDrawer from '../features/pedidos/components/PedidoDetailDrawer';
import PedidoDraftBanner from '../features/pedidos/components/PedidoDraftBanner';
import PedidosPageHeader from '../features/pedidos/components/PedidosPageHeader';
import PedidosTable from '../features/pedidos/components/PedidosTable';
import PedidosTabs from '../features/pedidos/components/PedidosTabs';
import PedidosWeeklyBoard from '../features/pedidos/components/PedidosWeeklyBoard';
import PurchaseBatchDetailModal from '../features/pedidos/components/PurchaseBatchDetailModal';
import PurchasesWeeklyBoard from '../features/pedidos/components/PurchasesWeeklyBoard';
import { usePedidoActions } from '../features/pedidos/hooks/usePedidoActions';
import { usePedidosData } from '../features/pedidos/hooks/usePedidosData';
import { usePedidosFilters } from '../features/pedidos/hooks/usePedidosFilters';
import {
  PedidoFormValues,
  PedidoPermissions,
} from '../features/pedidos/types/pedidos-ui.types';
import { buildPedidoPermissions } from '../features/pedidos/utils/pedidoPermissions';
import { isAggregatedBatchPedido } from '../features/pedidos/utils/pedidoOwnOrders';
import { formatPedidoId } from '../features/pedidos/utils/pedidoFormatters';
import { getPedidoSchema } from '../features/pedidos/utils/pedidoSchema';
import MisPedidosStatusTabs from '../features/pedidos/components/MisPedidosStatusTabs';

interface PedidoActionTarget {
  id: string;
  isBatchAggregate: boolean;
  aggregateType?: 'pedido_usuario' | 'purchase_batch';
  proveedorNombre?: string;
  usuarioNombre?: string;
  fechaPedido?: string;
  numeroGlobal?: string | number;
  proveedor?: {
    id: string;
    nombre: string;
  };
}

const sanitizePedidoObservation = (observaciones?: string) => {
  if (!observaciones) return '';
  return /^Lote semanal generado desde/i.test(observaciones)
    ? ''
    : observaciones;
};

const Pedidos: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [itemToDelete, setItemToDelete] = useState<Pedido | null>(null);
  const [itemToAceptar, setItemToAceptar] = useState<PedidoActionTarget | null>(
    null
  );
  const [itemToCancelar, setItemToCancelar] =
    useState<PedidoActionTarget | null>(null);
  const [itemToEdit, setItemToEdit] = useState<PedidoFormValues | null>(null);
  const [itemToViewBatch, setItemToViewBatch] = useState<
    PurchaseBatch | PedidoUsuario | null
  >(null);
  const [batchViewMode, setBatchViewMode] = useState<'batch' | 'pedido'>(
    'batch'
  );
  const [selectedPedidoIds, setSelectedPedidoIds] = useState<string[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [isBulkApproving, setIsBulkApproving] = useState(false);
  const [itemToViewDetails, setItemToViewDetails] = useState<Pedido | null>(
    null
  );
  const [itemToViewDeliveryDate, setItemToViewDeliveryDate] =
    useState<Pedido | null>(null);
  const [itemToRestore, setItemToRestore] = useState<PedidoActionTarget | null>(
    null
  );
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [isReporteOpen, setIsReporteOpen] = useState(false);
  const [isNewPedidoWarningOpen, setIsNewPedidoWarningOpen] = useState(false);
  const [isDraftCloseConfirmOpen, setIsDraftCloseConfirmOpen] = useState(false);
  const hasPromptedRef = useRef(false);
  const latestValsRef = useRef<Record<string, unknown>>({});
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    draft,
    loadDraft,
    saveDraft,
    discardDraft,
    isLoadingDraft,
    flushSave,
  } = usePedidoDraft();

  const canEdit = usePermission('pedidos:editar');
  const canDelete = usePermission('pedidos:eliminar');
  const canCreate = usePermission('pedidos:crear');
  const canRestore = usePermission('pedidos:restaurar');
  const canViewDistribucion = usePermission('distribuciones:listar');

  const toast = useToast();
  const permissions: PedidoPermissions = useMemo(
    () =>
      buildPedidoPermissions(
        canCreate,
        canEdit,
        canDelete,
        canRestore,
        user?.rol
      ),
    [canCreate, canDelete, canEdit, canRestore, user]
  );

  const {
    searchTerm,
    setSearchTerm,
    viewMode,
    setViewMode,
    tabIndex,
    setTabIndex,
    misPedidosStatus,
    setMisPedidosStatus,
    isWeeklyTab,
    isBatchTab,
    isOwnOrdersTab,
  } = usePedidosFilters();

  const {
    data,
    batches,
    isLoading,
    error,
    totalPages,
    totalItems,
    reload,
    setData,
  } = usePedidosData({
    page,
    pageSize,
    searchTerm,
    tabIndex,
    currentUserId: user?.id,
    misPedidosStatus,
  });

  const ownOrdersData = useMemo(() => {
    if (!isOwnOrdersTab) return data;

    return data.filter((pedido) => {
      if (misPedidosStatus === 'pendientes') {
        return pedido.estado === EstadoPedido.PENDIENTE;
      }

      if (misPedidosStatus === 'en_proceso') {
        return (
          pedido.estado === EstadoPedido.EN_PROCESO ||
          pedido.estado === EstadoPedido.PARCIAL
        );
      }

      return [EstadoPedido.ENTREGADO, EstadoPedido.CANCELADO].includes(
        pedido.estado
      );
    });
  }, [data, isOwnOrdersTab, misPedidosStatus]);

  const ownOrdersTotalItems = isOwnOrdersTab
    ? ownOrdersData.length
    : totalItems;
  const ownOrdersTotalPages = isOwnOrdersTab ? 1 : totalPages;
  const visibleTotalItems = isBatchTab
    ? batches.length
    : isOwnOrdersTab
      ? ownOrdersTotalItems
      : totalItems;

  // Acciones disponibles para cada pedido
  const {
    savePedido,
    deletePedidoById,
    deletePedidoUsuarioById,
    cancelPedidoById,
    cancelPurchaseBatchById,
    fetchBatchDetail,
    consolidatePedidosByIds,
    startRecepcionFromBatch,
    restorePedidoById,
    restorePurchaseBatchById,
    onTramitar,
    onApproveBatch: onApproveBatchHook,
    isSaving,
    isDeleting,
    isAceptando,
    isCancelando,
    isConsolidatingBatch,
  } = usePedidoActions({
    reload,
    discardDraft,
    onPedidoDeleted: (deletedId) => {
      setData((current) => current.filter((pedido) => pedido.id !== deletedId));
    },
    onBatchCreated: (batch) => {
      setItemToViewBatch(batch);
    },
  });

  const ubicacionOptions = useMemo<SelectOption[]>(() => {
    if (!user) return [];
    const options: SelectOption[] = [];

    // Alumno: tiene un único slot con una ubicación
    if (user.alumno?.slot?.ubicacion) {
      options.push({
        value: user.alumno.slot.ubicacion.id,
        label: `${user.alumno.slot.aula} - ${user.alumno.slot.ubicacion.nombre}`,
      });
    }

    // Profesor: puede tener múltiples slots con ubicaciones
    if (user.profesor?.slots) {
      user.profesor.slots.forEach((slot) => {
        if (slot.ubicacion) {
          // Evitar duplicados si hay varios slots en la misma ubicación
          if (!options.some((o) => o.value === slot.ubicacion!.id)) {
            options.push({
              value: slot.ubicacion!.id,
              label: `${slot.aula} - ${slot.ubicacion!.nombre}`,
            });
          }
        }
      });
    }

    return options;
  }, [user]);

  const pedidoSchema = useMemo(
    () => (itemToEdit ? getPedidoSchema(itemToEdit, ubicacionOptions) : []),
    [itemToEdit, ubicacionOptions]
  );

  useEffect(() => {
    void loadDraft();
  }, [loadDraft]);

  useEffect(() => {
    if (isLoadingDraft) return;

    if (
      draft &&
      !isRecoveryOpen &&
      !hasPromptedRef.current &&
      (!itemToEdit || (Object.keys(itemToEdit).length === 0 && !itemToEdit.id))
    ) {
      setIsRecoveryOpen(true);
      hasPromptedRef.current = true;
    } else if (!draft && !hasPromptedRef.current) {
      hasPromptedRef.current = true;
    }
  }, [draft, isLoadingDraft, isRecoveryOpen, itemToEdit]);

  const hasDraftableContent = useCallback((vals: Record<string, unknown>) => {
    const lines = (vals.pedidoProductos as unknown[]) || [];
    const observations = (vals.observaciones as string) || '';

    return (
      lines.length > 0 ||
      Boolean(observations && observations.trim().length > 0)
    );
  }, []);

  const closePedidoEditor = useCallback(() => {
    setItemToEdit(null);
    setIsDraftCloseConfirmOpen(false);
    latestValsRef.current = {};
  }, []);

  const handleValuesChange = useCallback(
    (vals: Record<string, unknown>) => {
      latestValsRef.current = vals;

      if (!itemToEdit?.id) {
        const hasContent = hasDraftableContent(vals);

        if (hasContent) {
          void saveDraft(vals);
        }
      }
    },
    [hasDraftableContent, itemToEdit?.id, saveDraft]
  );

  const handleCloseModal = useCallback(
    (reason?: ModalCloseReason) => {
      if (!itemToEdit?.id) {
        const vals = latestValsRef.current;
        const hasContent = hasDraftableContent(vals);

        if (!hasContent) {
          closePedidoEditor();
          return;
        }

        if (reason === 'backdropClick') {
          void flushSave(vals);
          closePedidoEditor();
          return;
        }

        setIsDraftCloseConfirmOpen(true);
        return;
      }

      closePedidoEditor();
    },
    [closePedidoEditor, flushSave, hasDraftableContent, itemToEdit?.id]
  );

  const handleSaveDraftAndClose = useCallback(() => {
    const vals = latestValsRef.current;

    if (hasDraftableContent(vals)) {
      void flushSave(vals);
    }

    closePedidoEditor();
  }, [closePedidoEditor, flushSave, hasDraftableContent]);

  const handleDiscardDraftAndClose = useCallback(() => {
    void discardDraft();
    closePedidoEditor();
  }, [closePedidoEditor, discardDraft]);

  const buildEditData = useCallback((row: Pedido): PedidoFormValues => {
    return {
      ...row,
      proveedorId: row.proveedor?.id,
      usuarioSolicitante:
        row.usuario?.nombre ||
        row.usuario?.username ||
        row.usuario?.email ||
        '',
      fechaPedido: row.fechaPedido
        ? dayjs(row.fechaPedido).format('YYYY-MM-DD')
        : dayjs().format('YYYY-MM-DD'),
      pedidoProductos:
        row.pedidoProductos?.map((pedidoProducto) => ({
          id: pedidoProducto.id,
          productoProveedorId: pedidoProducto.productoProveedor?.id,
          productoProveedor: pedidoProducto.productoProveedor,
          cantidad: pedidoProducto.cantidad,
          precioUnitario: pedidoProducto.precioUnitario,
          observaciones: pedidoProducto.observaciones,
        })) || [],
      ubicacionEntregaSugeridaId:
        row.ubicacionEntregaSugeridaId || row.ubicacionEntregaSugerida?.id,
    };
  }, []);

  const buildBatchEditData = useCallback(
    (batch: PurchaseBatch | PedidoUsuario): PedidoFormValues => {
      const isEditable = String(batch.estado) === EstadoPedido.PENDIENTE;

      return {
        id: batch.id,
        batchId: batch.id,
        isBatchAggregate: true,
        aggregateType:
          'aggregateType' in batch ? batch.aggregateType : 'pedido_usuario',
        numeroGlobal: 'numeroGlobal' in batch ? batch.numeroGlobal : undefined,
        usuarioSolicitante:
          batch.usuario?.nombre ||
          batch.usuario?.username ||
          batch.usuario?.email ||
          '',
        fechaPedido:
          'createdAt' in batch && batch.createdAt
            ? dayjs(batch.createdAt).format('YYYY-MM-DD')
            : 'fechaPedido' in batch && batch.fechaPedido
              ? dayjs(batch.fechaPedido).format('YYYY-MM-DD')
              : dayjs().format('YYYY-MM-DD'),
        estado: isEditable ? EstadoPedido.PENDIENTE : EstadoPedido.EN_PROCESO,
        observaciones: sanitizePedidoObservation(batch.observaciones),
        pedidoProductos:
          batch.pedidos?.flatMap((pedido) =>
            (pedido.pedidoProductos || []).map((pedidoProducto) => ({
              id: pedidoProducto.id,
              productoProveedorId: pedidoProducto.productoProveedor?.id,
              hasLinkedMovements: pedidoProducto.hasLinkedMovements,
              productoProveedor: pedidoProducto.productoProveedor,
              cantidad: pedidoProducto.cantidad,
              precioUnitario: pedidoProducto.precioUnitario,
              observaciones: pedidoProducto.observaciones,
            }))
          ) || [],
        ubicacionEntregaSugeridaId:
          batch.ubicacionEntregaSugeridaId ||
          batch.ubicacionEntregaSugerida?.id,
      };
    },
    []
  );

  const openNewPedidoForm = useCallback(() => {
    setItemToEdit({
      usuarioSolicitante: user?.name || user?.email || '',
      fechaPedido: dayjs().format('YYYY-MM-DD'),
    });
    hasPromptedRef.current = true;
  }, [user]);

  const handleConsolidateSelected = useCallback(async () => {
    if (selectedPedidoIds.length === 0) return;

    try {
      await consolidatePedidosByIds(
        selectedPedidoIds,
        `Consolidación manual de ${selectedPedidoIds.length} pedidos`
      );
      setSelectedPedidoIds([]);
      toast.success(
        `${selectedPedidoIds.length} pedidos consolidados correctamente.`
      );
    } catch (error) {
      console.error('Error al consolidar pedidos seleccionados:', error);
    }
  }, [selectedPedidoIds, consolidatePedidosByIds, toast]);

  const handleApproveSelectedBatches = useCallback(async () => {
    if (selectedBatchIds.length === 0) return;

    setIsBulkApproving(true);
    let successCount = 0;
    try {
      for (const id of selectedBatchIds) {
        try {
          // Detectamos si estamos en la pestaña de mis pedidos para usar el endpoint correcto
          const isUserBatch = isOwnOrdersTab;
          await onApproveBatchHook(id, isUserBatch);
          successCount++;
        } catch (e) {
          console.error(`Error aprobando lote ${id}:`, e);
        }
      }
      setSelectedBatchIds([]);
      toast.success(`${successCount} lotes aprobados correctamente.`);
      void reload();
    } finally {
      setIsBulkApproving(false);
    }
  }, [selectedBatchIds, onApproveBatchHook, reload, toast]);

  const handleCreateClick = useCallback(() => {
    if (draft) {
      setIsNewPedidoWarningOpen(true);
      return;
    }

    openNewPedidoForm();
  }, [draft, openNewPedidoForm]);

  const handleRecoverDraft = useCallback(() => {
    if (draft) {
      const payload = draft.payload as PedidoFormValues;
      setItemToEdit({
        ...payload,
        usuarioSolicitante:
          payload.usuarioSolicitante || user?.name || user?.email || '',
        fechaPedido: payload.fechaPedido || dayjs().format('YYYY-MM-DD'),
      });
    }
    setIsRecoveryOpen(false);
    setIsNewPedidoWarningOpen(false);
  }, [draft, user]);

  const handleDiscardDraft = useCallback(() => {
    void discardDraft();
    setIsRecoveryOpen(false);
  }, [discardDraft]);

  const handleSave = useCallback(
    async (formData: Record<string, unknown>) => {
      await savePedido(formData as PedidoFormValues);
      setItemToEdit(null);
    },
    [savePedido]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!itemToDelete) return;
    if (isAggregatedBatchPedido(itemToDelete)) {
      await deletePedidoUsuarioById(itemToDelete.id);
    } else {
      await deletePedidoById(itemToDelete.id);
    }
    setItemToDelete(null);
  }, [deletePedidoById, deletePedidoUsuarioById, itemToDelete]);

  const handleAceptarConfirm = useCallback(async () => {
    if (!itemToAceptar) return;

    if (itemToAceptar.aggregateType === 'purchase_batch') {
      // Si ya es un lote de compra, lo aprobamos
      await onApproveBatchHook(itemToAceptar.id);
    } else {
      // Al aprobar un pedido (usuario o inventario), lo consolidamos
      // Pasamos true para evitar que se abra el modal de detalle automáticamente (skipCallback)
      const batch = await consolidatePedidosByIds(
        [itemToAceptar.id],
        `Lote generado al aprobar pedido de ${itemToAceptar.usuarioNombre || itemToAceptar.proveedorNombre || itemToAceptar.proveedor?.nombre}`,
        permissions.canApprove
      );

      // Si el usuario tiene permisos para aprobar, lo hacemos de una vez para evitar el doble paso
      if (batch && permissions.canApprove) {
        try {
          await onApproveBatchHook(batch.id);
          // No necesitamos cerrar el modal (setItemToViewBatch(null)) porque NO se abrió gracias al skipCallback
        } catch (e) {
          console.error('Error aprobando automáticamente el lote generado:', e);
          // Si falla la aprobación automática, entonces SÍ abrimos el modal para que el usuario lo vea/intente manual
          setItemToViewBatch(batch);
        }
      }
    }
    setItemToAceptar(null);
  }, [
    consolidatePedidosByIds,
    itemToAceptar,
    onApproveBatchHook,
    permissions.canApprove,
  ]);

  const handleCancelarSubmit = useCallback(
    async (formData: Record<string, unknown>) => {
      if (!itemToCancelar) return;
      const motivo =
        (formData.motivoCancelacion as string) || 'Cancelado por el usuario';
      if (itemToCancelar.isBatchAggregate) {
        await cancelPurchaseBatchById(itemToCancelar.id, motivo);
      } else {
        await cancelPedidoById(itemToCancelar.id, motivo);
      }
      setItemToCancelar(null);
    },
    [cancelPedidoById, cancelPurchaseBatchById, itemToCancelar]
  );

  const handleCancelClick = useCallback((pedido: Pedido) => {
    setItemToCancelar({
      id: pedido.id,
      isBatchAggregate: isAggregatedBatchPedido(pedido),
      aggregateType: pedido.aggregateType,
      proveedorNombre: pedido.proveedor?.nombre,
      fechaPedido: pedido.fechaPedido,
      numeroGlobal: pedido.numeroGlobal,
    });
  }, []);

  const handleRestoreClick = useCallback((pedido: Pedido) => {
    setItemToRestore({
      id: pedido.id,
      isBatchAggregate: isAggregatedBatchPedido(pedido),
      aggregateType: pedido.aggregateType,
      proveedorNombre: pedido.proveedor?.nombre,
      fechaPedido: pedido.fechaPedido,
      numeroGlobal: pedido.numeroGlobal,
    });
  }, []);

  const handleRestoreConfirm = useCallback(async () => {
    if (!itemToRestore) return;

    try {
      if (itemToRestore.isBatchAggregate) {
        await restorePurchaseBatchById(
          itemToRestore.id,
          itemToRestore.aggregateType === 'pedido_usuario'
        );
      } else {
        await restorePedidoById(itemToRestore.id);
      }
      setItemToRestore(null);
    } catch {
      toast.error('Ocurrió un error al intentar restaurar el pedido.');
      return;
    }
  }, [restorePedidoById, restorePurchaseBatchById, itemToRestore, toast]);

  const handleViewBatch = useCallback(
    async (
      batch: PurchaseBatch | PedidoUsuario,
      mode: 'batch' | 'pedido' = 'batch'
    ) => {
      const fullBatch = await fetchBatchDetail(
        batch.id,
        mode === 'pedido' ? 'pedido_usuario' : undefined
      );
      setBatchViewMode(mode);
      setItemToViewBatch(fullBatch);
    },
    [fetchBatchDetail]
  );

  const handleEditBatch = useCallback(
    (batch: PurchaseBatch | PedidoUsuario) => {
      setItemToViewBatch(null);
      setItemToEdit(buildBatchEditData(batch));
    },
    [buildBatchEditData]
  );

  const handleOpenBatchEditor = useCallback(
    async (batchId: string) => {
      const fullBatch = await fetchBatchDetail(batchId, 'pedido_usuario');
      setItemToViewBatch(null);
      setItemToViewDetails(null);
      setItemToEdit(buildBatchEditData(fullBatch));
    },
    [buildBatchEditData, fetchBatchDetail]
  );

  const buildBatchActionTarget = useCallback(
    (batch: PurchaseBatch | PedidoUsuario): PedidoActionTarget => {
      const providerNames = Array.from(
        new Set(
          batch.pedidos
            ?.map((pedido) => pedido.proveedor?.nombre)
            .filter(Boolean) || []
        )
      );

      const isPedidoUsuario = 'usuario' in batch && 'numeroGlobal' in batch;

      return {
        id: batch.id,
        isBatchAggregate: true,
        aggregateType:
          'aggregateType' in batch
            ? (batch as Pedido).aggregateType
            : isPedidoUsuario
              ? 'pedido_usuario'
              : 'purchase_batch',
        usuarioNombre: isPedidoUsuario
          ? (batch as PedidoUsuario).usuario?.nombre
          : undefined,
        proveedorNombre:
          providerNames.length > 0 ? providerNames.join(', ') : 'Pedido',
        fechaPedido: 'createdAt' in batch ? batch.createdAt : batch.fechaPedido,
        numeroGlobal: 'numeroGlobal' in batch ? batch.numeroGlobal : undefined,
        proveedor:
          batch.pedidos && batch.pedidos.length === 1
            ? batch.pedidos[0].proveedor
            : undefined,
      };
    },
    []
  );

  const handleConsolidateWeek = useCallback(
    async (pedidoIds: string[], weekLabel: string) => {
      await consolidatePedidosByIds(
        pedidoIds,
        `Lote semanal generado desde ${weekLabel}`
      );
    },
    [consolidatePedidosByIds]
  );

  const handleBatchRestoreClick = useCallback(
    (batch: PurchaseBatch | PedidoUsuario) => {
      setItemToRestore(buildBatchActionTarget(batch));
    },
    [buildBatchActionTarget]
  );

  const handlers = useMemo(
    () => ({
      onView: (pedido: Pedido) => {
        if (isAggregatedBatchPedido(pedido)) {
          void handleViewBatch(
            { id: pedido.id, aggregateType: 'pedido_usuario' } as PedidoUsuario,
            'pedido'
          );
          return;
        }

        setItemToViewDetails(pedido);
      },
      onEdit: (pedido: Pedido) => {
        if (isAggregatedBatchPedido(pedido)) {
          void handleOpenBatchEditor(pedido.id);
          return;
        }
        setItemToViewDetails(null);
        setItemToEdit(buildEditData(pedido));
      },
      onDelete: (pedido: Pedido) => {
        setItemToDelete(pedido);
      },
      onApprove: (pedido: Pedido) => {
        setItemToAceptar({
          id: pedido.id,
          isBatchAggregate: isAggregatedBatchPedido(pedido),
          aggregateType:
            pedido.aggregateType ||
            (isAggregatedBatchPedido(pedido) ? 'pedido_usuario' : undefined),
          proveedorNombre: pedido.proveedor?.nombre,
          fechaPedido: pedido.fechaPedido,
          numeroGlobal: pedido.numeroGlobal,
        });
      },
      onCancel: (pedido: Pedido) => handleCancelClick(pedido),
      onRestore: (pedido: Pedido) => handleRestoreClick(pedido),
      onViewDelivery: (pedido: Pedido) => {
        if (isAggregatedBatchPedido(pedido)) return;
        setItemToViewDeliveryDate(pedido);
      },
      onConfirmReceipt: (pedido: Pedido) => {
        void handlers.onConfirmReceipt(pedido);
      },
    }),
    [
      buildEditData,
      handleOpenBatchEditor,
      handleViewBatch,
      handleCancelClick,
      handleRestoreClick,
    ]
  );

  return (
    <Box>
      <PedidosPageHeader
        canCreate={permissions.canCreate}
        draft={draft}
        isLoadingDraft={isLoadingDraft}
        totalItems={visibleTotalItems}
        totalItemsLabel={isBatchTab ? 'compras' : 'pedidos'}
        searchTerm={searchTerm}
        viewMode={viewMode}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        onViewModeChange={setViewMode}
        onCreateClick={handleCreateClick}
        onContinueDraftClick={handleRecoverDraft}
        extraActions={[
          {
            label: 'Reporte PDF',
            onClick: () => setIsReporteOpen(true),
            icon: <PictureAsPdfIcon />,
            id: 'btn-reporte-pedidos-pdf',
            color: 'secondary',
            variant: 'outlined',
          },
        ]}
      />

      <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
        {draft && !isRecoveryOpen && !itemToEdit && (
          <PedidoDraftBanner
            draft={draft}
            onRecover={handleRecoverDraft}
            onDiscard={handleDiscardDraft}
          />
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <PedidosTabs
          value={tabIndex}
          onChange={(value) => {
            setTabIndex(value);
            setPage(1);
          }}
        />

        {isOwnOrdersTab && (
          <MisPedidosStatusTabs
            value={misPedidosStatus}
            onChange={(newValue) => {
              setMisPedidosStatus(newValue);
              setPage(1);
            }}
          />
        )}

        {isBatchTab ? (
          <PurchasesWeeklyBoard
            batches={batches}
            isLoading={isLoading}
            viewMode={viewMode}
            handlers={{
              onView: (batch) => void handleViewBatch(batch, 'batch'),
              onRecepcion: (batch) => void startRecepcionFromBatch(batch),
              onTramitar: (batch) => void onTramitar(batch),
              onDistribucion: (batch) => {
                navigate('/distribucion');
                toast.success(
                  `Abriendo distribución para la compra ${formatPedidoId(batch.id)}.`
                );
              },
            }}
            selectable
            selectedIds={selectedBatchIds}
            onSelectionChange={setSelectedBatchIds}
            rightHeaderAction={
              selectedBatchIds.length > 0 && (
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={<CheckIcon />}
                  onClick={handleApproveSelectedBatches}
                  disabled={isBulkApproving}
                >
                  Aprobar ({selectedBatchIds.length})
                </Button>
              )
            }
          />
        ) : isWeeklyTab ? (
          <PedidosWeeklyBoard
            data={data}
            isLoading={isLoading}
            viewMode={viewMode}
            permissions={permissions}
            handlers={handlers}
            totalItems={totalItems}
            isConsolidating={isConsolidatingBatch}
            onConsolidateWeek={handleConsolidateWeek}
            currentUserId={user?.id}
          />
        ) : (
          <PedidosTable
            data={ownOrdersData}
            isLoading={isLoading}
            page={isOwnOrdersTab ? 1 : page}
            pageSize={pageSize}
            totalPages={ownOrdersTotalPages}
            viewMode={viewMode}
            permissions={permissions}
            handlers={handlers}
            onPageChange={setPage}
            onPageSizeChange={(nextPageSize: number) => {
              setPageSize(nextPageSize);
              setPage(1);
            }}
            onCreateClick={handleCreateClick}
            hideCreator={isOwnOrdersTab}
            currentUserId={user?.id}
            selectable={!isOwnOrdersTab && permissions.canConsolidate}
            selectedIds={selectedPedidoIds}
            onSelectionChange={setSelectedPedidoIds}
          />
        )}

        {/* Botón flotante para consolidar selección (aparece si hay selección) */}
        {!isOwnOrdersTab && selectedPedidoIds.length > 0 && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 80,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              boxShadow: 4,
              borderRadius: 2,
              bgcolor: 'background.paper',
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Typography variant="subtitle2">
              {selectedPedidoIds.length} pedidos seleccionados
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<LinkIcon />}
              onClick={handleConsolidateSelected}
              disabled={isConsolidatingBatch}
            >
              Consolidar Selección
            </Button>
            <Button
              variant="text"
              size="small"
              onClick={() => setSelectedPedidoIds([])}
            >
              Cancelar
            </Button>
          </Box>
        )}

        {itemToDelete && (
          <ConfirmDialog
            isOpen
            onClose={() => !isDeleting && setItemToDelete(null)}
            onConfirm={() => void handleDeleteConfirm()}
            title="Eliminar pedido"
            message={
              <>
                ¿Estás seguro de que deseas eliminar el pedido del{' '}
                <strong>
                  {itemToDelete.fechaPedido
                    ? dayjs(itemToDelete.fechaPedido).format('DD/MM/YYYY')
                    : ''}
                </strong>
                ? Esta acción no se puede deshacer.
              </>
            }
            confirmText="Sí, eliminar"
            cancelText="Cancelar"
            isLoading={isDeleting}
          />
        )}

        {itemToAceptar && (
          <ConfirmDialog
            isOpen
            onClose={() => !isAceptando && setItemToAceptar(null)}
            onConfirm={() => void handleAceptarConfirm()}
            title="Aprobar Pedido"
            message={
              <>
                {itemToAceptar.isBatchAggregate ? (
                  <>
                    ¿Estás seguro de que deseas aprobar el pedido{' '}
                    <strong>
                      {itemToAceptar.numeroGlobal
                        ? `#${itemToAceptar.numeroGlobal} `
                        : ''}
                    </strong>
                    ({formatPedidoId(itemToAceptar.id)}) ? Este se tramitará
                    como compra única y pasará a estar en{' '}
                    <strong>En Proceso</strong>.
                  </>
                ) : (
                  <>
                    ¿Estás seguro de que deseas aprobar el pedido{' '}
                    <strong>
                      {itemToAceptar.numeroGlobal
                        ? `#${itemToAceptar.numeroGlobal} `
                        : ''}
                      ({formatPedidoId(itemToAceptar.id)})
                    </strong>{' '}
                    al proveedor{' '}
                    <strong>{itemToAceptar.proveedorNombre}</strong>? Pasará a
                    estar "En Proceso" y se considerará tramitado.
                  </>
                )}
              </>
            }
            confirmText="Sí, Aprobar"
            cancelText="Cancelar"
            isLoading={isAceptando}
            confirmColor="success"
          />
        )}

        {itemToCancelar && (
          <DynamicFormModal
            isOpen
            onClose={() => !isCancelando && setItemToCancelar(null)}
            title={
              itemToCancelar.isBatchAggregate
                ? `Cancelar Pedido : ${formatPedidoId(itemToCancelar.id)}`
                : `Cancelar Pedido: ${itemToCancelar.proveedorNombre || ''}`
            }
            size="sm"
            fields={[
              {
                name: 'motivoCancelacion',
                label: 'Motivo de Cancelación (Opcional)',
                type: 'text',
                width: 12,
                required: false,
              },
            ]}
            initialData={{ motivoCancelacion: '' }}
            onSubmit={handleCancelarSubmit}
            isSubmitting={isCancelando}
            requireConfirmation={false}
          />
        )}

        {itemToEdit && (
          <DynamicFormModal
            isOpen
            onClose={handleCloseModal}
            title={
              itemToEdit.isBatchAggregate
                ? itemToEdit.estado === EstadoPedido.PENDIENTE
                  ? `Editar Pedido ${itemToEdit.numeroGlobal ? `#${itemToEdit.numeroGlobal}` : formatPedidoId(itemToEdit.batchId || itemToEdit.id)}`
                  : `Detalles del Pedido ${itemToEdit.numeroGlobal ? `#${itemToEdit.numeroGlobal}` : formatPedidoId(itemToEdit.batchId || itemToEdit.id)} (Solo lectura)`
                : itemToEdit.id
                  ? itemToEdit.estado === EstadoPedido.PENDIENTE
                    ? 'Editar Pedido'
                    : 'Detalles del Pedido (Solo lectura)'
                  : 'Crear Nuevo Pedido'
            }
            size="lg"
            fields={pedidoSchema}
            initialData={itemToEdit}
            onSubmit={
              itemToEdit.estado && itemToEdit.estado !== EstadoPedido.PENDIENTE
                ? () => setItemToEdit(null)
                : handleSave
            }
            isSubmitting={isSaving || isAceptando}
            onValuesChange={handleValuesChange}
            requireConfirmation={
              itemToEdit.estado === EstadoPedido.PENDIENTE || !itemToEdit.id
            }
            submitLabel={
              itemToEdit.estado && itemToEdit.estado !== EstadoPedido.PENDIENTE
                ? 'Cerrar'
                : 'Guardar'
            }
            cancelLabel=""
            confirmationMessage={
              itemToEdit.id
                ? itemToEdit.isBatchAggregate
                  ? '¿Estás seguro de que deseas guardar los cambios en este pedido?'
                  : '¿Estás seguro de que deseas guardar los cambios en este pedido?'
                : '¿Estás seguro de que deseas registrar este nuevo pedido?'
            }
          />
        )}

        {itemToViewBatch && (
          <PurchaseBatchDetailModal
            batch={itemToViewBatch}
            canEdit={permissions.canEdit}
            canRestore={permissions.canRestore}
            canDistribucion={canViewDistribucion}
            mode={batchViewMode}
            onClose={() => setItemToViewBatch(null)}
            onEdit={handleEditBatch}
            onRestore={(batch) => {
              setItemToViewBatch(null);
              handleBatchRestoreClick(batch);
            }}
            onRecepcion={(batch: PurchaseBatch) => {
              setItemToViewBatch(null);
              void startRecepcionFromBatch(batch);
            }}
            onDistribucion={(batch) => {
              setItemToViewBatch(null);
              navigate('/distribucion');
              toast.success(
                `Abriendo distribución para la compra ${formatPedidoId(batch.id)}.`
              );
            }}
            onTramitar={(batch) => {
              setItemToViewBatch(null);
              void onTramitar(batch);
            }}
          />
        )}

        {itemToViewDetails && (
          <PedidoDetailDrawer
            pedido={itemToViewDetails}
            canEdit={permissions.canEdit}
            canRestore={permissions.canRestore}
            onClose={() => setItemToViewDetails(null)}
            onEdit={(pedido) => {
              setItemToViewDetails(null);
              setItemToEdit(buildEditData(pedido));
            }}
            onRestore={(pedido) => {
              setItemToViewDetails(null);
              handlers.onRestore(pedido);
            }}
          />
        )}

        {itemToViewDeliveryDate && (
          <PedidoDeliveryDateDialog
            pedido={itemToViewDeliveryDate}
            onClose={() => setItemToViewDeliveryDate(null)}
          />
        )}

        {isReporteOpen && (
          <ReporteSelectorModal
            isOpen
            onClose={() => setIsReporteOpen(false)}
            tipo="pedido"
          />
        )}

        {isRecoveryOpen && (
          <ConfirmDialog
            isOpen
            onClose={() => setIsRecoveryOpen(false)}
            onConfirm={handleRecoverDraft}
            title="Recuperar Pedido Pendiente"
            message={
              <>
                Tienes un pedido que no llegaste a finalizar el día{' '}
                <strong>
                  {dayjs(draft?.updatedAt).isValid()
                    ? dayjs(draft?.updatedAt).format('DD/MM/YYYY')
                    : '...'}
                </strong>{' '}
                a las{' '}
                <strong>
                  {dayjs(draft?.updatedAt).isValid()
                    ? dayjs(draft?.updatedAt).format('HH:mm')
                    : '...'}
                </strong>
                .
                <br />
                <br />
                ¿Deseas recuperarlo y continuar donde lo dejaste?
              </>
            }
            confirmText="Sí, Recuperar"
            cancelText="No, Descartar"
            confirmColor="primary"
            onCancel={handleDiscardDraft}
          />
        )}

        {isNewPedidoWarningOpen && (
          <ConfirmDialog
            isOpen
            onClose={() => setIsNewPedidoWarningOpen(false)}
            onConfirm={() => {
              setIsNewPedidoWarningOpen(false);
              openNewPedidoForm();
            }}
            title="Ya tienes un pedido pendiente"
            message={
              <>
                Ya existe un borrador de pedido guardado del día{' '}
                <strong>
                  {dayjs(draft?.updatedAt).isValid()
                    ? dayjs(draft?.updatedAt).format('DD/MM/YYYY')
                    : '...'}
                </strong>
                . Si empiezas uno nuevo y se guarda, el borrador pendiente se
                reemplazará.
                <br />
                <br />
                ¿Qué quieres hacer?
              </>
            }
            confirmText="Crear nuevo pedido"
            cancelText="Continuar borrador"
            confirmColor="warning"
            onCancel={handleRecoverDraft}
          />
        )}

        {isDraftCloseConfirmOpen && (
          <ConfirmDialog
            isOpen
            onClose={() => setIsDraftCloseConfirmOpen(false)}
            onConfirm={handleSaveDraftAndClose}
            title="¿Qué quieres hacer con este pedido?"
            message="Si lo guardas en borrador, podrás retomarlo más tarde. Si cancelas ahora, se descartará el pedido pendiente."
            confirmText="Guardar en borrador"
            cancelText="Cancelar pedido"
            confirmColor="primary"
            onCancel={handleDiscardDraftAndClose}
          />
        )}

        {itemToRestore && (
          <ConfirmDialog
            isOpen
            onClose={() => !isSaving && setItemToRestore(null)}
            onConfirm={() => void handleRestoreConfirm()}
            title="Restaurar pedido"
            message={`¿Estás seguro de que deseas restaurar el pedido ${formatPedidoId(
              itemToRestore.numeroGlobal?.toString() || itemToRestore.id
            )}${
              itemToRestore.proveedorNombre
                ? ` de ${itemToRestore.proveedorNombre}`
                : ''
            }? El estado volverá a ser PENDIENTE.`}
            confirmText="Restaurar"
            confirmColor="primary"
            isLoading={isSaving}
          />
        )}
      </Paper>
    </Box>
  );
};

export default Pedidos;
