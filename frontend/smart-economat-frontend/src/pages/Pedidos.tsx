import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import dayjs from 'dayjs';
import { Box, Alert, Paper } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { useTranslation } from 'react-i18next';
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
import MisPedidosStatusTabs from '../features/pedidos/components/MisPedidosStatusTabs';
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
  fechaPedido?: string;
  numeroGlobal?: string | number;
}

/**
 * @description Strips auto-generated weekly batch observation text from an order's notes.
 * @param observaciones - The raw observations string from the order.
 * @returns The sanitised string, or empty string if it matches the auto-generated pattern.
 */
const sanitizePedidoObservation = (observaciones?: string) => {
  if (!observaciones) return '';
  return /^Lote semanal generado desde/i.test(observaciones)
    ? ''
    : observaciones;
};

/**
 * @description Determines whether the given pedido form values represent an editable order.
 * New orders, pending purchase batches, and pending user orders are editable.
 * @param itemToEdit - The current form values, or null if no order is being edited.
 * @returns True if the order form should be in edit mode; false for read-only.
 */
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
 * @description Page component for managing orders (pedidos) and purchase batches.
 * Supports weekly board view, list view, draft recovery, approvals, cancellations, and exports.
 * @returns The Pedidos React page element.
 */
const Pedidos: React.FC = () => {
  const { t } = useTranslation();
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

  const canEdit = usePermission(PERMISSIONS.pedidos.editar);
  const canDelete = usePermission(PERMISSIONS.pedidos.eliminar);
  const canCreate = usePermission(PERMISSIONS.pedidos.crear);

  /**
   * @description Memoised permissions object built from the user's individual permission flags.
   */
  const permissions: PedidoPermissions = useMemo(
    () => buildPedidoPermissions(canCreate, canEdit, canDelete),
    [canCreate, canDelete, canEdit]
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

  /**
   * @description Memoised filtered data for the "mis pedidos" tab based on the selected status.
   * Falls back to the full data array when not on the own-orders tab.
   */
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

  /**
   * @description Exports the current filtered order list as an Excel file.
   * @returns Promise that resolves when the download is initiated.
   */
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

  /**
   * @description Memoised dynamic form schema for the pedido editor, derived from the item being edited.
   */
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

  /**
   * @description Checks whether the given form values contain enough content to be saved as a draft.
   * @param vals - The current form values object.
   * @returns True if there are product lines or non-empty observations.
   */
  const hasDraftableContent = useCallback((vals: Record<string, unknown>) => {
    const lines = (vals.pedidoProductos as unknown[]) || [];
    const observations = (vals.observaciones as string) || '';

    return (
      lines.length > 0 ||
      Boolean(observations && observations.trim().length > 0)
    );
  }, []);

  /**
   * @description Clears the current pedido editor state and closes the draft-close confirm dialog.
   */
  const closePedidoEditor = useCallback(() => {
    setItemToEdit(null);
    setIsDraftCloseConfirmOpen(false);
    latestValsRef.current = {};
  }, []);

  /**
   * @description Handles form value changes in the pedido editor. Auto-saves a draft
   * whenever draftable content exists and the form is for a new (unsaved) order.
   * @param vals - The current form values object.
   */
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

  /**
   * @description Handles the modal close action for the pedido editor.
   * For new orders with content, shows the draft-close confirm dialog or flushes the draft
   * on backdrop click. Existing orders close immediately.
   * @param reason - The reason the modal was closed (e.g. 'backdropClick').
   */
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

  /**
   * @description Flushes any draftable content to the draft store and then closes the editor.
   */
  const handleSaveDraftAndClose = useCallback(() => {
    const vals = latestValsRef.current;

    if (hasDraftableContent(vals)) {
      void flushSave(vals);
    }

    closePedidoEditor();
  }, [closePedidoEditor, flushSave, hasDraftableContent]);

  /**
   * @description Discards the current draft and closes the pedido editor.
   */
  const handleDiscardDraftAndClose = useCallback(() => {
    void discardDraft();
    closePedidoEditor();
  }, [closePedidoEditor, discardDraft]);

  /**
   * @description Builds PedidoFormValues from a fully-loaded batch detail, normalising
   * the pedidoProductos array for use in the editor form.
   * @param detail - The fully-loaded PedidoBatchDetail object.
   * @returns A PedidoFormValues object suitable for the editor form's initialData.
   */
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

  /**
   * @description Opens the new pedido editor form, marking the draft prompt as already shown.
   */
  const openNewPedidoForm = useCallback(() => {
    setItemToEdit({ targetType: 'pedido_usuario' });
    hasPromptedRef.current = true;
  }, []);

  /**
   * @description Handles the "create new order" button click. If a draft exists, shows a
   * warning dialog; otherwise directly opens the new pedido form.
   */
  const handleCreateClick = useCallback(() => {
    if (draft) {
      setIsNewPedidoWarningOpen(true);
      return;
    }

    openNewPedidoForm();
  }, [draft, openNewPedidoForm]);

  /**
   * @description Restores the saved draft into the editor and closes the recovery/warning dialogs.
   */
  const handleRecoverDraft = useCallback(() => {
    if (draft) {
      setItemToEdit(draft.payload as PedidoFormValues);
    }
    setIsRecoveryOpen(false);
    setIsNewPedidoWarningOpen(false);
  }, [draft]);

  /**
   * @description Discards the saved draft and closes the recovery dialog.
   */
  const handleDiscardDraft = useCallback(() => {
    void discardDraft();
    setIsRecoveryOpen(false);
  }, [discardDraft]);

  /**
   * @description Submits the pedido editor form by calling savePedido and then closing the editor.
   * @param formData - The submitted form values.
   * @returns Promise that resolves when the order is saved.
   */
  const handleSave = useCallback(
    async (formData: Record<string, unknown>) => {
      await savePedido(formData as PedidoFormValues);
      setItemToEdit(null);
    },
    [savePedido]
  );

  /**
   * @description Confirms deletion of the currently selected pedido.
   * @returns Promise that resolves when deletion is complete.
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (!itemToDelete) return;
    await deletePedidoById(itemToDelete.id);
    setItemToDelete(null);
  }, [deletePedidoById, itemToDelete]);

  /**
   * @description Confirms approval of the currently selected pedido or purchase batch.
   * @returns Promise that resolves when the approval is complete.
   */
  const handleAceptarConfirm = useCallback(async () => {
    if (!itemToAceptar) return;
    if (itemToAceptar.targetType === 'purchase_batch') {
      await approvePurchaseBatchById(itemToAceptar.id);
    } else {
      await approvePedidoById(itemToAceptar.id);
    }
    setItemToAceptar(null);
  }, [approvePedidoById, approvePurchaseBatchById, itemToAceptar]);

  /**
   * @description Handles submission of the cancellation form, extracting the motivo and
   * calling the appropriate cancel API (batch or pedido_usuario).
   * @param formData - Form values containing optional motivoCancelacion.
   * @returns Promise that resolves when the cancellation is complete.
   */
  const handleCancelarSubmit = useCallback(
    async (formData: Record<string, unknown>) => {
      if (!itemToCancelar) return;
      const motivo =
        (formData.motivoCancelacion as string) || t('pedidos.cancelar.motivoPorDefecto');
      if (itemToCancelar.targetType === 'purchase_batch') {
        await cancelPurchaseBatchById(itemToCancelar.id, motivo);
      } else {
        await cancelPedidoById(itemToCancelar.id, motivo);
      }
      setItemToCancelar(null);
    },
    [cancelPedidoById, cancelPurchaseBatchById, itemToCancelar, t]
  );

  /**
   * @description Fetches the full detail of a batch or pedido_usuario by ID and opens the detail modal.
   * @param id - The UUID of the order or batch.
   * @param entityType - Whether the entity is a 'purchase_batch' or 'pedido_usuario'.
   * @returns Promise that resolves when the detail is loaded.
   */
  const handleViewBatch = useCallback(
    async (id: string, entityType: PedidoDetailEntityType) => {
      const fullBatch = await fetchBatchDetail(id, entityType);
      setItemToViewBatch(fullBatch);
    },
    [fetchBatchDetail]
  );

  /**
   * @description Closes the batch detail modal and opens the batch editor form.
   * @param detail - The PedidoBatchDetail to edit.
   */
  const handleEditBatch = useCallback(
    (detail: PedidoBatchDetail) => {
      setItemToViewBatch(null);
      setItemToEdit(buildBatchEditData(detail));
    },
    [buildBatchEditData]
  );

  /**
   * @description Fetches the full batch detail and opens the editor form, closing any open detail views.
   * @param batchId - The UUID of the batch to open.
   * @param entityType - The entity type of the batch.
   * @returns Promise that resolves when the batch is loaded and the editor opened.
   */
  const handleOpenBatchEditor = useCallback(
    async (batchId: string, entityType: PedidoDetailEntityType) => {
      const fullBatch = await fetchBatchDetail(batchId, entityType);
      setItemToViewBatch(null);
      setItemToViewDetails(null);
      setItemToEdit(buildBatchEditData(fullBatch));
    },
    [buildBatchEditData, fetchBatchDetail]
  );

  /**
   * @description Builds a PedidoActionTarget from a batch detail for use in approve/cancel dialogs.
   * @param detail - The PedidoBatchDetail to extract action target data from.
   * @returns A PedidoActionTarget with id, targetType, proveedorNombre, fechaPedido, and numeroGlobal.
   */
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
            providerNames.length > 0 ? providerNames.join(', ') : t('pedidos.pedidoFallback'),
          fechaPedido: detail.data.createdAt,
          numeroGlobal:
            detail.data.numeroLote || detail.data.numeroGlobal || undefined,
        };
      }

      return {
        id: detail.data.id,
        targetType: detail.entityType,
        proveedorNombre:
          providerNames.length > 0 ? providerNames.join(', ') : t('pedidos.pedidoFallback'),
        fechaPedido: detail.data.fechaPedido,
        numeroGlobal: detail.data.numeroGlobal,
      };
    },
    [t]
  );

  /**
   * @description Consolidates a list of pedido_usuario IDs into a weekly purchase batch.
   * @param pedidoUsuarioIds - Array of pedido_usuario UUIDs to consolidate.
   * @param weekLabel - Human-readable label for the week used in the batch observation.
   * @returns Promise that resolves when consolidation is complete.
   */
  const handleConsolidateWeek = useCallback(
    async (pedidoUsuarioIds: string[], weekLabel: string) => {
      await consolidatePedidosByIds(
        pedidoUsuarioIds,
        `Lote semanal generado desde ${weekLabel}`
      );
    },
    [consolidatePedidosByIds]
  );

  /**
   * @description Memoised event handler map passed down to table and board components.
   * Covers view, edit, delete, approve, cancel, and delivery date actions.
   */
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
        totalItemsLabel={isBatchTab ? t('pedidos.totalItemsLabelCompras') : t('pedidos.totalItemsLabel')}
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
            onChange={(value) => {
              setMisPedidosStatus(value);
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
            onConsolidateWeek={handleConsolidateWeek}
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
          />
        )}

        <ConfirmDialog
          isOpen={!!itemToDelete}
          onClose={() => !isDeleting && setItemToDelete(null)}
          onConfirm={() => void handleDeleteConfirm()}
          title={t('pedidos.confirm.eliminarTitulo')}
          message={
            <>
              {t('pedidos.confirm.eliminarMensaje', {
                fecha: itemToDelete?.fechaPedido
                  ? dayjs(itemToDelete.fechaPedido).format('DD/MM/YYYY')
                  : '',
              })}
            </>
          }
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
                    proveedor: itemToAceptar?.proveedorNombre,
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

        <DynamicFormModal
          isOpen={!!itemToCancelar}
          onClose={() => !isCancelando && setItemToCancelar(null)}
          title={
            itemToCancelar?.targetType === 'purchase_batch'
              ? t('pedidos.cancelar.tituloCompra', { id: formatPedidoId(itemToCancelar?.id) })
              : t('pedidos.cancelar.tituloPedido', { proveedor: itemToCancelar?.proveedorNombre || '' })
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
          title={
            itemToEdit?.targetType === 'purchase_batch'
              ? isItemToEditEditable
                ? t('pedidos.editor.editarCompra', {
                    numero: itemToEdit?.numeroGlobal
                      ? `#${itemToEdit.numeroGlobal}`
                      : formatPedidoId(itemToEdit?.batchId || itemToEdit?.id),
                  })
                : t('pedidos.editor.detallesCompra', {
                    numero: itemToEdit?.numeroGlobal
                      ? `#${itemToEdit.numeroGlobal}`
                      : formatPedidoId(itemToEdit?.batchId || itemToEdit?.id),
                  })
              : itemToEdit?.targetType === 'pedido_usuario'
                ? isItemToEditEditable
                  ? t('pedidos.editor.editarPedidoUsuario', {
                      numero: itemToEdit?.numeroGlobal
                        ? `#${itemToEdit.numeroGlobal}`
                        : formatPedidoId(itemToEdit?.batchId || itemToEdit?.id),
                    })
                  : t('pedidos.editor.detallesPedidoUsuario', {
                      numero: itemToEdit?.numeroGlobal
                        ? `#${itemToEdit.numeroGlobal}`
                        : formatPedidoId(itemToEdit?.batchId || itemToEdit?.id),
                    })
                : itemToEdit?.id
                  ? isItemToEditEditable
                    ? t('pedidos.editor.editarPedido')
                    : t('pedidos.editor.detallesPedido')
                  : t('pedidos.editor.crearNuevo')
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
          submitLabel={isItemToEditEditable ? t('comun.guardar') : t('comun.cerrar')}
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
          message={
            <>
              {t('pedidos.recovery.mensaje', {
                fecha: dayjs(draft?.updatedAt).isValid()
                  ? dayjs(draft?.updatedAt).format('DD/MM/YYYY')
                  : '...',
                hora: dayjs(draft?.updatedAt).isValid()
                  ? dayjs(draft?.updatedAt).format('HH:mm')
                  : '...',
              })}
            </>
          }
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
          message={
            <>
              {t('pedidos.borradorExistente.mensaje', {
                fecha: dayjs(draft?.updatedAt).isValid()
                  ? dayjs(draft?.updatedAt).format('DD/MM/YYYY')
                  : '...',
              })}
            </>
          }
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
      </Paper>
    </Box>
  );
};

export default Pedidos;
