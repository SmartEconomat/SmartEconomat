import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import dayjs from 'dayjs';
import { Box, Paper, Alert } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

import ConfirmDialog from '../components/ui/ConfirmDialog';
import DynamicFormModal from '../components/ui/DynamicFormModal';
import { ModalCloseReason } from '../components/ui/Modal';
import { EstadoPedido, Pedido, PurchaseBatch } from '../services/pedido.types';
import { usePermission } from '../store/auth.hooks';
import { usePedidoDraft } from '../hooks/usePedidoDraft';
import ReporteSelectorModal from '../components/ui/ReporteSelectorModal';

// Nuevos componentes y hooks del refactor
import PedidoDeliveryDateDialog from '../features/pedidos/components/PedidoDeliveryDateDialog';
import PedidoDetailDrawer from '../features/pedidos/components/PedidoDetailDrawer';
import PedidoDraftBanner from '../features/pedidos/components/PedidoDraftBanner';
import PedidosPageHeader from '../features/pedidos/components/PedidosPageHeader';
import PedidosTable from '../features/pedidos/components/PedidosTable';
import PedidosTabs from '../features/pedidos/components/PedidosTabs';
import PurchaseBatchDetailModal from '../features/pedidos/components/PurchaseBatchDetailModal';
import PurchaseBatchList from '../features/pedidos/components/PurchaseBatchList';
import { usePedidoActions } from '../features/pedidos/hooks/usePedidoActions';
import { usePedidosData } from '../features/pedidos/hooks/usePedidosData';
import { usePedidosFilters } from '../features/pedidos/hooks/usePedidosFilters';
import {
  PedidoFormValues,
  PedidoPermissions,
} from '../features/pedidos/types/pedidos-ui.types';
import { buildPedidoPermissions } from '../features/pedidos/utils/pedidoPermissions';
import { getPedidoSchema } from '../features/pedidos/utils/pedidoSchema';

const Pedidos: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [itemToDelete, setItemToDelete] = useState<Pedido | null>(null);
  const [itemToAceptar, setItemToAceptar] = useState<Pedido | null>(null);
  const [itemToCancelar, setItemToCancelar] = useState<Pedido | null>(null);
  const [itemToEdit, setItemToEdit] = useState<PedidoFormValues | null>(null);
  const [itemToViewBatch, setItemToViewBatch] = useState<PurchaseBatch | null>(
    null
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
    isBatchTab,
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
  });

  const {
    savePedido,
    deletePedidoById,
    approvePedidoById,
    cancelPedidoById,
    fetchBatchDetail,
    isSaving,
    isDeleting,
    isAceptando,
    isCancelando,
    isFetchingBatch,
  } = usePedidoActions({
    reload,
    discardDraft,
    onPedidoDeleted: (deletedId) => {
      setData((current) => current.filter((pedido) => pedido.id !== deletedId));
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
    await approvePedidoById(itemToAceptar.id);
    setItemToAceptar(null);
  }, [approvePedidoById, itemToAceptar]);

  const handleCancelarSubmit = useCallback(
    async (formData: Record<string, unknown>) => {
      if (!itemToCancelar) return;
      const motivo =
        (formData.motivoCancelacion as string) || 'Cancelado por el usuario';
      await cancelPedidoById(itemToCancelar.id, motivo);
      setItemToCancelar(null);
    },
    [cancelPedidoById, itemToCancelar]
  );

  const handleViewBatch = useCallback(
    async (batch: PurchaseBatch) => {
      const fullBatch = await fetchBatchDetail(batch.id);
      setItemToViewBatch(fullBatch);
    },
    [fetchBatchDetail]
  );

  const handlers = useMemo(
    () => ({
      onView: (pedido: Pedido) => setItemToViewDetails(pedido),
      onEdit: (pedido: Pedido) => {
        setItemToViewDetails(null);
        setItemToEdit(buildEditData(pedido));
      },
      onDelete: (pedido: Pedido) => setItemToDelete(pedido),
      onApprove: (pedido: Pedido) => setItemToAceptar(pedido),
      onCancel: (pedido: Pedido) => setItemToCancelar(pedido),
      onViewDelivery: (pedido: Pedido) => setItemToViewDeliveryDate(pedido),
    }),
    [buildEditData]
  );

  return (
    <Box>
      <PedidosPageHeader
        canCreate={permissions.canCreate}
        draft={draft}
        isLoadingDraft={isLoadingDraft}
        totalItems={totalItems}
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

        {isBatchTab ? (
          <PurchaseBatchList
            batches={batches}
            isLoading={isLoading}
            isFetchingBatch={isFetchingBatch}
            handlers={{ onView: handleViewBatch }}
          />
        ) : (
          <PedidosTable
            data={data}
            isLoading={isLoading}
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
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
              ¿Estás seguro de que deseas aprobar el pedido al proveedor{' '}
              <strong>{itemToAceptar?.proveedor?.nombre}</strong>? Pasará a
              estar "En Proceso" y se considerará tramitado.
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
          title={`Cancelar Pedido: ${itemToCancelar?.proveedor?.nombre || ''}`}
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
            itemToEdit?.id
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
              ? '¿Estás seguro de que deseas guardar los cambios en este pedido?'
              : '¿Estás seguro de que deseas registrar este nuevo pedido?'
          }
        />

        <PurchaseBatchDetailModal
          batch={itemToViewBatch}
          onClose={() => setItemToViewBatch(null)}
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
