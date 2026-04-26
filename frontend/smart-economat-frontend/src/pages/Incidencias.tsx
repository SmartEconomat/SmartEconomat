import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Tab,
  Tabs,
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
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
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
import { type IncidenciasResolucionTab } from '../features/incidencias/IncidenciasStatusTabs';
import ResolveIncidenciaModal from '../features/incidencias/ResolveIncidenciaModal';
import { useAuth, usePermission } from '../store/auth.hooks';
import { useTranslation } from 'react-i18next';
import { PERMISSIONS } from '../sherlock-auth/permissions.constants';
import ReporteSelectorModal, {
  type ReporteFormato,
} from '../components/ui/ReporteSelectorModal';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';

// Eliminado INCIDENCIA_STATUS_LABEL hardcodeado en favor de StatusChip + i18n

const INCIDENCIA_STATUS_CHIP: Record<EstadoIncidencia, string> = {
  [EstadoIncidencia.NUEVA]: 'pending',
  [EstadoIncidencia.EN_AJUSTE]: 'review',
  [EstadoIncidencia.PENDIENTE_VALIDACION]: 'warning',
  [EstadoIncidencia.RESUELTA]: 'completed',
  [EstadoIncidencia.CANCELADA]: 'cancelled',
  [EstadoIncidencia.INVALIDA]: 'error',
};

type ResolveDialogMode = 'adjust' | 'resolve';

