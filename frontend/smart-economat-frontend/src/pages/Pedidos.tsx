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
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import DynamicFormModal from '../components/ui/DynamicFormModal';
import { ModalCloseReason } from '../components/ui/Modal';
import { SelectOption } from '../components/ui/Select';
import {
  EstadoLote,
  EstadoPedido,
  EstadoPedidoUsuario,
  isActivePedidoUsuarioStatus,
  isFinishedPedidoUsuarioStatus,
  isPendingPedidoUsuarioStatus,
  Pedido,
  PedidoBatchDetail,
  PedidoDetailEntityType,
  PedidoListItem,
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
import { isPedidoUsuarioRow } from '../features/pedidos/utils/pedidoOwnOrders';
import { formatPedidoId } from '../features/pedidos/utils/pedidoFormatters';
import { getPedidoSchema } from '../features/pedidos/utils/pedidoSchema';
import { DownloadService } from '../services/download.service';
import { useToast } from '../store/toast.hooks';

interface PedidoActionTarget {
  id: string;
  targetType: PedidoDetailEntityType;
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

const isEditablePedidoForm = (itemToEdit: PedidoFormValues | null): boolean => {
  if (!itemToEdit?.id) {
    return true;
  }

  if (itemToEdit.targetType === 'purchase_batch') {
    return itemToEdit.estado === EstadoLote.PENDIENTE;
  }

  return (
    itemToEdit.estado === EstadoPedidoUsuario.PENDIENTE ||
    itemToEdit.estado === EstadoPedido.PENDIENTE_DE_APROBACION
  );
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
  const [itemToViewBatch, setItemToViewBatch] =
    useState<PedidoBatchDetail | null>(null);
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
  const toast = useToast();

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

  const misPedidosStatusOptions = useMemo(
    () => [
      { value: 'pendientes' as MisPedidosStatusFilter, label: 'Pendientes' },
      { value: 'activos' as MisPedidosStatusFilter, label: 'En proceso' },
      { value: 'finalizados' as MisPedidosStatusFilter, label: 'Finalizados' },
    ],
    []
  );

  const ownOrdersData = useMemo(() => {
    if (!isOwnOrdersTab) return data;

    return data.filter((pedido) => {
      if (misPedidosStatus === 'pendientes') {
        return isPendingPedidoUsuarioStatus(String(pedido.estado));
      }

      if (misPedidosStatus === 'activos') {
        return isActivePedidoUsuarioStatus(String(pedido.estado));
      }

      return isFinishedPedidoUsuarioStatus(String(pedido.estado));
    });
  }, [data, isOwnOrdersTab, misPedidosStatus]);

  const ownOrdersTotalItems = isOwnOrdersTab
    ? ownOrdersData.length
    : totalItems;
  const ownOrdersTotalPages = totalPages;
  const visibleTotalItems = isBatchTab
    ? batches.length
    : isOwnOrdersTab
      ? ownOrdersTotalItems
      : totalItems;
  const isItemToEditEditable = isEditablePedidoForm(itemToEdit);

  const handleExportExcel = useCallback(async () => {
    const query = new URLSearchParams();
    if (searchTerm.trim()) {
      query.set('searchTerm', searchTerm.trim());
    }

    try {
      await DownloadService.downloadFile(
        `/export/pedidos/xlsx${query.toString() ? `?${query.toString()}` : ''}`,
        {
          filename: 'pedidos.xlsx',
          toast,
        }
      );
    } catch {
      // El servicio ya notifica el error.
    }
  }, [searchTerm, toast]);

  // Acciones disponibles para cada pedido
  const {
    savePedido,
    deletePedidoById,
    approvePedidoById,
    approvePurchaseBatchById,
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
      setItemToViewBatch({ entityType: 'purchase_batch', data: batch });
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

  const buildBatchEditData = useCallback(
    (detail: PedidoBatchDetail): PedidoFormValues => {
      const batch = detail.data;

      return {
        id: batch.id,
        batchId: batch.id,
        targetType: detail.entityType,
        numeroGlobal: 'numeroGlobal' in batch ? batch.numeroGlobal : undefined,
        estado: String(batch.estado),
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
    setItemToEdit({ targetType: 'pedido_usuario' });
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
    if (itemToAceptar.targetType === 'purchase_batch') {
      await approvePurchaseBatchById(itemToAceptar.id);
    } else {
      await approvePedidoById(itemToAceptar.id);
    }
    setItemToAceptar(null);
  }, [approvePedidoById, approvePurchaseBatchById, itemToAceptar]);

  const handleCancelarSubmit = useCallback(
    async (formData: Record<string, unknown>) => {
      if (!itemToCancelar) return;
      const motivo =
        (formData.motivoCancelacion as string) || 'Cancelado por el usuario';
      if (itemToCancelar.targetType === 'purchase_batch') {
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
    async (id: string, entityType: PedidoDetailEntityType) => {
      const fullBatch = await fetchBatchDetail(id, entityType);
      setItemToViewBatch(fullBatch);
    },
    [fetchBatchDetail]
  );

  const handleEditBatch = useCallback(
    (detail: PedidoBatchDetail) => {
      setItemToViewBatch(null);
      setItemToEdit(buildBatchEditData(detail));
    },
    [buildBatchEditData]
  );

  const handleOpenBatchEditor = useCallback(
    async (batchId: string, entityType: PedidoDetailEntityType) => {
      const fullBatch = await fetchBatchDetail(batchId, entityType);
      setItemToViewBatch(null);
      setItemToViewDetails(null);
      setItemToEdit(buildBatchEditData(fullBatch));
    },
    [buildBatchEditData, fetchBatchDetail]
  );

  const buildBatchActionTarget = useCallback(
    (detail: PedidoBatchDetail): PedidoActionTarget => {
      const providerNames = Array.from(
        new Set(
          detail.data.pedidos
            ?.map((pedido) => pedido.proveedor?.nombre)
            .filter(Boolean) || []
        )
      );

      if (detail.entityType === 'purchase_batch') {
        return {
          id: detail.data.id,
          targetType: detail.entityType,
          proveedorNombre:
            providerNames.length > 0 ? providerNames.join(', ') : 'Pedido',
          fechaPedido: detail.data.createdAt,
          numeroGlobal: undefined,
        };
      }

      return {
        id: detail.data.id,
        targetType: detail.entityType,
        proveedorNombre:
          providerNames.length > 0 ? providerNames.join(', ') : 'Pedido',
        fechaPedido: detail.data.fechaPedido,
        numeroGlobal: detail.data.numeroGlobal,
      };
    },
    []
  );

  const handleConsolidateWeek = useCallback(
    async (pedidoUsuarioIds: string[], weekLabel: string) => {
      await consolidatePedidosByIds(
        pedidoUsuarioIds,
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
      onView: (pedido: PedidoListItem) => {
        if (isPedidoUsuarioRow(pedido)) {
          void handleViewBatch(pedido.id, 'pedido_usuario');
          return;
        }

        setItemToViewDetails(pedido);
      },
      onEdit: (pedido: PedidoListItem) => {
        if (isPedidoUsuarioRow(pedido)) {
          void handleOpenBatchEditor(pedido.id, 'pedido_usuario');
        }
      },
      onDelete: (pedido: PedidoListItem) => {
        if (isPedidoUsuarioRow(pedido)) return;
      },
      onApprove: (pedido: PedidoListItem) => {
        if (!isPedidoUsuarioRow(pedido)) {
          return;
        }

        setItemToAceptar({
          id: pedido.id,
          targetType: 'pedido_usuario',
          proveedorNombre: pedido.proveedor?.nombre,
          fechaPedido: pedido.fechaPedido,
          numeroGlobal: pedido.numeroGlobal,
        });
      },
      onCancel: (pedido: PedidoListItem) => {
        if (!isPedidoUsuarioRow(pedido)) {
          return;
        }

        setItemToCancelar({
          id: pedido.id,
          targetType: 'pedido_usuario',
          proveedorNombre: pedido.proveedor?.nombre,
          fechaPedido: pedido.fechaPedido,
        });
      },
      onViewDelivery: (pedido: PedidoListItem) => {
        if (isPedidoUsuarioRow(pedido)) return;
        setItemToViewDeliveryDate(pedido);
      },
      onConfirmReceipt: (pedido: Pedido) => {
        void handlers.onConfirmReceipt(pedido);
      },
    }),
    [handleOpenBatchEditor, handleViewBatch]
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
            color: 'error',
            variant: 'outlined',
          },
          {
            label: 'Exportar Excel',
            onClick: () => {
              void handleExportExcel();
            },
            icon: <FileDownloadOutlinedIcon />,
            id: 'btn-exportar-pedidos-excel',
            color: 'success',
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
              onView: (batch) =>
                void handleViewBatch(batch.id, 'purchase_batch'),
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

        <ConfirmDialog
          isOpen={!!itemToAceptar}
          onClose={() => !isAceptando && setItemToAceptar(null)}
          onConfirm={() => void handleAceptarConfirm()}
          title="Aprobar Pedido"
          message={
            <>
              {itemToAceptar?.targetType === 'purchase_batch' ? (
                <>
                  ¿Estás seguro de que deseas tramitar la compra{' '}
                  <strong>
                    {itemToAceptar?.numeroGlobal
                      ? `#${itemToAceptar.numeroGlobal} `
                      : ''}
                  </strong>
                  ({formatPedidoId(itemToAceptar?.id)})? La compra avanzará a su
                  siguiente estado operativo.
                </>
              ) : (
                <>
                  ¿Estás seguro de que deseas aprobar el pedido{' '}
                  <strong>
                    {itemToAceptar?.numeroGlobal
                      ? `#${itemToAceptar.numeroGlobal} `
                      : ''}
                    ({formatPedidoId(itemToAceptar?.id)})
                  </strong>{' '}
                  al proveedor <strong>{itemToAceptar?.proveedorNombre}</strong>
                  ? Pasará a estar "En Proceso" y se considerará tramitado.
                </>
              )}
            </>
          }
          confirmText="Sí, Aprobar"
          cancelText="Cancelar"
          isLoading={isAceptando}
          confirmColor="success"
        />

        <DynamicFormModal
          isOpen={!!itemToCancelar}
          onClose={() => !isCancelando && setItemToCancelar(null)}
          title={
            itemToCancelar?.targetType === 'purchase_batch'
              ? `Cancelar Compra: ${formatPedidoId(itemToCancelar?.id)}`
              : `Cancelar Pedido: ${itemToCancelar?.proveedorNombre || ''}`
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

        <DynamicFormModal
          isOpen={!!itemToEdit}
          onClose={handleCloseModal}
          title={
            itemToEdit?.targetType === 'purchase_batch'
              ? isItemToEditEditable
                ? `Editar Compra ${formatPedidoId(itemToEdit?.batchId || itemToEdit?.id)}`
                : `Detalles de la Compra ${formatPedidoId(itemToEdit?.batchId || itemToEdit?.id)} (Solo lectura)`
              : itemToEdit?.targetType === 'pedido_usuario'
                ? isItemToEditEditable
                  ? `Editar Pedido ${itemToEdit?.numeroGlobal ? `#${itemToEdit.numeroGlobal}` : formatPedidoId(itemToEdit?.batchId || itemToEdit?.id)}`
                  : `Detalles del Pedido ${itemToEdit?.numeroGlobal ? `#${itemToEdit.numeroGlobal}` : formatPedidoId(itemToEdit?.batchId || itemToEdit?.id)} (Solo lectura)`
                : itemToEdit?.id
                  ? isItemToEditEditable
                    ? 'Editar Pedido'
                    : 'Detalles del Pedido (Solo lectura)'
                  : 'Crear Nuevo Pedido'
          }
          size="lg"
          fields={pedidoSchema}
          initialData={itemToEdit || {}}
          onSubmit={
            isItemToEditEditable ? handleSave : () => setItemToEdit(null)
          }
          isSubmitting={isSaving}
          onValuesChange={handleValuesChange}
          requireConfirmation={isItemToEditEditable}
          submitLabel={isItemToEditEditable ? 'Guardar' : 'Cerrar'}
          cancelLabel={isItemToEditEditable ? 'Cancelar' : ''}
          confirmationMessage={
            itemToEdit?.id
              ? itemToEdit.targetType === 'purchase_batch'
                ? '¿Estás seguro de que deseas guardar los cambios en esta compra?'
                : '¿Estás seguro de que deseas guardar los cambios en este pedido?'
              : '¿Estás seguro de que deseas registrar este nuevo pedido?'
          }
        />

        <PurchaseBatchDetailModal
          detail={itemToViewBatch}
          canEdit={permissions.canEdit}
          canApprove={permissions.canApprove}
          canCancel={permissions.canCancel}
          onClose={() => setItemToViewBatch(null)}
          onEdit={handleEditBatch}
          onApprove={(detail) => {
            setItemToViewBatch(null);
            setItemToAceptar(buildBatchActionTarget(detail));
          }}
          onCancel={(detail) => {
            setItemToViewBatch(null);
            setItemToCancelar(buildBatchActionTarget(detail));
          }}
          onRecepcion={(batch) => {
            setItemToViewBatch(null);
            void startRecepcionFromBatch(batch);
          }}
        />

        <PedidoDetailDrawer
          pedido={itemToViewDetails}
          canEdit={false}
          onClose={() => setItemToViewDetails(null)}
          onEdit={() => undefined}
        />

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
