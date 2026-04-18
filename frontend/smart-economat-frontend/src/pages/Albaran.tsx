import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  IconButton,
  Tooltip,
  Stack,
  Link,
  Button,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import AddIcon from '@mui/icons-material/Add';
import DataTable, { Column } from '../components/ui/DataTable';
import PageToolbar from '../components/ui/PageToolbar';
import DetailModal from '../components/ui/DetailModal';
import DynamicFormModal, {
  DynamicField,
} from '../components/ui/DynamicFormModal';
import StatusChip from '../components/ui/StatusChip';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import {
  Albaran,
  AlbaranRecepcion,
  AlbaranQueryParams,
  CreateAlbaranDto,
  UpdateAlbaranDto,
} from '../services/albaran.types';
import {
  fetchAlbaranes,
  fetchAlbaranById,
  createAlbaran,
  updateAlbaran,
  removeAlbaran,
  uploadDocumentoAlbaran,
} from '../services/albaran.service';
import { useToast } from '../store/toast.hooks';
import { usePermission } from '../store/auth.hooks';
import { PERMISSIONS } from '../sherlock-auth/permissions.constants';
import AlbaranFilters, {
  AlbaranFiltersState,
} from '../features/albaranes/AlbaranFilters';
import UploadDocumentoModal from '../features/albaranes/UploadDocumentoModal';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ─── Esquema del formulario ──────────────────────────────────────────────────

const ALBARAN_FORM_FIELDS: DynamicField[] = [
  {
    name: 'nAlbaran',
    label: 'Número de Albarán',
    required: true,
    width: 6,
  },
  {
    name: 'concordancia',
    label: 'Concordancia',
    type: 'select',
    options: [
      { value: '', label: '— Sin definir —' },
      { value: 'true', label: 'Conforme' },
      { value: 'false', label: 'No conforme' },
    ],
    width: 6,
  },
  {
    name: 'fecha',
    label: 'Fecha del Albarán',
    type: 'date',
    width: 6,
  },
];

interface ProductoAlbaranDetalle {
  key: string;
  nombre: string;
  unidad: string;
  proveedor: string;
  cantidadRecibida: string;
  estadoProducto: string;
  recepcionId: string;
}

// ─── Componente principal ────────────────────────────────────────────────────

