import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  IconButton,
  Tooltip,
  alpha,
  useTheme,
  Button,
  Stack,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TuneIcon from '@mui/icons-material/Tune';
import DataTable, { Column } from '../components/ui/DataTable';
import PageToolbar from '../components/ui/PageToolbar';
import DetailModal from '../components/ui/DetailModal';
import StatusChip from '../components/ui/StatusChip';
import {
  EstadoIncidencia,
  Incidencia,
  IncidenciasQueryParams,
  ResolveIncidenciaPayload,
} from '../services/incidencia.types';
import {
  fetchIncidencias,
  resolveIncidencia,
  removeIncidencia,
} from '../services/incidencia.service';
import { useToast } from '../store/toast.hooks';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import IncidenciaFilters, {
  IncidenciaFiltersState,
} from '../features/incidencias/IncidenciaFilters';
import ResolveIncidenciaModal from '../features/incidencias/ResolveIncidenciaModal';
import { useAuth, usePermission } from '../store/auth.hooks';
import ReporteSelectorModal, {
  type ReporteFormato,
} from '../components/ui/ReporteSelectorModal';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';

const INCIDENCIA_STATUS_LABEL: Record<EstadoIncidencia, string> = {
  pendiente: 'Pendiente',
  en_revision: 'En revisión',
  parcial: 'Parcial',
  resuelta: 'Resuelta',
  cancelada: 'Cancelada',
};

const INCIDENCIA_STATUS_CHIP: Record<EstadoIncidencia, string> = {
  pendiente: 'pending',
  en_revision: 'review',
  parcial: 'parcial',
  resuelta: 'completed',
  cancelada: 'cancelled',
};

type ResolveDialogMode = 'adjust' | 'resolve';

