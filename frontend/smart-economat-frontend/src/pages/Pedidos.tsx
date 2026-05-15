import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Alert,
  Paper,
  Tab,
  Tabs,
  Button,
  useTheme,
  alpha,
} from '@mui/material';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import FormatListBulletedOutlinedIcon from '@mui/icons-material/FormatListBulletedOutlined';
import ShoppingCartCheckoutOutlinedIcon from '@mui/icons-material/ShoppingCartCheckoutOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import DynamicFormModal from '../components/ui/DynamicFormModal';
import { ModalCloseReason } from '../components/ui/Modal';
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
  PurchaseBatch,
} from '../services/pedido.types';
import { useAuth, usePermission } from '../store/auth.hooks';
import { PERMISSIONS } from '../sherlock-auth/permissions.constants';
import { usePedidoDraft } from '../hooks/usePedidoDraft';
import { useDataTable } from '../hooks/useDataTable';
import ReporteSelectorModal from '../components/ui/ReporteSelectorModal';

// Nuevos componentes y hooks del refactor
import PedidoDeliveryDateDialog from '../features/pedidos/components/PedidoDeliveryDateDialog';
import PedidoDetailDrawer from '../features/pedidos/components/PedidoDetailDrawer';
import PedidoDraftBanner from '../features/pedidos/components/PedidoDraftBanner';
import PedidosPageHeader from '../features/pedidos/components/PedidosPageHeader';
import PedidosTable from '../features/pedidos/components/PedidosTable';

import PedidosWeeklyBoard from '../features/pedidos/components/PedidosWeeklyBoard';
import PurchaseBatchDetailModal from '../features/pedidos/components/PurchaseBatchDetailModal';
import PurchasesWeeklyBoard from '../features/pedidos/components/PurchasesWeeklyBoard';
import MisPedidosStatusTabs from '../features/pedidos/components/MisPedidosStatusTabs';
import { usePedidoActions } from '../features/pedidos/hooks/usePedidoActions';
import { usePedidosData } from '../features/pedidos/hooks/usePedidosData';
import { usePedidosFilters } from '../features/pedidos/hooks/usePedidosFilters';
import {
  PedidoFormValues,
  PedidoPermissions,
  PedidosTabValue,
} from '../features/pedidos/types/pedidos-ui.types';
import { buildPedidoPermissions } from '../features/pedidos/utils/pedidoPermissions';
import { isPedidoUsuarioRow } from '../features/pedidos/utils/pedidoOwnOrders';
import { formatPedidoId } from '../features/pedidos/utils/pedidoFormatters';
import { getPedidoSchema } from '../features/pedidos/utils/pedidoSchema';
import { DownloadService } from '../services/download.service';
import { useToast } from '../store/toast.hooks';
import { formatLocalizedDate, formatLocalizedTime } from '../utils/intlFormat';

interface PedidoActionTarget {
  id: string;
  targetType: PedidoDetailEntityType;
  proveedorNombre?: string;
  proveedorCount?: number;
  fechaPedido?: string;
  numeroGlobal?: string | number;
}

