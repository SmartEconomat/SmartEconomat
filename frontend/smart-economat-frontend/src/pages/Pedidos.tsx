import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import dayjs from 'dayjs';
import { Box, Alert, Chip, Paper, Stack } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import DynamicFormModal from '../components/ui/DynamicFormModal';
import { ModalCloseReason } from '../components/ui/Modal';
import {
  EstadoPedido,
  Pedido,
  PedidoUsuario,
  PurchaseBatch,
} from '../services/pedido.types';
import { useAuth, usePermission } from '../store/auth.hooks';
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
  MisPedidosStatusFilter,
  PedidoFormValues,
  PedidoPermissions,
} from '../features/pedidos/types/pedidos-ui.types';
import { buildPedidoPermissions } from '../features/pedidos/utils/pedidoPermissions';
import { isAggregatedBatchPedido } from '../features/pedidos/utils/pedidoOwnOrders';
import { formatPedidoId } from '../features/pedidos/utils/pedidoFormatters';
import { getPedidoSchema } from '../features/pedidos/utils/pedidoSchema';

interface PedidoActionTarget {
  id: string;
  isBatchAggregate: boolean;
  proveedorNombre?: string;
  fechaPedido?: string;
  numeroGlobal?: string | number;
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

  const misPedidosStatusOptions = useMemo(
    () => [
      { value: 'pendientes' as MisPedidosStatusFilter, label: 'Pendientes' },
      { value: 'en_proceso' as MisPedidosStatusFilter, label: 'En proceso' },
      { value: 'finalizados' as MisPedidosStatusFilter, label: 'Finalizados' },
    ],
    []
  );

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