const Incidencias: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const toast = useToast();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const hasDashboardFilter = searchParams.get('resolucion') === 'por_resolver';
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [data, setData] = useState<Incidencia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [resolucionTab, setResolucionTab] =
    useState<IncidenciasResolucionTab>('por_resolver');
  const [filters, setFilters] = useState<IncidenciaFiltersState>({
    startDate: null,
    endDate: null,
  });

  useEffect(() => {
    if (hasDashboardFilter) {
      setResolucionTab('por_resolver');
    }
  }, [hasDashboardFilter]);

  const clearDashboardFilter = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('resolucion');
    setSearchParams(nextParams, { replace: true });
  };
  const [itemToView, setItemToView] = useState<Incidencia | null>(null);
  const [itemToResolve, setItemToResolve] = useState<Incidencia | null>(null);
  const [resolveDialogMode, setResolveDialogMode] =
    useState<ResolveDialogMode>('resolve');
  const [itemToDelete, setItemToDelete] = useState<Incidencia | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReporteOpen, setIsReporteOpen] = useState(false);
  const [reporteFormato, setReporteFormato] = useState<ReporteFormato>('pdf');

  const canResolve = usePermission(PERMISSIONS.incidencias.resolver);
  const canDelete = usePermission(PERMISSIONS.incidencias.eliminar);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: IncidenciasQueryParams = {
        page,
        limit: pageSize,
        searchTerm: searchTerm || undefined,
        resuelta: resolucionTab === 'resueltas',
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      };
      const result = await fetchIncidencias(params);
      setData(result.data);
      setTotalItems(result.total);
      setTotalPages(result.totalPages);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('incidencias.toast.errorCargar');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, searchTerm, resolucionTab, filters, t]);

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
          ? t('incidencias.toast.resuelta')
          : t('incidencias.toast.actualizada')
      );
      setItemToResolve(null);
      if (itemToView?.id === id) {
        setItemToView(null);
      }
      await loadData();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t('incidencias.toast.errorResolver');
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
      toast.success(t('incidencias.toast.eliminada'));
      setItemToDelete(null);
      loadData();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t('incidencias.toast.errorEliminar');
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

  const handleResolucionTabChange = (nextTab: IncidenciasResolucionTab) => {
    setResolucionTab(nextTab);
    setPage(1);
  };

  const columns: Column<Incidencia>[] = useMemo(
    () => [
      {
        id: 'createdAt',
        label: t('incidencias.columns.fecha'),
        render: (row) => new Date(row.createdAt).toLocaleDateString(),
        sortable: true,
      },
      {
        id: 'proveedorNombre',
        label: t('incidencias.columns.proveedor'),
        render: (row) => row.proveedorNombre || '—',
        sortable: true,
      },
      {
        id: 'productos',
        label: t('incidencias.columns.productos'),
        render: (row) => (
          <Stack spacing={0.35}>
            <Typography variant="body2" fontWeight={600}>
              {(row.lineas || [])
                .map((linea) => linea.nombreProducto)
                .filter(Boolean)
                .slice(0, 2)
                .join(', ') || t('incidencias.detalle.sinDetalle')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('incidencias.columns.lineas', {
                count: row.lineas?.length || 0,
              })}
            </Typography>
          </Stack>
        ),
      },
      {
        id: 'cantidades',
        label: t('incidencias.columns.cantidades'),
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
                  const unidad =
                    linea.unidad || t('comun.unidades.unidadCorta');
                  return (
                    <>
                      {linea.nombreProducto}:{' '}
                      {t('incidencias.columns.esperada')}{' '}
                      {linea.cantidadEsperada} {unidad} ·{' '}
                      {t('incidencias.columns.recibida')}{' '}
                      {linea.cantidadRecibida} {unidad} ·{' '}
                      {t('incidencias.columns.pendiente')}{' '}
                      {linea.cantidadPendiente} {unidad}
                    </>
                  );
                })()}
              </Typography>
            ))}
            {(row.lineas?.length || 0) > 3 && (
              <Typography variant="caption" color="text.secondary">
                {t('incidencias.columns.masProductos', {
                  count: (row.lineas?.length || 0) - 3,
                })}
              </Typography>
            )}
          </Stack>
        ),
      },
      {
        id: 'estado',
        label: t('incidencias.columns.estado'),
        render: (row) => (
          <StatusChip
            status={row.estado}
            icon={
              row.resuelta ? <CheckCircleIcon /> : <ReportProblemOutlinedIcon />
            }
          />
        ),
      },
    ],
    [t]
  );

  const renderActions = (row: Incidencia) => (
    <Stack
      direction="row"
      spacing={0.5}
      sx={{ minWidth: 160, justifyContent: 'flex-start' }}
    >
      <Box sx={{ width: 34, display: 'flex', justifyContent: 'center' }}>
        <Tooltip title={t('incidencias.verDetalle')}>
          <IconButton
            color="primary"
            onClick={(e) => {
              e.currentTarget.blur();
              setItemToView(row);
            }}
            size="small"
            aria-label={t('incidencias.verDetalle')}
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={{ width: 34, display: 'flex', justifyContent: 'center' }}>
        {!row.resuelta && canResolve && (
          <Tooltip title={t('incidencias.ajustarCantidades')}>
            <IconButton
              onClick={() => openResolveModal(row, 'adjust')}
              size="small"
              color="warning"
              id="btn-ajustar-incidencia"
              aria-label={t('incidencias.ajustarCantidades')}
            >
              <TuneIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Box sx={{ width: 34, display: 'flex', justifyContent: 'center' }}>
        {!row.resuelta && canResolve && (
          <Tooltip title={t('incidencias.resolverIncidencia')}>
            <IconButton
              onClick={() => openResolveModal(row, 'resolve')}
              size="small"
              color="success"
              id="btn-resolver-incidencia"
              aria-label={t('incidencias.resolverIncidencia')}
            >
              <CheckCircleIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Box sx={{ width: 34, display: 'flex', justifyContent: 'center' }}>
        {canDelete && (
          <Tooltip title={t('comun.eliminar')}>
            <IconButton
              onClick={() => setItemToDelete(row)}
              size="small"
              color="error"
              aria-label={t('comun.eliminar')}
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
        title: t('incidencias.detalle.infoTitulo'),
        fields: [
          {
            label: t('incidencias.columns.proveedor'),
            value: itemToView.proveedorNombre || '—',
          },
          {
            label: t('incidencias.detalle.fechaRegistro'),
            value: new Date(itemToView.createdAt).toLocaleString(),
          },
          {
            label: t('incidencias.columns.estado'),
            value: t(`status.${itemToView.estado.toLowerCase()}`),
          },
          {
            label: t('incidencias.detalle.recepcionId') || 'ID Recepción',
            value: itemToView.recepcionId || '—',
          },
          {
            label: t('incidencias.detalle.motivo'),
            value:
              itemToView.motivoIncidencia || t('incidencias.detalle.sinMotivo'),
            fullWidth: true,
          },
        ],
      },
      {
        title: t('incidencias.detalle.notasTitulo'),
        fields: [
          {
            label: t('incidencias.detalle.notasRecepcion'),
            value:
              itemToView.observacionesRecepcion ||
              t('incidencias.detalle.sinObservaciones'),
            fullWidth: true,
          },
          {
            label: t('incidencias.detalle.notasResolucion'),
            value:
              itemToView.observacionesResolucion ||
              t('incidencias.detalle.sinNotasResolucion'),
            fullWidth: true,
          },
        ],
      },
      ...(itemToView.resuelta
        ? [
            {
              title: t('incidencias.detalle.resolucion'),
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
                      {t('incidencias.detalle.resuelta')}
                    </Typography>
                  </Stack>
                  <Stack spacing={2}>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mb: 0.5 }}
                      >
                        {t('incidencias.detalle.fechaResolucion')}
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
                        {t('incidencias.detalle.notasResolucion')}
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
        title: t('incidencias.detalle.productosDiscrepancia', {
          count: itemToView.lineas?.length || 0,
        }),
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
                      label={
                        t(`status.${linea.tipoDiferencia.toLowerCase()}`) ||
                        linea.tipoDiferencia
                      }
                      size="small"
                    />
                    <StatusChip
                      status={linea.estadoReclamacion}
                      label={
                        t(`status.${linea.estadoReclamacion.toLowerCase()}`) ||
                        linea.estadoReclamacion
                      }
                      size="small"
                    />
                  </Stack>
                </Stack>
                <Stack direction="row" spacing={3}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('incidencias.modal.tabla.pedida')}
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {linea.cantidadEsperada}{' '}
                      {linea.unidad || t('comun.unidades.unidadCorta')}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('incidencias.modal.tabla.recibida')}
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {linea.cantidadRecibida}{' '}
                      {linea.unidad || t('comun.unidades.unidadCorta')}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('incidencias.modal.tabla.balance')}
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={
                        linea.diferencia === 0 ? 'success.main' : 'error.main'
                      }
                    >
                      {linea.diferencia > 0
                        ? `+${linea.diferencia} ${linea.unidad || t('comun.unidades.unidadCorta')}`
                        : `${linea.diferencia} ${linea.unidad || t('comun.unidades.unidadCorta')}`}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('incidencias.columns.pendiente')}
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
                      {linea.cantidadPendiente}{' '}
                      {linea.unidad || t('comun.unidades.unidadCorta')}
                    </Typography>
                  </Box>
                </Stack>
                {linea.observaciones && (
                  <Typography
                    variant="caption"
                    sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}
                  >
                    {t('incidencias.modal.tabla.nota')}: {linea.observaciones}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        ),
      },
    ];
  }, [itemToView, theme, t]);

  return (
    <Box>
      <PageToolbar
        id="incidencias-toolbar"
        title={t('incidencias.titulo')}
        totalItems={totalItems}
        totalItemsLabel={t('incidencias.totalItemsLabel')}
        searchValue={searchTerm}
        onSearchChange={(v) => {
          setSearchTerm(v);
          setPage(1);
        }}
        searchPlaceholder={t('incidencias.buscarPlaceholder')}
        extraActions={[
          {
            label: t('incidencias.reportePdf'),
            onClick: () => openReporteModal('pdf'),
            icon: <PictureAsPdfIcon />,
            id: 'btn-reporte-incidencias-pdf',
            color: 'error',
            variant: 'outlined',
          },
          {
            label: t('incidencias.reporteExcel'),
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

      <Paper
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
            id="incidencias-tabs"
            value={resolucionTab}
            onChange={(_, newValue: IncidenciasResolucionTab) =>
              handleResolucionTabChange(newValue)
            }
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab
              value="por_resolver"
              label={t('incidencias.tabs.porResolver')}
              icon={<PendingActionsIcon />}
            />
            <Tab
              value="resueltas"
              label={t('incidencias.tabs.resueltas')}
              icon={<CheckCircleOutlineIcon />}
            />
          </Tabs>
        </Box>

        <Box sx={{ p: { xs: 2, sm: 4 } }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
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
                  {t('incidencias.quitarFiltro')}
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
              {t('incidencias.filterInfo')}
            </Alert>
          )}

          <DataTable
            id="incidencias-table"
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
                  {resolucionTab === 'resueltas'
                    ? t('incidencias.empty.noResueltas')
                    : t('incidencias.empty.noPorResolver')}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ maxWidth: 400, mx: 'auto' }}
                >
                  {searchTerm
                    ? t('incidencias.empty.noResultados')
                    : resolucionTab === 'resueltas'
                      ? t('incidencias.empty.noFiltrosResueltas')
                      : t('incidencias.empty.excelenteTrabajo')}
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
        </Box>
      </Paper>

      <DetailModal
        isOpen={!!itemToView}
        onClose={() => setItemToView(null)}
        title={t('incidencias.detalle.titulo')}
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
                {t('incidencias.ajustarCantidades')}
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
                {t('incidencias.resolverIncidencia')}
              </Button>
            </Stack>
          ) : undefined
        }
      />

      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => !isDeleting && setItemToDelete(null)}
        onConfirm={handleDelete}
        title={t('incidencias.confirm.eliminarTitulo')}
        message={t('incidencias.confirm.eliminarMensaje')}
        confirmText={t('comun.eliminar')}
        cancelText={t('comun.cancelar')}
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
