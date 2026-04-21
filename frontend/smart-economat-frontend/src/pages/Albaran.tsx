import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const toast = useToast();

  const ALBARAN_FORM_FIELDS: DynamicField[] = [
    {
      name: 'nAlbaran',
      label: t('albaranes.form.nAlbaran'),
      required: true,
      width: 6,
    },
    {
      name: 'concordancia',
      label: t('albaranes.form.concordancia'),
      type: 'select',
      options: [
        { value: '', label: t('albaranes.concordancia.sinDefinir') },
        { value: 'true', label: t('albaranes.concordancia.conforme') },
        { value: 'false', label: t('albaranes.concordancia.noConforme') },
      ],
      width: 6,
    },
    { name: 'fecha', label: t('albaranes.form.fecha'), type: 'date', width: 6 },
  ];

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
        err instanceof Error ? err.message : t('albaranes.toast.loadError');
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
        err instanceof Error ? err.message : t('albaranes.toast.detailError');
      toast.error(`${message}${t('albaranes.toast.detailErrorSuffix')}`);
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
        toast.success(t('albaranes.toast.updated'));
      } else {
        const dto: CreateAlbaranDto = {
          nAlbaran: formData.nAlbaran as string,
          concordancia,
          fecha: fechaStr ? new Date(fechaStr).toISOString() : undefined,
        };
        await createAlbaran(dto);
        toast.success(t('albaranes.toast.created'));
      }

      setIsFormOpen(false);
      setItemToEdit(null);
      loadData();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('albaranes.toast.saveError');
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
      toast.success(t('albaranes.toast.deleted'));
      setItemToDelete(null);
      loadData();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('albaranes.toast.deleteError');
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
      toast.success(t('albaranes.toast.uploadSuccess'));
      setItemToUpload(null);
      loadData();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('albaranes.toast.uploadError');
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
          nombre: producto?.nombre || t('albaranes.productoSinNombre'),
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
        label: t('albaranes.columns.nAlbaran'),
        render: (row) => (
          <Typography variant="body2" fontWeight={600}>
            {row.nAlbaran}
          </Typography>
        ),
        sortable: true,
      },
      {
        id: 'fecha',
        label: t('albaranes.columns.fecha'),
        render: (row) =>
          row.fecha ? new Date(row.fecha).toLocaleDateString() : '—',
        sortable: true,
      },
      {
        id: 'concordancia',
        label: t('albaranes.columns.concordancia'),
        render: (row) => {
          if (row.concordancia === true)
            return (
              <StatusChip
                status="success"
                label={t('albaranes.concordancia.conforme')}
                icon={<CheckCircleOutlineIcon />}
              />
            );
          if (row.concordancia === false)
            return (
              <StatusChip
                status="error"
                label={t('albaranes.concordancia.noConforme')}
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
        label: t('albaranes.columns.documento'),
        render: (row) =>
          row.documentoUrl ? (
            <Tooltip
              title={row.documentoNombre || t('albaranes.document.view')}
            >
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
        label: t('albaranes.columns.recepciones'),
        render: (row) => (
          <Typography variant="body2" color="text.secondary">
            {row.albaranPedidoRecepcion?.length ?? 0}
          </Typography>
        ),
      },
    ],
    [t]
  );

  // ─── Acciones por fila ───────────────────────────────────────────────────

  const renderActions = (row: Albaran) => (
    <Stack
      direction="row"
      spacing={0.5}
      sx={{ minWidth: 160, justifyContent: 'flex-start' }}
    >
      <Box sx={{ width: 34, display: 'flex', justifyContent: 'center' }}>
        <Tooltip title={t('albaranes.actions.viewDetail')}>
          <IconButton
            color="primary"
            onClick={(e) => {
              e.currentTarget.blur();
              void handleOpenView(row);
            }}
            size="small"
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ width: 34, display: 'flex', justifyContent: 'center' }}>
        {!row.documentoUrl && canCreate && (
          <Tooltip title={t('albaranes.actions.upload')}>
            <IconButton
              color="info"
              onClick={() => setItemToUpload(row)}
              size="small"
            >
              <AttachFileIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Box sx={{ width: 34, display: 'flex', justifyContent: 'center' }}>
        {canEdit && (
          <Tooltip title={t('albaranes.actions.edit')}>
            <IconButton
              color="secondary"
              onClick={() => handleOpenEdit(row)}
              size="small"
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Box sx={{ width: 34, display: 'flex', justifyContent: 'center' }}>
        {canDelete && (
          <Tooltip title={t('albaranes.actions.delete')}>
            <IconButton
              color="error"
              onClick={() => setItemToDelete(row)}
              size="small"
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
        title: t('albaranes.detail.infoTitle'),
        fields: [
          { label: t('albaranes.detail.nAlbaran'), value: itemToView.nAlbaran },
          {
            label: t('albaranes.detail.fecha'),
            value: itemToView.fecha
              ? new Date(itemToView.fecha).toLocaleDateString()
              : '—',
          },
          {
            label: t('albaranes.detail.concordancia'),
            value:
              itemToView.concordancia === true
                ? t('albaranes.detail.conforme')
                : itemToView.concordancia === false
                  ? t('albaranes.detail.noConforme')
                  : '—',
          },
          {
            label: t('albaranes.detail.fechaRegistro'),
            value: new Date(itemToView.createdAt).toLocaleString(),
          },
        ],
      },
      ...(itemToView.documentoUrl
        ? [
            {
              title: t('albaranes.detail.documentoTitle'),
              fields: [
                {
                  label: t('albaranes.document.nombre'),
                  value: itemToView.documentoNombre || '—',
                },
                {
                  label: t('albaranes.document.tipo'),
                  value: itemToView.documentoMimeType || '—',
                },
                {
                  label: t('albaranes.document.tamano'),
                  value: formatFileSize(itemToView.documentoTamano),
                },
                {
                  label: t('albaranes.detail.viewDoc'),
                  value: (
                    <Link
                      href={itemToView.documentoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('albaranes.document.open')}
                    </Link>
                  ),
                },
              ],
            },
          ]
        : []),
      {
        title: t('albaranes.detail.recepcionesTitle', {
          count: itemToView.albaranPedidoRecepcion?.length ?? 0,
        }),
        fields: itemToView.albaranPedidoRecepcion?.length
          ? itemToView.albaranPedidoRecepcion.map((apr, idx) => ({
              label: t('albaranes.detail.recepcion', { num: idx + 1 }),
              value: apr.recepcionPedidoId,
            }))
          : [{ label: t('albaranes.detail.noRecepciones'), value: '—' }],
      },
      {
        title: t('albaranes.detail.productosTitle', {
          count: productosVinculados.length,
        }),
        fields: productosVinculados.length
          ? productosVinculados.map((linea, idx) => ({
              label: t('albaranes.detail.producto', { num: idx + 1 }),
              value: t('albaranes.detail.productDetail', {
                nombre: linea.nombre,
                cantidad: linea.cantidadRecibida,
                unidad: linea.unidad,
                proveedor: linea.proveedor,
                estado: linea.estadoProducto,
                recepcionId: linea.recepcionId,
              }),
              fullWidth: true,
            }))
          : [
              {
                label: t('albaranes.detail.noProductos'),
                value: t('albaranes.detail.noProductosDesc'),
                fullWidth: true,
              },
            ],
      },
    ];
  }, [itemToView, productosVinculados, t]);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <Box>
      <PageToolbar
        title={t('albaranes.pageTitle')}
        totalItems={totalItems}
        totalItemsLabel={t('albaranes.totalItemsLabel')}
        searchValue={searchTerm}
        onSearchChange={(v) => {
          setSearchTerm(v);
          setPage(1);
        }}
        searchPlaceholder={t('albaranes.searchPlaceholder')}
        primaryAction={
          canCreate
            ? {
                label: t('albaranes.newAlbaran'),
                onClick: handleOpenCreate,
                icon: <AddIcon />,
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
      />

      <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <DataTable
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
                {t('albaranes.empty.noAlbaranes')}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: 400, mx: 'auto' }}
              >
                {searchTerm
                  ? t('albaranes.empty.noMatch')
                  : t('albaranes.empty.noAlbaranesHint')}
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
        title={t('albaranes.detail.title')}
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
        editLabel={t('albaranes.detail.editLabel')}
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
              {t('albaranes.detail.uploadDoc')}
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
        title={
          itemToEdit
            ? t('albaranes.form.editTitle')
            : t('albaranes.form.createTitle')
        }
        fields={ALBARAN_FORM_FIELDS}
        initialData={formInitialData}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setIsFormOpen(false);
          setItemToEdit(null);
        }}
        isSubmitting={isSubmitting}
        submitLabel={
          itemToEdit
            ? t('albaranes.form.saveChanges')
            : t('albaranes.form.create')
        }
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
        title={t('albaranes.deleteDialog.title')}
        message={t('albaranes.deleteDialog.message', {
          nAlbaran: itemToDelete?.nAlbaran,
        })}
        confirmText={t('albaranes.deleteDialog.confirm')}
        isLoading={isDeleting}
      />
    </Box>
  );
};

export default AlbaranPage;