  const {
    savePedido,
    deletePedidoById,
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
      setItemToViewBatch(batch);
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

  const buildEditData = useCallback((row: Pedido): PedidoFormValues => {
    return {
      ...row,
      proveedorId: row.proveedor?.id,
      pedidoProductos:
        row.pedidoProductos?.map((pedidoProducto) => ({
          id: pedidoProducto.id,
          productoProveedorId: pedidoProducto.productoProveedor?.id,
          productoProveedor: pedidoProducto.productoProveedor,
          cantidad: pedidoProducto.cantidad,
          precioUnitario: pedidoProducto.precioUnitario,
          observaciones: pedidoProducto.observaciones,
        })) || [],
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
      };
    },
    []
  );

  const openNewPedidoForm = useCallback(() => {
    setItemToEdit({});
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
    if (itemToAceptar.isBatchAggregate) {
      await approvePurchaseBatchById(itemToAceptar.id);
    } else {
      // Al aprobar un pedido individual, lo consolidamos (se une a la lista de compra de la semana)
      await consolidatePedidosByIds(
        [itemToAceptar.id],
        `Lote generado al aprobar pedido individual de ${itemToAceptar.proveedorNombre}`
      );
    }
    setItemToAceptar(null);
  }, [consolidatePedidosByIds, approvePurchaseBatchById, itemToAceptar]);

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

      return {
        id: batch.id,
        isBatchAggregate: true,
        proveedorNombre:
          providerNames.length > 0 ? providerNames.join(', ') : 'Pedido',
        fechaPedido: 'createdAt' in batch ? batch.createdAt : batch.fechaPedido,
        numeroGlobal: 'numeroGlobal' in batch ? batch.numeroGlobal : undefined,
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
        if (isAggregatedBatchPedido(pedido)) return;
        setItemToDelete(pedido);
      },
      onApprove: (pedido: Pedido) => {
        if (isAggregatedBatchPedido(pedido)) {
          setItemToAceptar({
            id: pedido.id,
            isBatchAggregate: true,
            proveedorNombre: pedido.proveedor?.nombre,
            fechaPedido: pedido.fechaPedido,
            numeroGlobal: pedido.numeroGlobal,
          });
          return;
        }
        setItemToAceptar({
          id: pedido.id,
          isBatchAggregate: false,
          proveedorNombre: pedido.proveedor?.nombre,
          fechaPedido: pedido.fechaPedido,
          numeroGlobal: pedido.numeroGlobal,
        });
      },
      onCancel: (pedido: Pedido) => {
        if (isAggregatedBatchPedido(pedido)) {
          setItemToCancelar({
            id: pedido.id,
            isBatchAggregate: true,
            proveedorNombre: pedido.proveedor?.nombre,
            fechaPedido: pedido.fechaPedido,
          });
          return;
        }
        setItemToCancelar({
          id: pedido.id,
          isBatchAggregate: false,
          proveedorNombre: pedido.proveedor?.nombre,
          fechaPedido: pedido.fechaPedido,
        });
      },
      onViewDelivery: (pedido: Pedido) => {
        if (isAggregatedBatchPedido(pedido)) return;
        setItemToViewDeliveryDate(pedido);
      },
    }),
    [buildEditData, handleOpenBatchEditor, handleViewBatch]
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
          <Stack
            direction="row"
            spacing={1}
            sx={{ mb: 3, flexWrap: 'wrap', rowGap: 1 }}
          >
            {misPedidosStatusOptions.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                clickable
                color={
                  misPedidosStatus === option.value ? 'primary' : 'default'
                }
                variant={
                  misPedidosStatus === option.value ? 'filled' : 'outlined'
                }
                onClick={() => {
                  setMisPedidosStatus(option.value);
                  setPage(1);
                }}
              />
            ))}
          </Stack>
        )}

        {isBatchTab ? (
          <PurchasesWeeklyBoard
            batches={batches}
            isLoading={isLoading}
            handlers={{
              onView: (batch) => void handleViewBatch(batch, 'batch'),
              onRecepcion: (batch) => void startRecepcionFromBatch(batch),
            }}
          />
        ) : isWeeklyTab ? (
          <PedidosWeeklyBoard
            data={data}
            isLoading={isLoading}
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
            onPageSizeChange={(nextPageSize) => {
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
          title="Eliminar pedido"
          message={
            <>
              ¿Estás seguro de que deseas eliminar el pedido del{' '}
              <strong>
                {itemToDelete?.fechaPedido
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

        <ConfirmDialog
          isOpen={!!itemToAceptar}
          onClose={() => !isAceptando && setItemToAceptar(null)}
          onConfirm={() => void handleAceptarConfirm()}
          title="Aprobar Pedido"
          message={
            <>
              {itemToAceptar?.isBatchAggregate ? (
                <>
                  ¿Estás seguro de que deseas aprobar el pedido{' '}
                  <strong>
                    {itemToAceptar?.numeroGlobal
                      ? `#${itemToAceptar.numeroGlobal} `
                      : ''}
                  </strong>
                  ({formatPedidoId(itemToAceptar?.id)}) ? Este se tramitará como
                  compra única y pasará a estar en <strong>En Proceso</strong>.
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
            itemToCancelar?.isBatchAggregate
              ? `Cancelar Pedido : ${formatPedidoId(itemToCancelar?.id)}`
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
            itemToEdit?.isBatchAggregate
              ? itemToEdit.estado === EstadoPedido.PENDIENTE
                ? `Editar Pedido ${itemToEdit?.numeroGlobal ? `#${itemToEdit.numeroGlobal}` : formatPedidoId(itemToEdit?.batchId || itemToEdit?.id)}`
                : `Detalles del Pedido ${itemToEdit?.numeroGlobal ? `#${itemToEdit.numeroGlobal}` : formatPedidoId(itemToEdit?.batchId || itemToEdit?.id)} (Solo lectura)`
              : itemToEdit?.id
                ? itemToEdit.estado === EstadoPedido.PENDIENTE
                  ? 'Editar Pedido'
                  : 'Detalles del Pedido (Solo lectura)'
                : 'Crear Nuevo Pedido'
          }
          size="lg"
          fields={pedidoSchema}
          initialData={itemToEdit || {}}
          onSubmit={
            itemToEdit?.estado && itemToEdit.estado !== EstadoPedido.PENDIENTE
              ? () => setItemToEdit(null)
              : handleSave
          }
          isSubmitting={isSaving}
          onValuesChange={handleValuesChange}
          requireConfirmation={
            itemToEdit?.estado === EstadoPedido.PENDIENTE || !itemToEdit?.id
          }
          submitLabel={
            itemToEdit?.estado && itemToEdit.estado !== EstadoPedido.PENDIENTE
              ? 'Cerrar'
              : 'Guardar'
          }
          cancelLabel={
            itemToEdit?.estado && itemToEdit.estado !== EstadoPedido.PENDIENTE
              ? ''
              : 'Cancelar'
          }
          confirmationMessage={
            itemToEdit?.id
              ? itemToEdit.isBatchAggregate
                ? '¿Estás seguro de que deseas guardar los cambios en este pedido?'
                : '¿Estás seguro de que deseas guardar los cambios en este pedido?'
              : '¿Estás seguro de que deseas registrar este nuevo pedido?'
          }
        />

        <PurchaseBatchDetailModal
          batch={itemToViewBatch}
          canEdit={permissions.canEdit}
          canApprove={permissions.canApprove}
          canCancel={permissions.canCancel}
          mode={batchViewMode}
          onClose={() => setItemToViewBatch(null)}
          onEdit={handleEditBatch}
          onApprove={(batch) => {
            setItemToViewBatch(null);
            setItemToAceptar(buildBatchActionTarget(batch));
          }}
          onCancel={(batch) => {
            setItemToViewBatch(null);
            setItemToCancelar(buildBatchActionTarget(batch));
          }}
          onRecepcion={(batch) => {
            setItemToViewBatch(null);
            void startRecepcionFromBatch(batch);
          }}
        />

        <PedidoDetailDrawer
          pedido={itemToViewDetails}
          canEdit={permissions.canEdit}
          onClose={() => setItemToViewDetails(null)}
          onEdit={(pedido) => {
            setItemToViewDetails(null);
            setItemToEdit(buildEditData(pedido));
          }}
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

        <ConfirmDialog
          isOpen={isNewPedidoWarningOpen}
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

        <ConfirmDialog
          isOpen={isDraftCloseConfirmOpen}
          onClose={() => setIsDraftCloseConfirmOpen(false)}
          onConfirm={handleSaveDraftAndClose}
          title="¿Qué quieres hacer con este pedido?"
          message="Si lo guardas en borrador, podrás retomarlo más tarde. Si cancelas ahora, se descartará el pedido pendiente."
          confirmText="Guardar en borrador"
          cancelText="Cancelar pedido"
          confirmColor="primary"
          onCancel={handleDiscardDraftAndClose}
        />
      </Paper>
    </Box>
  );
};

export default Pedidos;
