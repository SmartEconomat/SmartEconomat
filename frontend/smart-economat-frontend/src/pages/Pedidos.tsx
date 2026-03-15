import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  Alert,
  Button,
  SelectChangeEvent,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DataTable, { Column } from '../components/ui/DataTable';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import DynamicFormModal, {
  DynamicField,
} from '../components/ui/DynamicFormModal';
import { Pedido, EstadoPedido } from '../services/pedido.types';
import {
  fetchPedidos,
  createPedido,
  updatePedido,
  PedidoRequestPayload,
} from '../services/pedido.service';
import { deleteResource } from '../services/api.service';
import { fetchProveedores } from '../services/proveedor.service';
import { useToast } from '../store/toast.hooks';
import StatusChip from '../components/ui/StatusChip';
import PageToolbar from '../components/ui/PageToolbar';

import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import AddIcon from '@mui/icons-material/Add';

const pedidoSchema: DynamicField[] = [
  {
    name: 'estado',
    label: 'Estado del Pedido',
    type: 'select',
    required: false,
    width: 6,
    options: [
      { value: EstadoPedido.PENDIENTE, label: 'Pendiente' },
      { value: EstadoPedido.EN_PROCESO, label: 'En Proceso' },
      { value: EstadoPedido.RECIBIDO, label: 'Recibido' },
      { value: EstadoPedido.PARCIAL, label: 'Parcial' },
      { value: EstadoPedido.INCIDENCIA, label: 'Incidencia' },
      { value: EstadoPedido.CANCELADO, label: 'Cancelado' },
    ],
  },
  {
    name: 'fechaEntrega',
    label: 'Fecha de Entrega',
    type: 'date',
    width: 6,
    required: true,
  },
  {
    name: 'proveedorId',
    label: 'Proveedor',
    type: 'select',
    required: true,
    width: 6,
    options: [],
  },
  {
    name: 'motivoCancelacion',
    label: 'Motivo de Cancelación (Si aplica)',
    type: 'text',
    width: 12,
  },
  {
    name: 'pedidoProductos',
    label: 'Detalle de Productos',
    type: 'orderLines',
    position: 'bottom',
  },
];

const Pedidos: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState<Pedido[]>([]);
  const [proveedores, setProveedores] = useState<
    { id: string; nombre: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Pedido | null>(null);
  const [itemToEdit, setItemToEdit] = useState<Record<string, unknown> | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [dataLoad, provLoad] = await Promise.all([
        fetchPedidos(page, pageSize, searchTerm),
        fetchProveedores(1, 50).catch(() => ({ data: [] })),
      ]);
      setData(dataLoad.data);
      setTotalItems(dataLoad.total);
      setTotalPages(dataLoad.totalPages);
      setProveedores(provLoad.data);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error desconocido al cargar pedidos.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, searchTerm]);

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

  const handleSave = async (formData: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      const proveedorId = String(formData.proveedorId ?? '');
      if (!proveedorId) {
        toast.error('Selecciona un proveedor válido antes de continuar.');
        setIsSaving(false);
        return;
      }
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(proveedorId)) {
        toast.error('El ID del proveedor debe ser un UUID válido.');
        setIsSaving(false);
        return;
      }
      if (!formData.fechaEntrega) {
        toast.error('La fecha de entrega es obligatoria.');
        setIsSaving(false);
        return;
      }
      const lines =
        (formData.pedidoProductos as
          | Array<{
              productoProveedorId?: string;
              id_producto_proveedor?: string;
              cantidad: number;
            }>
          | undefined) || [];
      if (!Array.isArray(lines) || lines.length === 0) {
        toast.error('El pedido debe contener al menos una línea válida.');
        setIsSaving(false);
        return;
      }

      const normalizedLines = lines
        .map((l) => ({
          productoProveedorId: String(
            l.productoProveedorId || l.id_producto_proveedor || ''
          ),
          cantidad: Number(l.cantidad),
        }))
        .filter(
          (l) =>
            !!l.productoProveedorId &&
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

      const calculatedTotal = lines.reduce(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (sum: number, line: any) =>
          sum + Number(line.cantidad || 0) * Number(line.precioUnitario || 0),
        0
      );

      const payload: PedidoRequestPayload = {
        costeTotal: calculatedTotal,
        estado: String(formData.estado ?? ''),
        proveedorId: proveedorId,
        fechaEntrega: String(formData.fechaEntrega ?? ''),
        ...(formData.motivoCancelacion
          ? { motivoCancelacion: String(formData.motivoCancelacion) }
          : {}),
        lineas: normalizedLines as {
          productoProveedorId: string;
          cantidad: number;
        }[],
      };

      if (formData.id) {
        await updatePedido(String(formData.id), payload);
        toast.success('Pedido actualizado correctamente.');
      } else {
        await createPedido(payload);
        toast.success('Pedido creado correctamente.');
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
      render: (row) => row.usuario?.nombre ?? '—',
      hideOnMobile: true,
    },
  ];

  const renderActions = (row: Pedido) => (
    <>
      <IconButton
        color="secondary"
        onClick={() => handleEditClick(row)}
        size="small"
        aria-label="Editar"
      >
        <EditIcon fontSize="small" />
      </IconButton>
      <IconButton
        color="error"
        onClick={() => setItemToDelete(row)}
        size="small"
        aria-label="Borrar"
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </>
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
        primaryAction={{
          label: 'Nuevo Pedido',
          onClick: () => setItemToEdit({}),
          id: 'btn-nuevo-pedido',
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

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
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Empieza registrando un nuevo pedido al catálogo de proveedores.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setItemToEdit({})}
              >
                Registrar Pedido
              </Button>
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

        <DynamicFormModal
          isOpen={!!itemToEdit}
          onClose={() => setItemToEdit(null)}
          title={itemToEdit?.id ? `Editar Pedido` : 'Crear Nuevo Pedido'}
          size="lg"
          fields={pedidoSchema.map((field) => {
            if (field.name === 'proveedorId') {
              return {
                ...field,
                disabled: !!itemToEdit?.id,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                options: (proveedores as any[]).map((p) => ({
                  value: p.id,
                  label: p.nombre,
                })),
              };
            }
            return field;
          })}
          initialData={itemToEdit || {}}
          onSubmit={handleSave}
          isSubmitting={isSaving}
          requireConfirmation={true}
          confirmationMessage={
            itemToEdit?.id
              ? '¿Estás seguro de que deseas guardar los cambios en este pedido?'
              : '¿Estás seguro de que deseas registrar este nuevo pedido?'
          }
        />
      </Paper>
    </Box>
  );
};

export default Pedidos;