const Incidencias: React.FC = () => {
  const theme = useTheme();
  const toast = useToast();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [data, setData] = useState<Incidencia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<IncidenciaFiltersState>({
    resuelta: null,
    startDate: null,
    endDate: null,
  });
  const [itemToView, setItemToView] = useState<Incidencia | null>(null);
  const [itemToResolve, setItemToResolve] = useState<Incidencia | null>(null);
  const [resolveDialogMode, setResolveDialogMode] =
    useState<ResolveDialogMode>('resolve');
  const [itemToDelete, setItemToDelete] = useState<Incidencia | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReporteOpen, setIsReporteOpen] = useState(false);
  const [reporteFormato, setReporteFormato] = useState<ReporteFormato>('pdf');

  const canResolve = usePermission('incidencias:resolver');
  const canDelete = usePermission('incidencias:eliminar');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: IncidenciasQueryParams = {
        page,
        limit: pageSize,
        searchTerm: searchTerm || undefined,
        resuelta: filters.resuelta !== null ? filters.resuelta : undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      };
      const result = await fetchIncidencias(params);
      setData(result.data);
      setTotalItems(result.total);
      setTotalPages(result.totalPages);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al cargar incidencias';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, searchTerm, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleResolve = async (
    id: string,
    payload: ResolveIncidenciaPayload
  ) => {
    setIsResolving(true);
    try {
      await resolveIncidencia(id, {
        ...payload,
        usuarioId:
          payload.usuarioId || (user?.id ? String(user.id) : undefined),
      });
      toast.success(
        payload.marcarComoResuelta
          ? 'Incidencia marcada como resuelta'
          : 'Incidencia actualizada correctamente'
      );
      setItemToResolve(null);
      if (itemToView?.id === id) {
        setItemToView(null);
      }
      await loadData();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al resolver la incidencia';
      toast.error(message);
    } finally {
      setIsResolving(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await removeIncidencia(itemToDelete.id);
      toast.success('Incidencia eliminada correctamente');
      setItemToDelete(null);
      loadData();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al eliminar la incidencia';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const openResolveModal = (
    incidencia: Incidencia,
    mode: ResolveDialogMode
  ) => {
    setResolveDialogMode(mode);
    setItemToResolve(incidencia);
  };

  const openReporteModal = (formato: ReporteFormato) => {
    setReporteFormato(formato);
    setIsReporteOpen(true);
  };

  const columns: Column<Incidencia>[] = useMemo(
    () => [
      {
        id: 'createdAt',
        label: 'Fecha',
        render: (row) => new Date(row.createdAt).toLocaleDateString(),
        sortable: true,
      },
      {
        id: 'proveedorNombre',
        label: 'Proveedor',
        render: (row) => row.proveedorNombre || '—',
        sortable: true,
      },
      {
        id: 'productos',
        label: 'Producto(s)',
        render: (row) => (
          <Stack spacing={0.35}>
            <Typography variant="body2" fontWeight={600}>
              {(row.lineas || [])
                .map((linea) => linea.nombreProducto)
                .filter(Boolean)
                .slice(0, 2)
                .join(', ') || 'Sin detalle'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.lineas?.length || 0} línea
              {(row.lineas?.length || 0) !== 1 ? 's' : ''}
            </Typography>
          </Stack>
        ),
      },
      {
        id: 'cantidades',
        label: 'Cantidades por producto',
        render: (row) => (
          <Stack spacing={0.35}>
            {(row.lineas || []).slice(0, 3).map((linea) => (
              <Typography
                key={linea.id}
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block' }}
              >
                {(() => {
                  const unidad = linea.unidad || 'ud';
                  return (
                    <>
                      {linea.nombreProducto}: P {linea.cantidadEsperada}{' '}
                      {unidad} · R {linea.cantidadRecibida} {unidad} · Pe{' '}
                      {linea.cantidadPendiente} {unidad}
                    </>
                  );
                })()}
              </Typography>
            ))}
            {(row.lineas?.length || 0) > 3 && (
              <Typography variant="caption" color="text.secondary">
                +{(row.lineas?.length || 0) - 3} producto(s)
              </Typography>
            )}
          </Stack>
        ),
      },
      {
        id: 'estado',
        label: 'Estado',
        render: (row) => (
          <StatusChip
            status={INCIDENCIA_STATUS_CHIP[row.estado]}
            label={INCIDENCIA_STATUS_LABEL[row.estado]}
            icon={
              row.resuelta ? <CheckCircleIcon /> : <ReportProblemOutlinedIcon />
            }
          />
        ),
      },
    ],
    []
  );

  const renderActions = (row: Incidencia) => (
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
              setItemToView(row);
            }}
            size="small"
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={{ width: 34, display: 'flex', justifyContent: 'center' }}>
        {!row.resuelta && canResolve && (
          <Tooltip title="Ajustar cantidades">
            <IconButton
              onClick={() => openResolveModal(row, 'adjust')}
              size="small"
              color="warning"
              aria-label="Ajustar cantidades"
            >
              <TuneIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Box sx={{ width: 34, display: 'flex', justifyContent: 'center' }}>
        {!row.resuelta && canResolve && (
          <Tooltip title="Resolver incidencia">
            <IconButton
              onClick={() => openResolveModal(row, 'resolve')}
              size="small"
              color="success"
              aria-label="Resolver incidencia"
            >
              <CheckCircleIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Box sx={{ width: 34, display: 'flex', justifyContent: 'center' }}>
        {canDelete && (
          <Tooltip title="Eliminar">
            <IconButton
              onClick={() => setItemToDelete(row)}
              size="small"
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Stack>
  );

  const detailSections = useMemo(() => {
    if (!itemToView) return [];
    return [
      {
        title: 'Información de la Incidencia',
        fields: [
          { label: 'Proveedor', value: itemToView.proveedorNombre || '—' },
          {
            label: 'Fecha de Registro',
            value: new Date(itemToView.createdAt).toLocaleString(),
          },
          {
            label: 'Estado',
            value: INCIDENCIA_STATUS_LABEL[itemToView.estado],
          },
          { label: 'ID Recepción', value: itemToView.recepcionId || '—' },
          {
            label: 'Motivo',
            value: itemToView.motivoIncidencia || 'Sin motivo especificado',
            fullWidth: true,
          },
        ],
      },
      {
        title: 'Notas de Incidencia',
        fields: [
          {
            label: 'Notas de Recepción',
            value: itemToView.observacionesRecepcion || 'Sin observaciones',
            fullWidth: true,
          },
          {
            label: 'Notas de Resolución',
            value:
              itemToView.observacionesResolucion || 'Sin notas de resolución',
            fullWidth: true,
          },
        ],
      },
      ...(itemToView.resuelta
        ? [
            {
              title: 'Resolución',
              fullWidth: true,
              content: (
                <Box
                  sx={{
                    p: 2,
                    bgcolor: alpha(theme.palette.success.main, 0.05),
                    border: '1px solid',
                    borderColor: alpha(theme.palette.success.main, 0.3),
                    borderRadius: 2,
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    mb={1.5}
                  >
                    <CheckCircleIcon color="success" fontSize="small" />
                    <Typography
                      variant="subtitle2"
                      color="success.main"
                      fontWeight={700}
                    >
                      INCIDENCIA RESUELTA
                    </Typography>
                  </Stack>
                  <Stack spacing={2}>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mb: 0.5 }}
                      >
                        Fecha de Resolución
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {itemToView.fechaResolucion
                          ? new Date(
                              itemToView.fechaResolucion
                            ).toLocaleString()
                          : '—'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mb: 0.5 }}
                      >
                        Notas de Resolución
                      </Typography>
                      <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                        {itemToView.observacionesResolucion || '—'}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              ),
            },
          ]
        : []),
      {
        title: `Productos con Discrepancia (${itemToView.lineas?.length || 0})`,
        fullWidth: true,
        content: (
          <Box sx={{ mt: 1 }}>
            {itemToView.lineas?.map((linea, idx) => (
              <Box
                key={linea.id}
                sx={{
                  p: 1.5,
                  mb: idx !== itemToView.lineas.length - 1 ? 1 : 0,
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.background.default, 0.5),
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  mb={1}
                >
                  <Typography variant="subtitle2" color="primary">
                    {linea.nombreProducto}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <StatusChip
                      status={
                        linea.tipoDiferencia === 'FALTANTE'
                          ? 'error'
                          : 'warning'
                      }
                      label={linea.tipoDiferencia}
                      size="small"
                    />
                    <StatusChip
                      status={linea.estadoReclamacion}
                      label={linea.estadoReclamacion}
                      size="small"
                    />
                  </Stack>
                </Stack>
                <Stack direction="row" spacing={3}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Pedida
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {linea.cantidadEsperada} {linea.unidad || 'ud'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Recibido
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {linea.cantidadRecibida} {linea.unidad || 'ud'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Diferencia
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={
                        linea.diferencia === 0 ? 'success.main' : 'error.main'
                      }
                    >
                      {linea.diferencia > 0
                        ? `+${linea.diferencia} ${linea.unidad || 'ud'}`
                        : `${linea.diferencia} ${linea.unidad || 'ud'}`}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Pendiente
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={
                        linea.cantidadPendiente > 0
                          ? 'warning.main'
                          : 'success.main'
                      }
                    >
                      {linea.cantidadPendiente} {linea.unidad || 'ud'}
                    </Typography>
                  </Box>
                </Stack>
                {linea.observaciones && (
                  <Typography
                    variant="caption"
                    sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}
                  >
                    Nota: {linea.observaciones}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        ),
      },
    ];
  }, [itemToView, theme]);

  return (
    <Box>
      <PageToolbar
        title="Centro de Incidencias"
        totalItems={totalItems}
        totalItemsLabel="incidencias"
        searchValue={searchTerm}
        onSearchChange={(v) => {
          setSearchTerm(v);
          setPage(1);
        }}
        searchPlaceholder="Buscar por proveedor u observaciones..."
        extraActions={[
          {
            label: 'Reporte PDF',
            onClick: () => openReporteModal('pdf'),
            icon: <PictureAsPdfIcon />,
            id: 'btn-reporte-incidencias-pdf',
            color: 'error',
            variant: 'outlined',
          },
          {
            label: 'Reporte Excel',
            onClick: () => openReporteModal('excel'),
            icon: <FileDownloadOutlinedIcon />,
            id: 'btn-reporte-incidencias-excel',
            color: 'success',
            variant: 'outlined',
          },
        ]}
        filters={
          <IncidenciaFilters
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
          data={data}
          isLoading={isLoading}
          renderActions={renderActions}
          emptyStateMessage={
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <ReportProblemOutlinedIcon
                sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No hay incidencias activas
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: 400, mx: 'auto' }}
              >
                {searchTerm
                  ? 'No se encontraron incidencias que coincidan con tu búsqueda.'
                  : '¡Excelente trabajo! No se han detectado discrepancias en las recepciones recientes.'}
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

      <DetailModal
        isOpen={!!itemToView}
        onClose={() => setItemToView(null)}
        title="Detalle de Incidencia"
        subtitle={itemToView?.proveedorNombre}
        sections={detailSections}
        size="md"
        actions={
          !itemToView?.resuelta && canResolve ? (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Button
                variant="outlined"
                color="warning"
                startIcon={<TuneIcon />}
                onClick={() => {
                  if (itemToView) {
                    openResolveModal(itemToView, 'adjust');
                  }
                }}
              >
                Ajustar cantidades
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => {
                  if (itemToView) {
                    openResolveModal(itemToView, 'resolve');
                  }
                }}
              >
                Resolver incidencia
              </Button>
            </Stack>
          ) : undefined
        }
      />

      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => !isDeleting && setItemToDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar Incidencia"
        message="¿Estás seguro de que deseas eliminar esta incidencia? Esta acción no se puede deshacer y se perderá el registro de la discrepancia."
        confirmText="Eliminar"
        isLoading={isDeleting}
      />

      <ReporteSelectorModal
        isOpen={isReporteOpen}
        onClose={() => setIsReporteOpen(false)}
        tipo="incidencias"
        formato={reporteFormato}
      />

      <ResolveIncidenciaModal
        isOpen={!!itemToResolve}
        onClose={() => setItemToResolve(null)}
        onResolve={(payload) => handleResolve(itemToResolve!.id, payload)}
        isLoading={isResolving}
        incidencia={itemToResolve}
        defaultMarkResolved={resolveDialogMode === 'resolve'}
      />
    </Box>
  );
};

export default Incidencias;
