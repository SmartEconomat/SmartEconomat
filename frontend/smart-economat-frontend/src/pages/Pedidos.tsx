import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import dayjs from 'dayjs';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  Alert,
  Button,
  Stack,
  SelectChangeEvent,
  Tabs,
  Tab,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import AddIcon from '@mui/icons-material/Add';
import DataTable, { Column } from '../components/ui/DataTable';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import DynamicFormModal, {
  DynamicField,
} from '../components/ui/DynamicFormModal';
import { Pedido, EstadoPedido, PurchaseBatch } from '../services/pedido.types';
import {
  fetchPedidos,
  createPedido,
  updatePedido,
  createPurchaseBatch,
  fetchPurchaseBatches,
  fetchPurchaseBatchById,
  cancelPedido,
  aceptarPedido,
} from '../services/pedido.service';
import { deleteResource } from '../services/api.service';
import { fetchProveedores } from '../services/proveedor.service';
import { useToast } from '../store/toast.hooks';
import StatusChip from '../components/ui/StatusChip';
import { usePermission } from '../store/auth.hooks';
import PageToolbar from '../components/ui/PageToolbar';
import { usePedidoDraft } from '../hooks/usePedidoDraft';

const getPedidoSchema = (
  row: Record<string, unknown> | null
): DynamicField[] => {
  if (!row)
    return [
      {
        name: 'observaciones',
        label: 'Observaciones Generales',
        type: 'textarea',
        position: 'bottom',
      },
      {
        name: 'pedidoProductos',
        label: 'Detalle de Productos',
        type: 'orderLines',
        position: 'bottom',
      },
    ];

  const fields: DynamicField[] = [];

  if (row.estado === EstadoPedido.CANCELADO) {
    fields.push({
      name: 'motivoCancelacion',
      label: 'Motivo de la Cancelación',
      type: 'textarea',
      disabled: true,
      position: 'bottom',
    });
  }

  if (row.estado === EstadoPedido.INCIDENCIA) {
    fields.push({
      name: 'motivoIncidencia',
      label: 'Motivo de la Incidencia',
      type: 'textarea',
      disabled: true,
      position: 'bottom',
    });
  }

  fields.push({
    name: 'observaciones',
    label: 'Observaciones Generales',
    type: 'textarea',
    position: 'bottom',
    disabled: Boolean(row.estado && row.estado !== EstadoPedido.PENDIENTE),
  });

  fields.push({
    name: 'pedidoProductos',
    label: 'Detalle de Productos',
    type: 'orderLines',
    position: 'bottom',
    disabled: Boolean(row.estado && row.estado !== EstadoPedido.PENDIENTE),
  });

  return fields;
};