/**
 * Ejecuta la lógica de sanitize pedido observation dentro del flujo de la aplicación.
 *
 * @param observaciones Parámetro de entrada para la operación. Opcional.
 */
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

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
const Pedidos: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const hasDashboardFilter =
    searchParams.get('tab') === '0' &&
    searchParams.get('ownStatus') === 'pendientes';

  const clearDashboardFilter = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('tab');
    nextParams.delete('ownStatus');
    setSearchParams(nextParams, { replace: true });
  };
  const { user } = useAuth();
  const toast = useToast();

  const [itemToDelete, setItemToDelete] = useState<Pedido | null>(null);
  const [itemToAceptar, setItemToAceptar] = useState<PedidoActionTarget | null>(
    null
  );
  const [itemToConsolidate, setItemToConsolidate] = useState<{
    pedidoUsuarioIds: string[];
    weekLabel: string;
    pendingCount: number;
    confirmStep: 1 | 2;
  } | null>(null);
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
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [isReporteOpen, setIsReporteOpen] = useState(false);
  const [isNewPedidoWarningOpen, setIsNewPedidoWarningOpen] = useState(false);
  const [isDraftCloseConfirmOpen, setIsDraftCloseConfirmOpen] = useState(false);
  const hasPromptedRef = useRef(false);
  const latestValsRef = useRef<Record<string, unknown>>({});

  const {
    filters: tableFilters,
    onPageChange,
    onSort,
    onFilter,
    onSearchChange,
    queryParams,
    sortConfig,
    paginationProps,
    syncPaginationFromResponse,
  } = useDataTable({
    sortBy: 'fechaPedido',
    order: 'desc',
  });

  const {
    draft,
    loadDraft,
    saveDraft,
    discardDraft,
    isLoadingDraft,
    flushSave,
  } = usePedidoDraft();

  const canEdit = usePermission(PERMISSIONS.pedidos.editar);
  const canDelete = usePermission(PERMISSIONS.pedidos.eliminar);
  const canCreate = usePermission(PERMISSIONS.pedidos.crear);
  const canCancel = usePermission(PERMISSIONS.pedidos.cancelar);
  // No existe pedidos:aprobar en el backend; se usa pedidos:editar como requisito mínimo.
  const canApprove = usePermission(PERMISSIONS.pedidos.editar);
  const permissions: PedidoPermissions = useMemo(
    () =>
      buildPedidoPermissions(
        canCreate,
        canEdit,
        canDelete,
        canCancel,
        canApprove
      ),
    [canApprove, canCancel, canCreate, canDelete, canEdit]
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

  const { data, batches, isLoading, error, totalItems, reload, setData } =
    usePedidosData({
      page: Number(queryParams.page || 1),
      pageSize: Number(queryParams.limit || 10),
      searchTerm: String(queryParams.searchTerm || ''),
      tabIndex,
      currentUserId: user?.id,
      misPedidosStatus,
    });

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
  const visibleTotalItems = isBatchTab
    ? batches.length
    : isOwnOrdersTab
      ? ownOrdersTotalItems
      : totalItems;
  const isItemToEditEditable = isEditablePedidoForm(itemToEdit);

  useEffect(() => {
    if (isBatchTab) {
      syncPaginationFromResponse({
        data: batches,
        total: batches.length,
        page: 1,
        limit: batches.length || 1,
      });
      return;
    }

    syncPaginationFromResponse({
      data,
      total: totalItems,
      page: Number(queryParams.page) || 1,
      limit: Number(queryParams.limit) || 10,
    });
  }, [
    batches,
    data,
    isBatchTab,
    queryParams.limit,
    queryParams.page,
    syncPaginationFromResponse,
    totalItems,
  ]);

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

  const pedidoSchema = useMemo(() => getPedidoSchema(itemToEdit), [itemToEdit]);

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
      const numeroBatch =
        detail.entityType === 'pedido_usuario'
          ? batch.numeroGlobal
          : (batch as PurchaseBatch).numeroLote ||
            (batch as PurchaseBatch).numeroGlobal;

      return {
        id: batch.id,
        batchId: batch.id,
        targetType: detail.entityType,
        numeroGlobal: numeroBatch,
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
      };
    },
    []
  );

  const openNewPedidoForm = useCallback(() => {
    setItemToEdit({ targetType: 'pedido_usuario' });
    hasPromptedRef.current = true;
  }, []);

  const handleCreateClick = useCallback(() => {
    if (draft) {
      setIsNewPedidoWarningOpen(true);
      return;
    }

    openNewPedidoForm();
  }, [draft, openNewPedidoForm]);

  const handleRecoverDraft = useCallback(() => {
    if (draft) {
      setItemToEdit(draft.payload as PedidoFormValues);
    }
    setIsRecoveryOpen(false);
    setIsNewPedidoWarningOpen(false);
  }, [draft]);

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
    await deletePedidoById(itemToDelete.id);
    setItemToDelete(null);
  }, [deletePedidoById, itemToDelete]);

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
        (formData.motivoCancelacion as string) ||
        t('pedidos.cancelar.motivoPorDefecto');
      if (itemToCancelar.targetType === 'purchase_batch') {
        await cancelPurchaseBatchById(itemToCancelar.id, motivo);
      } else {
        await cancelPedidoById(itemToCancelar.id, motivo);
      }
      setItemToCancelar(null);
    },
    [cancelPedidoById, cancelPurchaseBatchById, itemToCancelar, t]
  );

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
          proveedorCount: providerNames.length,
          fechaPedido: detail.data.createdAt,
          numeroGlobal:
            detail.data.numeroLote || detail.data.numeroGlobal || undefined,
        };
      }

      return {
        id: detail.data.id,
        targetType: detail.entityType,
        proveedorNombre:
          providerNames.length > 0 ? providerNames.join(', ') : 'Pedido',
        proveedorCount: providerNames.length,
        fechaPedido: detail.data.fechaPedido,
        numeroGlobal: detail.data.numeroGlobal,
      };
    },
    []
  );

  const handleConsolidateWeekRequest = useCallback(
    async (pedidoUsuarioIds: string[], weekLabel: string) => {
      const pendingCount = data.filter(
        (p) =>
          pedidoUsuarioIds.includes(p.id) &&
          String(p.estado) === EstadoPedidoUsuario.PENDIENTE
      ).length;

      if (pendingCount > 0) {
        setItemToConsolidate({
          pedidoUsuarioIds,
          weekLabel,
          pendingCount,
          confirmStep: 1,
        });
      } else {
        await consolidatePedidosByIds(
          pedidoUsuarioIds,
          `Lote semanal generado desde ${weekLabel}`
        );
      }
    },
    [consolidatePedidosByIds, data]
  );

  const handleConsolidateConfirm = useCallback(async () => {
    if (!itemToConsolidate) return;
    if (
      itemToConsolidate.pendingCount > 0 &&
      itemToConsolidate.confirmStep === 1
    ) {
      setItemToConsolidate((prev) =>
        prev ? { ...prev, confirmStep: 2 } : null
      );
      return;
    }
    await consolidatePedidosByIds(
      itemToConsolidate.pedidoUsuarioIds,
      `Lote semanal generado desde ${itemToConsolidate.weekLabel}`,
      { autoApprovePending: itemToConsolidate.pendingCount > 0 }
    );
    setItemToConsolidate(null);
  }, [consolidatePedidosByIds, itemToConsolidate]);

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
          proveedorCount: pedido.proveedor ? 1 : 0,
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
          proveedorCount: pedido.proveedor ? 1 : 0,
          fechaPedido: pedido.fechaPedido,
        });
      },
      onViewDelivery: (pedido: PedidoListItem) => {
        if (isPedidoUsuarioRow(pedido)) return;
        setItemToViewDeliveryDate(pedido);
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
        totalItemsLabel={
          isBatchTab
            ? t('pedidos.totalItemsLabelCompras')
            : t('pedidos.totalItemsLabel')
        }
        searchTerm={searchTerm}
        viewMode={viewMode}
        onSearchChange={(value) => {
          onSearchChange(value);
          setSearchTerm(value);
        }}
        onViewModeChange={setViewMode}
        onCreateClick={handleCreateClick}
        onContinueDraftClick={handleRecoverDraft}
        extraActions={[
          {
            label: t('pedidos.acciones.reportePdf'),
            onClick: () => setIsReporteOpen(true),
            icon: <PictureAsPdfIcon />,
            id: 'btn-reporte-pedidos-pdf',
            color: 'error',
            variant: 'outlined',
          },
          {
            label: t('pedidos.acciones.exportarExcel'),
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

      <Paper
        id="pedidos-content-area"
        elevation={2}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Tabs
            id="pedidos-tabs"
            value={tabIndex}
            onChange={(_, newValue: PedidosTabValue) => {
              setTabIndex(newValue);
              onPageChange(null, 1);
            }}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
            aria-label={t('pedidos.titulo')}
          >
            <Tab
              icon={<AssignmentTurnedInOutlinedIcon />}
              label={t('pedidos.tabs.misPedidos')}
            />
            <Tab
              icon={<FormatListBulletedOutlinedIcon />}
              label={t('pedidos.tabs.pedidos')}
            />
            <Tab
              icon={<ShoppingCartCheckoutOutlinedIcon />}
              label={t('pedidos.tabs.compras')}
            />
          </Tabs>
        </Box>

        <Box sx={{ p: { xs: 2, sm: 4 } }}>
          {draft && !isRecoveryOpen && !itemToEdit && (
            <PedidoDraftBanner
              draft={draft}
              onRecover={handleRecoverDraft}
              onDiscard={handleDiscardDraft}
            />
          )}

          {!isLoading && error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {hasDashboardFilter && (
            <Alert
              severity="info"
              icon={<FilterListIcon />}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={clearDashboardFilter}
                  startIcon={<ClearIcon />}
                  sx={{ fontWeight: 700 }}
                >
                  {t('pedidos.dashboardFilter.quitar')}
                </Button>
              }
              sx={{
                mb: 3,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.info.main, 0.1),
                border: '1px solid',
                borderColor: alpha(theme.palette.info.main, 0.3),
                '& .MuiAlert-message': { fontWeight: 500 },
              }}
            >
              {t('pedidos.dashboardFilter.info')}
            </Alert>
          )}

          {isOwnOrdersTab && (
            <MisPedidosStatusTabs
              value={misPedidosStatus}
              onChange={(value) => {
                setMisPedidosStatus(value);
                onPageChange(null, 1);
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
              }}
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
              onConsolidateWeek={handleConsolidateWeekRequest}
            />
          ) : (
            <PedidosTable
              data={ownOrdersData}
              isLoading={isLoading}
              viewMode={viewMode}
              permissions={permissions}
              handlers={handlers}
              onSort={onSort}
              sortConfig={sortConfig}
              filters={tableFilters}
              onFilter={onFilter as (columnId: string, value: unknown) => void}
              pagination={paginationProps}
              onCreateClick={handleCreateClick}
            />
          )}

          <ConfirmDialog
            isOpen={!!itemToDelete}
            onClose={() => !isDeleting && setItemToDelete(null)}
            onConfirm={() => void handleDeleteConfirm()}
            title={t('pedidos.confirm.eliminarTitulo')}
            message={t('pedidos.confirm.eliminarMensaje', {
              fecha:
                itemToDelete?.fechaPedido &&
                !Number.isNaN(new Date(itemToDelete.fechaPedido).getTime())
                  ? formatLocalizedDate(itemToDelete.fechaPedido)
                  : '—',
            })}
            confirmText={t('pedidos.confirm.eliminarConfirm')}
            cancelText={t('comun.cancelar')}
            isLoading={isDeleting}
          />

          <ConfirmDialog
            isOpen={!!itemToAceptar}
            onClose={() => !isAceptando && setItemToAceptar(null)}
            onConfirm={() => void handleAceptarConfirm()}
            title={t('pedidos.confirm.aprobarTitulo')}
            message={
              <>
                {itemToAceptar?.targetType === 'purchase_batch' ? (
                  <>
                    {t('pedidos.confirm.aprobarCompra', {
                      numero: itemToAceptar?.numeroGlobal
                        ? `#${itemToAceptar.numeroGlobal} `
                        : '',
                      id: formatPedidoId(itemToAceptar?.id),
                    })}
                  </>
                ) : (
                  <>
                    {t('pedidos.confirm.aprobarPedido', {
                      numero: itemToAceptar?.numeroGlobal
                        ? `#${itemToAceptar.numeroGlobal} `
                        : '',
                      id: formatPedidoId(itemToAceptar?.id),
                      count: itemToAceptar?.proveedorCount ?? 1,
                    })}
                  </>
                )}
              </>
            }
            confirmText={t('pedidos.confirm.aprobarConfirm')}
            cancelText={t('comun.cancelar')}
            isLoading={isAceptando}
            confirmColor="success"
          />

          <ConfirmDialog
            isOpen={!!itemToConsolidate}
            onClose={() => !isConsolidatingBatch && setItemToConsolidate(null)}
            onConfirm={() => void handleConsolidateConfirm()}
            title={
              itemToConsolidate?.confirmStep === 2
                ? t('pedidos.confirm.consolidarPaso2Titulo')
                : t('pedidos.confirm.consolidarPaso1Titulo')
            }
            message={
              itemToConsolidate?.confirmStep === 2
                ? itemToConsolidate.pendingCount === 1
                  ? t('pedidos.confirm.consolidarPaso2MensajeUnico')
                  : t('pedidos.confirm.consolidarPaso2MensajeMultiple', {
                      count: itemToConsolidate.pendingCount,
                    })
                : itemToConsolidate?.pendingCount === 1
                  ? t('pedidos.confirm.consolidarPaso1MensajeUnico')
                  : t('pedidos.confirm.consolidarPaso1MensajeMultiple', {
                      count: itemToConsolidate?.pendingCount ?? 0,
                    })
            }
            confirmText={
              itemToConsolidate?.confirmStep === 2
                ? t('pedidos.confirm.consolidarPaso2Confirmar')
                : t('pedidos.confirm.consolidarPaso1Continuar')
            }
            cancelText={t('comun.cancelar')}
            isLoading={isConsolidatingBatch}
            confirmColor="primary"
          />

          <DynamicFormModal
            isOpen={!!itemToCancelar}
            onClose={() => !isCancelando && setItemToCancelar(null)}
            title={
              itemToCancelar?.targetType === 'purchase_batch'
                ? t('pedidos.cancelar.tituloCompra', {
                    id: formatPedidoId(itemToCancelar?.id),
                  })
                : t('pedidos.cancelar.tituloPedido', {
                    proveedor: itemToCancelar?.proveedorNombre || '—',
                  })
            }
            size="sm"
            fields={[
              {
                name: 'motivoCancelacion',
                label: t('pedidos.cancelar.motivoLabel'),
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
            title={(() => {
              const numeroRef = itemToEdit?.numeroGlobal
                ? `#${itemToEdit.numeroGlobal}`
                : formatPedidoId(itemToEdit?.batchId || itemToEdit?.id);
              if (itemToEdit?.targetType === 'purchase_batch') {
                return isItemToEditEditable
                  ? t('pedidos.editor.editarCompra', { numero: numeroRef })
                  : t('pedidos.editor.detallesCompra', { numero: numeroRef });
              }
              if (itemToEdit?.targetType === 'pedido_usuario') {
                return isItemToEditEditable
                  ? t('pedidos.editor.editarPedidoUsuario', {
                      numero: numeroRef,
                    })
                  : t('pedidos.editor.detallesPedidoUsuario', {
                      numero: numeroRef,
                    });
              }
              if (itemToEdit?.id) {
                return isItemToEditEditable
                  ? t('pedidos.editor.editarPedido')
                  : t('pedidos.editor.detallesPedido');
              }
              return t('pedidos.editor.crearNuevo');
            })()}
            size="lg"
            fields={pedidoSchema}
            initialData={itemToEdit || {}}
            onSubmit={
              isItemToEditEditable ? handleSave : () => setItemToEdit(null)
            }
            isSubmitting={isSaving}
            onValuesChange={handleValuesChange}
            requireConfirmation={isItemToEditEditable}
            submitLabel={
              isItemToEditEditable ? t('comun.guardar') : t('comun.cerrar')
            }
            cancelLabel={isItemToEditEditable ? t('comun.cancelar') : ''}
            confirmationMessage={
              itemToEdit?.id
                ? itemToEdit.targetType === 'purchase_batch'
                  ? t('pedidos.confirm.guardarCompra')
                  : t('pedidos.confirm.guardarPedido')
                : t('pedidos.confirm.registrarNuevo')
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

          <PedidoDeliveryDateDialog
            pedido={itemToViewDeliveryDate}
            onClose={() => setItemToViewDeliveryDate(null)}
          />

          <ReporteSelectorModal
            isOpen={isReporteOpen}
            onClose={() => setIsReporteOpen(false)}
            tipo="pedido"
          />

          <ConfirmDialog
            isOpen={isRecoveryOpen}
            onClose={() => setIsRecoveryOpen(false)}
            onConfirm={handleRecoverDraft}
            title={t('pedidos.recovery.titulo')}
            message={t('pedidos.recovery.mensaje', {
              fecha:
                draft?.updatedAt &&
                !Number.isNaN(new Date(draft.updatedAt).getTime())
                  ? formatLocalizedDate(draft.updatedAt)
                  : '...',
              hora:
                draft?.updatedAt &&
                !Number.isNaN(new Date(draft.updatedAt).getTime())
                  ? formatLocalizedTime(draft.updatedAt)
                  : '...',
            })}
            confirmText={t('pedidos.recovery.confirmar')}
            cancelText={t('pedidos.recovery.cancelar')}
            confirmColor="primary"
            onCancel={handleDiscardDraft}
          />

          <ConfirmDialog
            isOpen={isNewPedidoWarningOpen}
            onClose={() => setIsNewPedidoWarningOpen(false)}
            onConfirm={() => {
              setIsNewPedidoWarningOpen(false);
              openNewPedidoForm();
            }}
            title={t('pedidos.borradorExistente.titulo')}
            message={t('pedidos.borradorExistente.mensaje', {
              fecha:
                draft?.updatedAt &&
                !Number.isNaN(new Date(draft.updatedAt).getTime())
                  ? formatLocalizedDate(draft.updatedAt)
                  : '...',
            })}
            confirmText={t('pedidos.borradorExistente.confirmar')}
            cancelText={t('pedidos.borradorExistente.cancelar')}
            confirmColor="warning"
            onCancel={handleRecoverDraft}
          />

          <ConfirmDialog
            isOpen={isDraftCloseConfirmOpen}
            onClose={() => setIsDraftCloseConfirmOpen(false)}
            onConfirm={handleSaveDraftAndClose}
            title={t('pedidos.cerrarEditor.titulo')}
            message={t('pedidos.cerrarEditor.mensaje')}
            confirmText={t('pedidos.cerrarEditor.confirmar')}
            cancelText={t('pedidos.cerrarEditor.cancelar')}
            confirmColor="primary"
            onCancel={handleDiscardDraftAndClose}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default Pedidos;