const AlbaranPage: React.FC = () => {
  const toast = useToast();

  // Paginación y datos
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [data, setData] = useState<Albaran[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<AlbaranFiltersState>({
    concordancia: null,
    startDate: null,
    endDate: null,
  });

  // Modales
  const [itemToView, setItemToView] = useState<Albaran | null>(null);
  const [itemToEdit, setItemToEdit] = useState<Albaran | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Albaran | null>(null);
  const [itemToUpload, setItemToUpload] = useState<Albaran | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Estados de carga de operaciones
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Permisos
  const canView = usePermission(PERMISSIONS.albaranes.ver);
  const canCreate = usePermission(PERMISSIONS.albaranes.crear);
  const canEdit = usePermission(PERMISSIONS.albaranes.editar);
  const canDelete = usePermission(PERMISSIONS.albaranes.eliminar);

  // ─── Carga de datos ──────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: AlbaranQueryParams = {
        page,
        limit: pageSize,
        searchTerm: searchTerm || undefined,
      };
      const result = await fetchAlbaranes(params);
      setData(result.data);
      setTotalItems(result.total);
      setTotalPages(result.totalPages);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al cargar albaranes';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, searchTerm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Filtrado local (concordancia y fechas) ──────────────────────────────
  // El backend no implementa estos filtros, se aplican sobre la página actual.

  const filteredData = useMemo(() => {
    let result = data;

    if (filters.concordancia !== null) {
      result = result.filter((a) => a.concordancia === filters.concordancia);
    }

    if (filters.startDate) {
      const from = new Date(filters.startDate);
      result = result.filter((a) => a.fecha && new Date(a.fecha) >= from);
    }

    if (filters.endDate) {
      const to = new Date(filters.endDate);
      to.setHours(23, 59, 59, 999);
      result = result.filter((a) => a.fecha && new Date(a.fecha) <= to);
    }

    return result;
  }, [data, filters]);

  // ─── Handlers de CRUD ───────────────────────────────────────────────────

  const handleOpenCreate = () => {
    setItemToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (albaran: Albaran) => {
    setItemToEdit(albaran);
    setIsFormOpen(true);
  };

  const handleOpenView = async (albaran: Albaran) => {
    if (!canView) {
      setItemToView(albaran);
      return;
    }

    try {
      const detalle = await fetchAlbaranById(albaran.id);
      setItemToView(detalle);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'No se pudo cargar el detalle completo del albarán';
      toast.error(`${message}. Se mostrará la información disponible.`);
      setItemToView(albaran);
    }
  };

  const handleFormSubmit = async (formData: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      const concordanciaStr = formData.concordancia as string;
      const concordancia =
        concordanciaStr === 'true'
          ? true
          : concordanciaStr === 'false'
            ? false
            : undefined;

      const fechaStr = formData.fecha as string | undefined;

      if (itemToEdit) {
        const dto: UpdateAlbaranDto = {
          nAlbaran: formData.nAlbaran as string,
          concordancia,
          fecha: fechaStr ? new Date(fechaStr).toISOString() : undefined,
        };
        await updateAlbaran(itemToEdit.id, dto);
        toast.success('Albarán actualizado correctamente');
      } else {
        const dto: CreateAlbaranDto = {
          nAlbaran: formData.nAlbaran as string,
          concordancia,
          fecha: fechaStr ? new Date(fechaStr).toISOString() : undefined,
        };
        await createAlbaran(dto);
        toast.success('Albarán creado correctamente');
      }

      setIsFormOpen(false);
      setItemToEdit(null);
      loadData();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al guardar el albarán';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await removeAlbaran(itemToDelete.id);
      toast.success('Albarán eliminado correctamente');
      setItemToDelete(null);
      loadData();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al eliminar el albarán';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUploadDocumento = async (
    file: File,
    numeroReferencia: string,
    recepcionId?: string,
    observaciones?: string
  ) => {
    setIsUploading(true);
    try {
      await uploadDocumentoAlbaran(
        file,
        numeroReferencia,
        recepcionId,
        observaciones
      );
      toast.success('Documento subido correctamente');
      setItemToUpload(null);
      loadData();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al subir el documento';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  // ─── Datos iniciales del formulario de edición ───────────────────────────

  const formInitialData = useMemo(() => {
    if (!itemToEdit) return {};
    return {
      nAlbaran: itemToEdit.nAlbaran,
      concordancia:
        itemToEdit.concordancia === true
          ? 'true'
          : itemToEdit.concordancia === false
            ? 'false'
            : '',
      fecha: itemToEdit.fecha ? itemToEdit.fecha.split('T')[0] : '',
    };
  }, [itemToEdit]);

  const productosVinculados = useMemo<ProductoAlbaranDetalle[]>(() => {
    if (!itemToView?.albaranPedidoRecepcion?.length) {
      return [];
    }

    const recepcionesPorId = new Map<string, AlbaranRecepcion>();

    for (const apr of itemToView.albaranPedidoRecepcion) {
      const recepcion = apr.recepcionPedido?.recepcion;
      if (recepcion?.id && !recepcionesPorId.has(recepcion.id)) {
        recepcionesPorId.set(recepcion.id, recepcion);
      }
    }

    const lineas: ProductoAlbaranDetalle[] = [];

    recepcionesPorId.forEach((recepcion) => {
      for (const recepcionProducto of recepcion.recepcionProductos ?? []) {
        const producto =
          recepcionProducto.pedidoProducto?.productoProveedor?.producto;
        const proveedor =
          recepcionProducto.pedidoProducto?.productoProveedor?.proveedor;

        lineas.push({
          key: recepcionProducto.id,
          nombre: producto?.nombre || 'Producto sin nombre',
          unidad: producto?.unidad || '—',
          proveedor: proveedor?.nombre || '—',
          cantidadRecibida:
            recepcionProducto.cantidadRecibida != null
              ? String(recepcionProducto.cantidadRecibida)
              : '—',
          estadoProducto: recepcionProducto.estadoProducto || '—',
          recepcionId: recepcion.id,
        });
      }
    });

    return lineas;
  }, [itemToView]);

  // ─── Columnas de la tabla ────────────────────────────────────────────────

  const columns: Column<Albaran>[] = useMemo(
    () => [
      {
        id: 'nAlbaran',
        label: 'Nº Albarán',
        render: (row) => (
          <Typography variant="body2" fontWeight={600}>
            {row.nAlbaran}
          </Typography>
        ),
        sortable: true,
      },
      {
        id: 'fecha',
        label: 'Fecha',
        render: (row) =>
          row.fecha ? new Date(row.fecha).toLocaleDateString('es-ES') : '—',
        sortable: true,
      },
      {
        id: 'concordancia',
        label: 'Concordancia',
        render: (row) => {
          if (row.concordancia === true)
            return (
              <StatusChip
                status="success"
                label="Conforme"
                icon={<CheckCircleOutlineIcon />}
              />
            );
          if (row.concordancia === false)
            return (
              <StatusChip
                status="error"
                label="No conforme"
                icon={<CancelOutlinedIcon />}
              />
            );
          return (
            <Typography variant="body2" color="text.disabled">
              —
            </Typography>
          );
        },
      },
      {
        id: 'documentoUrl',
        label: 'Documento',
        render: (row) =>
          row.documentoUrl ? (
            <Tooltip title={row.documentoNombre || 'Ver documento'}>
              <AttachFileIcon
                fontSize="small"
                color="primary"
                sx={{ verticalAlign: 'middle' }}
              />
            </Tooltip>
          ) : (
            <Typography variant="body2" color="text.disabled">
              —
            </Typography>
          ),
      },
      {
        id: 'albaranPedidoRecepcion',
        label: 'Recepciones',
        render: (row) => (
          <Typography variant="body2" color="text.secondary">
            {row.albaranPedidoRecepcion?.length ?? 0}
          </Typography>
        ),
      },
    ],
    []
  );

  // ─── Acciones por fila ───────────────────────────────────────────────────

  const renderActions = (row: Albaran) => (
    <Stack
      direction="row"
      spacing={0.5}
      sx={{ minWidth: 160, justifyContent: 'flex-start' }}
    >
      <Box sx={{ width: 34, display: 'flex', justifyContent: 'center' }}>
        <Tooltip title="Ver detalle">
          <IconButton
            color="primary"
            onClick={(e) => {
              e.currentTarget.blur();
              void handleOpenView(row);
            }}
            size="small"
            id="btn-albaran-view"
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ width: 34, display: 'flex', justifyContent: 'center' }}>
        {!row.documentoUrl && canCreate && (
          <Tooltip title="Subir documento">
            <IconButton
              color="info"
              onClick={() => setItemToUpload(row)}
              size="small"
              id="btn-albaran-upload"
            >
              <AttachFileIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Box sx={{ width: 34, display: 'flex', justifyContent: 'center' }}>
        {canEdit && (
          <Tooltip title="Editar">
            <IconButton
              color="secondary"
              onClick={() => handleOpenEdit(row)}
              size="small"
              id="btn-albaran-edit"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Box sx={{ width: 34, display: 'flex', justifyContent: 'center' }}>
        {canDelete && (
          <Tooltip title="Eliminar">
            <IconButton
              color="error"
              onClick={() => setItemToDelete(row)}
              size="small"
              id="btn-albaran-delete"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Stack>
  );

  // ─── Secciones del modal de detalle ─────────────────────────────────────

  const detailSections = useMemo(() => {
    if (!itemToView) return [];

    return [
      {
        title: 'Información del Albarán',
        fields: [
          { label: 'Nº Albarán', value: itemToView.nAlbaran },
          {
            label: 'Fecha',
            value: itemToView.fecha
              ? new Date(itemToView.fecha).toLocaleDateString('es-ES')
              : '—',
          },
          {
            label: 'Concordancia',
            value:
              itemToView.concordancia === true
                ? 'Conforme'
                : itemToView.concordancia === false
                  ? 'No conforme'
                  : '—',
          },
          {
            label: 'Fecha de Registro',
            value: new Date(itemToView.createdAt).toLocaleString('es-ES'),
          },
        ],
      },
      ...(itemToView.documentoUrl
        ? [
            {
              title: 'Documento Adjunto',
              fields: [
                {
                  label: 'Nombre',
                  value: itemToView.documentoNombre || '—',
                },
                {
                  label: 'Tipo',
                  value: itemToView.documentoMimeType || '—',
                },
                {
                  label: 'Tamaño',
                  value: formatFileSize(itemToView.documentoTamano),
                },
                {
                  label: 'Ver documento',
                  value: (
                    <Link
                      href={itemToView.documentoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Abrir archivo
                    </Link>
                  ),
                },
              ],
            },
          ]
        : []),
      {
        title: `Recepciones Vinculadas (${itemToView.albaranPedidoRecepcion?.length ?? 0})`,
        fields: itemToView.albaranPedidoRecepcion?.length
          ? itemToView.albaranPedidoRecepcion.map((apr, idx) => ({
              label: `Recepción ${idx + 1}`,
              value: apr.recepcionPedidoId,
            }))
          : [{ label: 'Sin recepciones vinculadas', value: '—' }],
      },
      {
        title: `Productos Vinculados (${productosVinculados.length})`,
        fields: productosVinculados.length
          ? productosVinculados.map((linea, idx) => ({
              label: `Producto ${idx + 1}`,
              value: `${linea.nombre} · Cantidad recibida: ${linea.cantidadRecibida} ${linea.unidad} · Proveedor: ${linea.proveedor} · Estado: ${linea.estadoProducto} · Recepción: ${linea.recepcionId}`,
              fullWidth: true,
            }))
          : [
              {
                label: 'Sin productos vinculados',
                value:
                  'No hay líneas de producto asociadas a las recepciones de este albarán.',
                fullWidth: true,
              },
            ],
      },
    ];
  }, [itemToView, productosVinculados]);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <Box>
      <PageToolbar
        title="Albaranes"
        totalItems={totalItems}
        totalItemsLabel="albaranes"
        searchValue={searchTerm}
        onSearchChange={(v) => {
          setSearchTerm(v);
          setPage(1);
        }}
        searchPlaceholder="Buscar por número de albarán..."
        primaryAction={
          canCreate
            ? {
                label: 'Nuevo Albarán',
                onClick: handleOpenCreate,
                icon: <AddIcon />,
                id: 'btn-nuevo-albaran',
              }
            : undefined
        }
        filters={
          <AlbaranFilters
            filters={filters}
            onChange={(newFilters) => {
              setFilters(newFilters);
              setPage(1);
            }}
          />
        }
        id="albaranes-toolbar"
      />

      <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <DataTable
          id="albaranes-table"
          columns={columns}
          data={filteredData}
          isLoading={isLoading}
          renderActions={renderActions}
          emptyStateMessage={
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <AssignmentOutlinedIcon
                sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No hay albaranes registrados
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: 400, mx: 'auto' }}
              >
                {searchTerm
                  ? 'No se encontraron albaranes que coincidan con tu búsqueda.'
                  : 'Aún no hay albaranes en el sistema. Crea el primero con el botón "Nuevo Albarán".'}
              </Typography>
            </Box>
          }
          pagination={{
            currentPage: page,
            totalPages: totalPages,
            onPageChange: (_, p) => setPage(p),
            pageSize: pageSize,
            onPageSizeChange: (e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            },
          }}
        />
      </Paper>

      {/* Modal de detalle */}
      <DetailModal
        isOpen={!!itemToView}
        onClose={() => setItemToView(null)}
        title="Detalle del Albarán"
        subtitle={itemToView?.nAlbaran}
        sections={detailSections}
        size="md"
        onEdit={
          canEdit
            ? () => {
                if (itemToView) {
                  handleOpenEdit(itemToView);
                  setItemToView(null);
                }
              }
            : undefined
        }
        editLabel="Editar Albarán"
        actions={
          !itemToView?.documentoUrl && canCreate ? (
            <Button
              variant="outlined"
              color="info"
              startIcon={<AttachFileIcon />}
              onClick={() => {
                if (itemToView) {
                  setItemToUpload(itemToView);
                  setItemToView(null);
                }
              }}
            >
              Subir Documento
            </Button>
          ) : undefined
        }
      />

      {/* Modal de creación / edición */}
      <DynamicFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setItemToEdit(null);
        }}
        title={itemToEdit ? 'Editar Albarán' : 'Nuevo Albarán'}
        fields={ALBARAN_FORM_FIELDS}
        initialData={formInitialData}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setIsFormOpen(false);
          setItemToEdit(null);
        }}
        isSubmitting={isSubmitting}
        submitLabel={itemToEdit ? 'Guardar Cambios' : 'Crear Albarán'}
        size="sm"
      />

      {/* Modal de subida de documento */}
      <UploadDocumentoModal
        isOpen={!!itemToUpload}
        onClose={() => setItemToUpload(null)}
        onUpload={handleUploadDocumento}
        isLoading={isUploading}
        defaultNumeroReferencia={itemToUpload?.nAlbaran ?? ''}
      />

      {/* Diálogo de confirmación de borrado */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => !isDeleting && setItemToDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar Albarán"
        message={`¿Estás seguro de que deseas eliminar el albarán "${itemToDelete?.nAlbaran}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        isLoading={isDeleting}
      />
    </Box>
  );
};

export default AlbaranPage;
