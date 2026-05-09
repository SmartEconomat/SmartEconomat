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
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
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
import {
  formatLocalizedDate,
  formatLocalizedDateTime,
} from '../utils/intlFormat';
import { useDataTable } from '../hooks/useDataTable';

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Formatea file size para su presentación.
 *
 * @param bytes Parámetro de entrada para la operación. Opcional.
 * @returns Valor resultante de la operación.
 */
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

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
const AlbaranPage: React.FC = () => {
  const { t } = useTranslation();
  const toast = useToast();

  // ─── Esquema del formulario ────────────────────────────────────────────────

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  const ALBARAN_FORM_FIELDS: DynamicField[] = [
    {
      name: 'nAlbaran',
      label: t('albaran.form.nAlbaran'),
      required: true,
      width: 6,
    },
    {
      name: 'concordancia',
      label: t('albaran.form.concordancia'),
      type: 'select',
      options: [
        { value: '', label: t('albaran.form.concordanciaVacio') },
        { value: 'true', label: t('albaran.form.conforme') },
        { value: 'false', label: t('albaran.form.noConforme') },
      ],
      width: 6,
    },
    {
      name: 'fecha',
      label: t('albaran.form.fecha'),
      type: 'date',
      width: 6,
    },
  ];

  const {
    searchTerm,
    filters: tableFilters,
    onPageChange,
    onSort,
    onFilter,
    onSearchChange,
    queryParams,
    sortConfig,
    paginationProps,
    totalItems,
    syncPaginationFromResponse,
  } = useDataTable({
    sortBy: 'fecha',
    order: 'desc',
  });

  // Paginación y datos
  const [data, setData] = useState<Albaran[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<AlbaranFiltersState>({
    concordancia: null,
    startDate: null,
    endDate: null,
  });

  const [itemToView, setItemToView] = useState<Albaran | null>(null);
  const [itemToEdit, setItemToEdit] = useState<Albaran | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Albaran | null>(null);
  const [itemToUpload, setItemToUpload] = useState<Albaran | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Permisos
  const canView = usePermission(PERMISSIONS.albaranes.ver);
  const canCreate = usePermission(PERMISSIONS.albaranes.crear);
  const canEdit = usePermission(PERMISSIONS.albaranes.editar);
  const canDelete = usePermission(PERMISSIONS.albaranes.eliminar);

  // ─── Carga de datos ──────────────────────────────────────────────────────

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: AlbaranQueryParams = {
        page: queryParams.page,
        limit: queryParams.limit,
        searchTerm: queryParams.searchTerm,
      };
      const result = await fetchAlbaranes(params);
      setData(result.data);
      syncPaginationFromResponse(result);
    } catch (err: unknown) {
      syncPaginationFromResponse({ total: 0, data: [] });
      const message =
        err instanceof Error ? err.message : t('albaran.errors.cargar');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [queryParams, syncPaginationFromResponse, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Filtrado local (concordancia y fechas) ──────────────────────────────
  // El backend no implementa estos filtros, se aplican sobre la página actual.

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
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

  /**
   * Gestiona open create y aplica la lógica correspondiente.
   */
  const handleOpenCreate = () => {
    setItemToEdit(null);
    setIsFormOpen(true);
  };

  /**
   * Gestiona open edit y aplica la lógica correspondiente.
   *
   * @param albaran Parámetro de entrada para la operación.
   */
  const handleOpenEdit = (albaran: Albaran) => {
    setItemToEdit(albaran);
    setIsFormOpen(true);
  };

  /**
   * Gestiona open view y aplica la lógica correspondiente.
   *
   * @param albaran Parámetro de entrada para la operación.
   */
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
        err instanceof Error ? err.message : t('albaran.errors.cargarDetalle');
      toast.error(t('albaran.errors.cargarDetalleConFallback', { message }));
      setItemToView(albaran);
    }
  };

  /**
   * Gestiona form submit y aplica la lógica correspondiente.
   *
   * @param formData Parámetro de entrada para la operación.
   */
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
        toast.success(t('albaran.toast.actualizado'));
      } else {
        const dto: CreateAlbaranDto = {
          nAlbaran: formData.nAlbaran as string,
          concordancia,
          fecha: fechaStr ? new Date(fechaStr).toISOString() : undefined,
        };
        await createAlbaran(dto);
        toast.success(t('albaran.toast.creado'));
      }

      setIsFormOpen(false);
      setItemToEdit(null);
      loadData();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('albaran.toast.errorGuardar');
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Gestiona delete y aplica la lógica correspondiente.
   */
  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await removeAlbaran(itemToDelete.id);
      toast.success(t('albaran.toast.eliminado'));
      setItemToDelete(null);
      loadData();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('albaran.toast.errorEliminar');
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
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
      toast.success(t('albaran.toast.documentoSubido'));
      setItemToUpload(null);
      loadData();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('albaran.toast.errorSubir');
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  // ─── Datos iniciales del formulario de edición ───────────────────────────

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
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
      const recepcion = apr.recepcion?.recepcion;
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

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  const columns: Column<Albaran>[] = useMemo(
    () => [
      {
        id: 'nAlbaran',
        label: t('albaran.columns.nAlbaran'),
        render: (row) => (
          <Typography variant="body2" fontWeight={600}>
            {row.nAlbaran}
          </Typography>
        ),
        sortable: true,
        sortType: 'string',
      },
      {
        id: 'fecha',
        label: t('albaran.columns.fecha'),
        render: (row) => (row.fecha ? formatLocalizedDate(row.fecha) : '—'),
        sortable: true,
        sortType: 'date',
      },
      {
        id: 'concordancia',
        label: t('albaran.columns.concordancia'),
        render: (row) => {
          if (row.concordancia === true)
            return (
              <StatusChip
                status="success"
                label={t('albaran.form.conforme')}
                icon={<CheckCircleOutlineIcon />}
              />
            );
          if (row.concordancia === false)
            return (
              <StatusChip
                status="error"
                label={t('albaran.form.noConforme')}
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
        label: t('albaran.columns.documento'),
        render: (row) =>
          row.documentoUrl ? (
            <Tooltip
              title={row.documentoNombre || t('albaran.detalle.verDocumento')}
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
        label: t('albaran.columns.recepciones'),
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

  /**
   * Ejecuta la lógica de render actions dentro del flujo de la aplicación.
   *
   * @param row Parámetro de entrada para la operación.
   */
  const renderActions = (row: Albaran) => (
    <Stack
      direction="row"
      spacing={0.5}
      sx={{ minWidth: 160, justifyContent: 'flex-start' }}
    >
      <Box sx={{ width: 34, display: 'flex', justifyContent: 'center' }}>
        {!row.documentoUrl && canCreate && (
          <Tooltip title={t('albaran.actions.subirDocumento')}>
            <IconButton
              color="info"
              onClick={(e) => {
                e.stopPropagation();
                setItemToUpload(row);
              }}
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
          <Tooltip title={t('albaran.actions.editar')}>
            <IconButton
              color="secondary"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEdit(row);
              }}
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
          <Tooltip title={t('albaran.actions.eliminar')}>
            <IconButton
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                setItemToDelete(row);
              }}
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

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  const detailSections = useMemo(() => {
    if (!itemToView) return [];

    return [
      {
        title: t('albaran.detalle.infoTitulo'),
        fields: [
          { label: t('albaran.detalle.nAlbaran'), value: itemToView.nAlbaran },
          {
            label: t('albaran.detalle.fecha'),
            value: itemToView.fecha
              ? formatLocalizedDate(itemToView.fecha)
              : '—',
          },
          {
            label: t('albaran.columns.concordancia'),
            value:
              itemToView.concordancia === true
                ? t('albaran.form.conforme')
                : itemToView.concordancia === false
                  ? t('albaran.form.noConforme')
                  : '—',
          },
          {
            label: t('albaran.detalle.fechaRegistro'),
            value: formatLocalizedDateTime(itemToView.createdAt),
          },
        ],
      },
      ...(itemToView.documentoUrl
        ? [
            {
              title: t('albaran.detalle.documentoAdjunto'),
              fields: [
                {
                  label: t('albaran.detalle.nombre'),
                  value: itemToView.documentoNombre || '—',
                },
                {
                  label: t('albaran.detalle.tipo'),
                  value: itemToView.documentoMimeType || '—',
                },
                {
                  label: t('albaran.detalle.tamano'),
                  value: formatFileSize(itemToView.documentoTamano),
                },
                {
                  label: t('albaran.detalle.verDocumento'),
                  value: (
                    <Link
                      href={itemToView.documentoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('albaran.detalle.abrirArchivo')}
                    </Link>
                  ),
                },
              ],
            },
          ]
        : []),
      {
        title: t('albaran.detalle.recepcionesVinculadas', {
          count: itemToView.albaranPedidoRecepcion?.length ?? 0,
        }),
        fields: itemToView.albaranPedidoRecepcion?.length
          ? itemToView.albaranPedidoRecepcion.map((apr, idx) => ({
              label: t('albaran.detalle.recepcionItem', { index: idx + 1 }),
              value: apr.recepcionPedidoId,
            }))
          : [{ label: t('albaran.detalle.sinRecepciones'), value: '—' }],
      },
      {
        title: t('albaran.detalle.productosVinculados', {
          count: productosVinculados.length,
        }),
        fields: productosVinculados.length
          ? productosVinculados.map((linea, idx) => ({
              label: t('albaran.detalle.productoItem', { index: idx + 1 }),
              value: t('albaran.detalle.productoResumen', {
                nombre: linea.nombre,
                cantidadRecibida: linea.cantidadRecibida,
                unidad: linea.unidad,
                proveedor: linea.proveedor,
                estado: linea.estadoProducto,
                recepcionId: linea.recepcionId,
              }),
              fullWidth: true,
            }))
          : [
              {
                label: t('albaran.detalle.sinProductosVinculados'),
                value: t('albaran.detalle.sinLineas'),
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
        title={t('albaran.titulo')}
        totalItems={totalItems}
        totalItemsLabel={t('albaran.totalItemsLabel')}
        searchValue={searchTerm}
        onSearchChange={onSearchChange}
        searchPlaceholder={t('albaran.buscar')}
        primaryAction={
          canCreate
            ? {
                label: t('albaran.nuevo'),
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
              onPageChange(null, 1);
            }}
          />
        }
        id="albaranes-toolbar"
      />

      <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
        {!isLoading && error && (
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
          onRowClick={handleOpenView}
          onSort={onSort}
          sortConfig={sortConfig}
          filters={tableFilters}
          onFilter={onFilter}
          pagination={paginationProps}
          getRowAriaLabel={(row: Albaran) =>
            t('albaran.actions.ariaVerDetalle', { id: row.id })
          }
          emptyStateMessage={
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <AssignmentOutlinedIcon
                sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t('albaran.empty.noAlbaranes')}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: 400, mx: 'auto' }}
              >
                {searchTerm
                  ? t('albaran.empty.noResultados')
                  : t('albaran.empty.primerAlbaran')}
              </Typography>
            </Box>
          }
        />
      </Paper>

      {/* Modal de detalle */}
      <DetailModal
        isOpen={!!itemToView}
        onClose={() => setItemToView(null)}
        title={t('albaran.modal.tituloDetalle')}
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
        editLabel={t('albaran.modal.tituloEditar')}
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
              {t('albaran.modal.tituloSubirDoc')}
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
          itemToEdit ? t('albaran.modal.tituloEditar') : t('albaran.nuevo')
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
            ? t('albaran.modal.guardarCambios')
            : t('albaran.modal.crearAlbaran')
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
        title={t('albaran.confirm.titulo')}
        message={t('albaran.confirm.mensaje', {
          nAlbaran: itemToDelete?.nAlbaran,
        })}
        confirmText={t('albaran.confirm.eliminar')}
        isLoading={isDeleting}
      />
    </Box>
  );
};

export default AlbaranPage;