const Pedidos: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState<Pedido[]>([]);
  const [batches, setBatches] = useState<PurchaseBatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Pedido | null>(null);
  const [itemToAceptar, setItemToAceptar] = useState<Pedido | null>(null);
  const [itemToCancelar, setItemToCancelar] = useState<Pedido | null>(null);
  const [itemToEdit, setItemToEdit] = useState<Record<string, unknown> | null>(
    null
  );
  const [itemToViewBatch, setItemToViewBatch] = useState<PurchaseBatch | null>(
    null
  );
  const [isFetchingBatch, setIsFetchingBatch] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAceptando, setIsAceptando] = useState(false);
  const [isCancelando, setIsCancelando] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
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
  const toast = useToast();

  const pedidoSchema = useMemo(
    () => getPedidoSchema(itemToEdit || {}),
    [itemToEdit]
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (tabIndex === 2) {
        const batchesData = await fetchPurchaseBatches();
        setBatches(batchesData);
      } else {
        const estadoFilter =
          tabIndex === 0
            ? EstadoPedido.PENDIENTE
            : `NOT_${EstadoPedido.PENDIENTE}`;
        const [dataLoad] = await Promise.all([
          fetchPedidos(page, pageSize, searchTerm, estadoFilter),
          fetchProveedores(1, 50).catch(() => ({ data: [] })),
        ]);
        setData(dataLoad.data);
        setTotalItems(dataLoad.total);
        setTotalPages(dataLoad.totalPages);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error desconocido al cargar pedidos.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, searchTerm, tabIndex]);

  useEffect(() => {
    void loadData();
    void loadDraft();
  }, [loadData, loadDraft, page, pageSize, searchTerm, tabIndex]);

  useEffect(() => {
    // Solo auto-prompt si no lo hemos hecho ya en esta carga de página
    // Y después de que la carga inicial del borrador haya terminado (o si ya sabemos que no hay)
    if (isLoadingDraft) return;

    if (
      draft &&
      !isRecoveryOpen &&
      !hasPromptedRef.current &&
      (!itemToEdit || (Object.keys(itemToEdit).length === 0 && !itemToEdit.id))
    ) {
      setIsRecoveryOpen(true);
      hasPromptedRef.current = true;
    } else if (!draft && !isLoadingDraft && !hasPromptedRef.current) {
      // Si ya cargó y no hay borrador, marcamos como notificado para evitar que
      // borradores nuevos creados en esta sesión disparen el popup.
      hasPromptedRef.current = true;
    }
  }, [draft, itemToEdit, isRecoveryOpen, isLoadingDraft]);

  const handleValuesChange = useCallback(
    (vals: Record<string, unknown>) => {
      latestValsRef.current = vals;
      // Solo auto-guardar si es un pedido nuevo
      if (!itemToEdit?.id) {
        const lines = (vals['pedidoProductos'] as unknown[]) || [];
        const observations = (vals['observaciones'] as string) || '';
        const hasContent =
          lines.length > 0 || (observations && observations.trim().length > 0);
        if (hasContent) {
          void saveDraft(vals);
        }
      }
    },
    [itemToEdit?.id, saveDraft]
  );

  const handleCloseModal = useCallback(() => {
    // Forzar guardado antes de cerrar si es un borrador nuevo y tiene contenido
    if (!itemToEdit?.id) {
      const vals = latestValsRef.current;
      const lines = (vals['pedidoProductos'] as unknown[]) || [];
      const observations = (vals['observaciones'] as string) || '';
      const hasContent =
        lines.length > 0 || (observations && observations.trim().length > 0);
      if (hasContent) {
        void flushSave(vals);
      }
    }
    setItemToEdit(null);
    latestValsRef.current = {};
  }, [itemToEdit?.id, flushSave]);

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteResource(`/pedidos/${itemToDelete.id}`);
      setData((prev) => prev.filter((p) => p.id !== itemToDelete.id));
      toast.success(`Pedido eliminado correctamente.`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al eliminar el pedido.';
      toast.error(message);
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSave = async (formData: Record<string, any>) => {
    setIsSaving(true);
    try {
      const isEdit = !!formData.id;
      const lines = formData.pedidoProductos || [];
      if (!Array.isArray(lines) || lines.length === 0) {
        toast.error('El pedido debe contener al menos una línea válida.');
        setIsSaving(false);
        return;
      }

      interface NormalizedLine {
        productoProveedorId: string;
        proveedorId: string;
        cantidad: number;
      }
      const normalizedLines: NormalizedLine[] = lines
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((l: any) => ({
          productoProveedorId: l.productoProveedorId || l.id_producto_proveedor,
          proveedorId:
            l.proveedorId ||
            l.productoProveedor?.proveedor?.id ||
            l.productoProveedor?.proveedorId,
          cantidad: Number(l.cantidad),
        }))
        .filter(
          (l) =>
            l.productoProveedorId &&
            Number.isFinite(l.cantidad) &&
            l.cantidad > 0
        );

      if (normalizedLines.length === 0) {
        toast.error(
          'Cada línea debe tener un producto-proveedor y una cantidad mayor que 0.'
        );
        setIsSaving(false);
        return;
      }

      // Agrupar las líneas por proveedor
      const linesByProvider = new Map<string, NormalizedLine[]>();
      let missingProvider = false;

      normalizedLines.forEach((l) => {
        const pId = l.proveedorId || formData.proveedorId;
        if (!pId) missingProvider = true;
        if (!linesByProvider.has(pId)) linesByProvider.set(pId, []);
        linesByProvider.get(pId)!.push(l);
      });

      if (missingProvider) {
        toast.error(
          'Ocurrió un error al identificar el proveedor de algunos productos.'
        );
        setIsSaving(false);
        return;
      }

      if (isEdit) {
        // En una edición, obligatoriamente debemos actualizar el pedido actual con las líneas de su proveedor original
        const mainProviderLines = linesByProvider.get(formData.proveedorId);
        if (!mainProviderLines) {
          toast.error(
            'Debes mantener al menos un producto del proveedor original del pedido.'
          );
          setIsSaving(false);
          return;
        }

        const mainApiLines = mainProviderLines.map((l) => ({
          productoProveedorId: l.productoProveedorId,
          cantidad: l.cantidad,
        }));

        await updatePedido(formData.id, {
          proveedorId: formData.proveedorId,
          lineas: mainApiLines,
          observaciones: formData.observaciones,
        });
        linesByProvider.delete(formData.proveedorId);

        // Si añadieron productos de otros proveedores, generamos nuevos pedidos para ellos
        if (linesByProvider.size > 0) {
          for (const [pId, pLines] of Array.from(linesByProvider.entries())) {
            const extraApiLines = pLines.map((l) => ({
              productoProveedorId: l.productoProveedorId,
              cantidad: l.cantidad,
            }));
            await createPedido({
              proveedorId: pId,
              lineas: extraApiLines,
              observaciones: formData.observaciones,
            });
          }
          toast.success(
            'Pedido actualizado, y se crearon nuevos pedidos separados para los otros proveedores.'
          );
        } else {
          toast.success('Pedido actualizado correctamente.');
        }
      } else {
        // Modo Creación: enviar todo al backend en una única transacción de lote
        const apiLines = normalizedLines.map((l) => ({
          productoProveedorId: l.productoProveedorId,
          cantidad: l.cantidad,
        }));

        await createPurchaseBatch({
          lineas: apiLines,
          observaciones: formData.observaciones,
        });

        toast.success(
          linesByProvider.size > 1
            ? `Se ha registrado el lote de compra con ${linesByProvider.size} pedidos agrupados.`
            : 'Pedido registrado correctamente.'
        );
        // Limpiar borrador tras éxito
        await discardDraft();
      }
      await loadData();
      setItemToEdit(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al guardar el pedido.';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const canEdit = usePermission('pedidos:editar');
  const canDelete = usePermission('pedidos:eliminar');
  const canCreate = usePermission('pedidos:crear');

  const handleEditClick = (row: Pedido) => {
    const editData = {
      ...row,
      proveedorId: row.proveedor?.id,
      pedidoProductos:
        row.pedidoProductos?.map((pp) => ({
          id: pp.id,
          productoProveedorId: pp.productoProveedor?.id,
          productoProveedor: pp.productoProveedor,
          cantidad: pp.cantidad,
          precioUnitario: pp.precioUnitario,
          observaciones: pp.observaciones,
        })) || [],
    };
    setItemToEdit(editData);
  };

  const handleViewBatchClick = async (batch: PurchaseBatch) => {
    setIsFetchingBatch(true);
    try {
      const fullBatch = await fetchPurchaseBatchById(batch.id);
      setItemToViewBatch(fullBatch);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : 'Error al cargar el lote.'
      );
    } finally {
      setIsFetchingBatch(false);
    }
  };

  const handleAceptarConfirm = async () => {
    if (!itemToAceptar) return;
    setIsAceptando(true);
    try {
      await aceptarPedido(itemToAceptar.id);
      toast.success('El pedido ha sido aceptado y ahora está en proceso.');
      await loadData();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : 'Error al aceptar el pedido.'
      );
    } finally {
      setIsAceptando(false);
      setItemToAceptar(null);
    }
  };

  const handleCancelarSubmit = async (formData: Record<string, unknown>) => {
    if (!itemToCancelar) return;
    setIsCancelando(true);
    try {
      const motivo =
        (formData.motivoCancelacion as string) || 'Cancelado por el usuario';
      await cancelPedido(itemToCancelar.id, { motivoCancelacion: motivo });
      toast.success('El pedido ha sido cancelado.');
      await loadData();
      setItemToCancelar(null);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : 'Error al cancelar el pedido.'
      );
    } finally {
      setIsCancelando(false);
    }
  };

  const columns: Column<Pedido>[] = [
    {
      id: 'fechaPedido',
      label: 'Fecha Pedido',
      render: (row) =>
        row.fechaPedido ? new Date(row.fechaPedido).toLocaleDateString() : '—',
    },
    {
      id: 'fechaEntrega',
      label: 'Fecha Entrega',
      render: (row) =>
        row.fechaEntrega
          ? new Date(row.fechaEntrega).toLocaleDateString()
          : '—',
      hideOnMobile: true,
    },
    {
      id: 'proveedor',
      label: 'Proveedor',
      render: (row) => row.proveedor?.nombre ?? '—',
    },
    {
      id: 'costeTotal',
      label: 'Coste Total',
      align: 'right',
      render: (row) =>
        `${Number(row.costeTotal).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
    },
    {
      id: 'estado',
      label: 'Estado',
      render: (row) => <StatusChip status={row.estado} />,
    },
    {
      id: 'usuario',
      label: 'Creado Por',
      render: (row) => row.usuario?.nombre || row.usuario?.username || '—',
      hideOnMobile: true,
    },
  ];

  const batchColumns: Column<PurchaseBatch>[] = [
    {
      id: 'createdAt',
      label: 'Fecha Creación',
      render: (row) => new Date(row.createdAt).toLocaleString(),
    },
    {
      id: 'pedidos',
      label: 'Nº Pedidos',
      render: (row) => row.pedidos?.length || 0,
    },
    {
      id: 'proveedores',
      label: 'Proveedores',
      render: (row) =>
        (
          row.pedidos?.map((p) => p.proveedor?.nombre).filter(Boolean) || []
        ).join(', '),
    },
    {
      id: 'costeTotal',
      label: 'Coste Total Estimado',
      align: 'right',
      render: (row) => {
        const total =
          row.pedidos?.reduce((sum, p) => sum + Number(p.costeTotal || 0), 0) ||
          0;
        return `${total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
      },
    },
    {
      id: 'estado',
      label: 'Estado Lote',
      render: (row) => <StatusChip status={String(row.estado)} />,
    },
    {
      id: 'usuario',
      label: 'Creado Por',
      render: (row) => row.usuario?.nombre || row.usuario?.username || '—',
    },
  ];

  const renderActions = (row: Pedido) => (
    <Stack direction="row" spacing={1} justifyContent="center">
      {row.estado !== EstadoPedido.PENDIENTE && (
        <IconButton
          color="primary"
          onClick={(e) => {
            e.currentTarget.blur();
            handleEditClick(row);
          }}
          size="small"
          aria-label="Ver Detalles"
          title="Ver Detalles del Pedido"
        >
          <VisibilityIcon fontSize="small" />
        </IconButton>
      )}
      {canEdit && row.estado === EstadoPedido.PENDIENTE && (
        <IconButton
          color="success"
          onClick={(e) => {
            e.currentTarget.blur();
            setItemToAceptar(row);
          }}
          size="small"
          aria-label="Aprobar"
          title="Aprobar Pedido"
        >
          <CheckIcon fontSize="small" />
        </IconButton>
      )}
      {canEdit && row.estado === EstadoPedido.PENDIENTE && (
        <IconButton
          color="warning"
          onClick={(e) => {
            e.currentTarget.blur();
            setItemToCancelar(row);
          }}
          size="small"
          aria-label="Cancelar"
          title="Cancelar Pedido"
        >
          <CancelIcon fontSize="small" />
        </IconButton>
      )}
      {canDelete &&
        (row.estado === EstadoPedido.PENDIENTE ||
          row.estado === EstadoPedido.CANCELADO) && (
          <IconButton
            color="error"
            onClick={(e) => {
              e.currentTarget.blur();
              setItemToDelete(row);
            }}
            size="small"
            aria-label="Borrar"
            title="Eliminar de la base de datos"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      {canEdit && row.estado === EstadoPedido.PENDIENTE && (
        <IconButton
          color="secondary"
          onClick={(e) => {
            e.currentTarget.blur();
            handleEditClick(row);
          }}
          size="small"
          aria-label="Editar"
          title="Editar Pedido"
        >
          <EditIcon fontSize="small" />
        </IconButton>
      )}
    </Stack>
  );

  return (
    <Box>
      <PageToolbar
        title="Gestión de Pedidos"
        searchValue={searchTerm}
        onSearchChange={(v) => {
          setSearchTerm(v);
          setPage(1);
        }}
        searchPlaceholder="Buscar por proveedor, estado, usuario..."
        searchId="search-pedidos"
        totalItems={totalItems}
        totalItemsLabel="pedidos"
        primaryAction={
          canCreate
            ? {
                label: 'Nuevo Pedido',
                onClick: () => {
                  if (draft) {
                    setIsRecoveryOpen(true);
                  } else {
                    setItemToEdit({});
                    hasPromptedRef.current = true;
                  }
                },
                id: 'btn-nuevo-pedido',
                isLoading: isLoadingDraft,
              }
            : undefined
        }
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Tabs
          value={tabIndex}
          onChange={(_, newValue) => {
            setTabIndex(newValue);
            setPage(1);
          }}
          indicatorColor="primary"
          textColor="primary"
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Pedidos Pendientes" />
          <Tab label="Historial (En Proceso / Finalizados)" />
          <Tab label="Lotes de Compra" />
        </Tabs>

        {tabIndex === 2 ? (
          <DataTable
            columns={batchColumns}
            data={batches}
            isLoading={isLoading}
            hideTopBar
            viewMode="list"
            emptyStateMessage="No hay lotes de compra registrados."
            renderActions={(row) => (
              <IconButton
                color="primary"
                size="small"
                onClick={(e) => {
                  e.currentTarget.blur();
                  handleViewBatchClick(row);
                }}
                disabled={isFetchingBatch}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            )}
          />
        ) : (
          <DataTable
            columns={columns}
            data={data}
            isLoading={isLoading}
            hideTopBar
            viewMode={viewMode}
            defaultViewMode={viewMode}
            emptyStateMessage={
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <LocalShippingOutlinedIcon
                  sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No se encontraron pedidos
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Empieza registrando un nuevo pedido al catálogo de
                  proveedores.
                </Typography>
                {canCreate && (
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setItemToEdit({})}
                  >
                    Registrar Pedido
                  </Button>
                )}
              </Box>
            }
            pagination={{
              currentPage: page,
              totalPages: totalPages,
              onPageChange: (_, newPage) => setPage(newPage),
              pageSize: pageSize,
              pageSizeOptions: [5, 10, 25, 50],
              onPageSizeChange: (e: SelectChangeEvent<number>) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              },
            }}
            renderActions={renderActions}
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
                  ? new Date(itemToDelete.fechaPedido).toLocaleDateString()
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

        <DynamicFormModal
          isOpen={!!itemToViewBatch}
          onClose={() => setItemToViewBatch(null)}
          title={`Lote de Compra: ${itemToViewBatch?.id.split('-')[0]}...`}
          size="lg"
          fields={[
            {
              name: 'batch',
              label: '',
              type: 'batchViewer',
              position: 'bottom',
            },
          ]}
          initialData={{ batch: itemToViewBatch }}
          onSubmit={() => setItemToViewBatch(null)}
          submitLabel="Cerrar"
          cancelLabel=""
        />

        <ConfirmDialog
          isOpen={isRecoveryOpen}
          onClose={() => setIsRecoveryOpen(false)}
          onConfirm={() => {
            if (draft) {
              setItemToEdit(draft.payload);
            }
            setIsRecoveryOpen(false);
          }}
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
          onCancel={() => {
            void discardDraft();
            setIsRecoveryOpen(false);
          }}
        />
      </Paper>
    </Box>
  );
};

export default Pedidos;
