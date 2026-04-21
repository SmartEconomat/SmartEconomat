import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
import IncidenciasStatusTabs, {
  IncidenciasCerradasTab,
  IncidenciasResolucionTab,
} from '../features/incidencias/IncidenciasStatusTabs';
import ResolveIncidenciaModal from '../features/incidencias/ResolveIncidenciaModal';
import { useAuth, usePermission } from '../store/auth.hooks';
import { PERMISSIONS } from '../sherlock-auth/permissions.constants';
import ReporteSelectorModal, {
  type ReporteFormato,
} from '../components/ui/ReporteSelectorModal';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';

const INCIDENCIA_STATUS_LABEL: Record<EstadoIncidencia, string> = {
  nueva: 'Nueva',
  en_ajuste: 'En ajuste',
  pendiente_validacion: 'Pendiente validación',
  resuelta: 'Resuelta',
  cancelada: 'Cancelada',
  invalida: 'Inválida',
};

const INCIDENCIA_STATUS_CHIP: Record<EstadoIncidencia, string> = {
  nueva: 'pending',
  en_ajuste: 'warning',
  pendiente_validacion: 'review',
  resuelta: 'completed',
  cancelada: 'cancelled',
  invalida: 'error',
};

const CLOSED_INCIDENCIA_STATES = new Set<EstadoIncidencia>([
  EstadoIncidencia.RESUELTA,
  EstadoIncidencia.CANCELADA,
  EstadoIncidencia.INVALIDA,
]);

const CLOSED_STATE_PRIORITY: Record<EstadoIncidencia, number> = {
  [EstadoIncidencia.CANCELADA]: 0,
  [EstadoIncidencia.INVALIDA]: 1,
  [EstadoIncidencia.RESUELTA]: 2,
  [EstadoIncidencia.EN_AJUSTE]: 3,
  [EstadoIncidencia.PENDIENTE_VALIDACION]: 4,
  [EstadoIncidencia.NUEVA]: 5,
};

type ResolveDialogMode = 'adjust' | 'resolve';

const Incidencias: React.FC = () => {
  const { t } = useTranslation();
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
  const [resolucionTab, setResolucionTab] =
    useState<IncidenciasResolucionTab>('abiertas');
  const [cerradasTab, setCerradasTab] =
    useState<IncidenciasCerradasTab>('todas');
  const [filters, setFilters] = useState<IncidenciaFiltersState>({
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

  const canResolve = usePermission(PERMISSIONS.incidencias.resolver);
  const canDelete = usePermission(PERMISSIONS.incidencias.eliminar);

  const isCerradasTab = resolucionTab === 'cerradas';

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isCerradasTab) {
        const limit = 50;
        const baseParams: IncidenciasQueryParams = {
          limit,
          searchTerm: searchTerm || undefined,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        };

        const firstPage = await fetchIncidencias({
          ...baseParams,
          page: 1,
        });

        let mergedData = [...firstPage.data];
        if (firstPage.totalPages > 1) {
          const restPages = await Promise.all(
            Array.from({ length: firstPage.totalPages - 1 }, (_, idx) =>
              fetchIncidencias({
                ...baseParams,
                page: idx + 2,
              })
            )
          );

          mergedData = mergedData.concat(
            ...restPages.map((result) => result.data)
          );
        }

        const mergedClosedData = mergedData.filter((item) =>
          CLOSED_INCIDENCIA_STATES.has(item.estado)
        );

        mergedClosedData.sort((a, b) => {
          const stateDiff =
            (CLOSED_STATE_PRIORITY[a.estado] ?? 99) -
            (CLOSED_STATE_PRIORITY[b.estado] ?? 99);

          if (stateDiff !== 0) {
            return stateDiff;
          }

          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });

        setData(mergedClosedData);
        setTotalItems(mergedClosedData.length);
        setTotalPages(1);
      } else {
        const params: IncidenciasQueryParams = {
          page,
          limit: pageSize,
          searchTerm: searchTerm || undefined,
          resuelta: false,
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
        };
        const result = await fetchIncidencias(params);
        setData(result.data);
        setTotalItems(result.total);
        setTotalPages(result.totalPages);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al cargar incidencias';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, searchTerm, isCerradasTab, filters]);

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
      if (payload.marcarComoResuelta) {
        switch (payload.estadoFinal) {
          case EstadoIncidencia.CANCELADA:
            toast.success(t('incidencias.toast.cancelled'));
            break;
          case EstadoIncidencia.INVALIDA:
            toast.success(t('incidencias.toast.invalida'));
            break;
          default:
            toast.success(t('incidencias.toast.resolved'));
            break;
        }
      } else {
        toast.success(t('incidencias.toast.updated'));
      }
      setItemToResolve(null);
      if (itemToView?.id === id) {
        setItemToView(null);
      }
      await loadData();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t('incidencias.toast.resolveError');
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
      toast.success(t('incidencias.toast.deleted'));
      setItemToDelete(null);
      loadData();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('incidencias.toast.deleteError');
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
    if (nextTab !== 'cerradas') {
      setCerradasTab('todas');
    }
    setPage(1);
  };

  const dataFiltrada = useMemo(() => {
    if (!isCerradasTab || cerradasTab === 'todas') {
      return data;
    }

    return data.filter((item) => item.estado === cerradasTab);
  }, [data, isCerradasTab, cerradasTab]);

  const dataPaginada = useMemo(() => {
    if (!isCerradasTab) {
      return data;
    }

    const start = (page - 1) * pageSize;
    return dataFiltrada.slice(start, start + pageSize);
  }, [data, dataFiltrada, isCerradasTab, page, pageSize]);

  const totalItemsVista = isCerradasTab ? dataFiltrada.length : totalItems;
  const totalPagesVista = isCerradasTab
    ? Math.max(1, Math.ceil(totalItemsVista / pageSize))
    : totalPages;

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
        render: (row) => {
          const count = row.lineas?.length || 0;
          return (
            <Stack spacing={0.35}>
              <Typography variant="body2" fontWeight={600}>
                {(row.lineas || [])
                  .map((linea) => linea.nombreProducto)
                  .filter(Boolean)
                  .slice(0, 2)
                  .join(', ') || t('incidencias.noDetail')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {count !== 1
                  ? t('incidencias.lineCountPlural', { count })
                  : t('incidencias.lineCount', { count })}
              </Typography>
            </Stack>
          );
        },
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
                {t('incidencias.moreProducts', {
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
            status={INCIDENCIA_STATUS_CHIP[row.estado]}
            label={INCIDENCIA_STATUS_LABEL[row.estado]}
            icon={
              row.resuelta ? <CheckCircleIcon /> : <ReportProblemOutlinedIcon />
            }
          />
        ),
      },
    ],
    [t]
  );

  const renderActions = (row: Incidencia) => {
    const hasLineas = (row.lineas?.length ?? 0) > 0;
    const canOperate = !row.resuelta && hasLineas;

    return (
      <Stack
        direction="row"
        spacing={0.5}
        sx={{ minWidth: 160, justifyContent: 'flex-start' }}
      >
        <Box sx={{ width: 34, display: 'flex', justifyContent: 'center' }}>
          <Tooltip title={t('incidencias.actions.viewDetail')}>
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
          {canOperate && canResolve && (
            <Tooltip title={t('incidencias.actions.adjust')}>
              <IconButton
                onClick={() => openResolveModal(row, 'adjust')}
                size="small"
                color="warning"
                aria-label={t('incidencias.actions.adjust')}
              >
                <TuneIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Box sx={{ width: 34, display: 'flex', justifyContent: 'center' }}>
          {canOperate && canResolve && (
            <Tooltip title={t('incidencias.actions.resolve')}>
              <IconButton
                onClick={() => openResolveModal(row, 'resolve')}
                size="small"
                color="success"
                aria-label={t('incidencias.actions.resolve')}
              >
                <CheckCircleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Box sx={{ width: 34, display: 'flex', justifyContent: 'center' }}>
          {canDelete && (
            <Tooltip title={t('incidencias.actions.delete')}>
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
  };

  const detailSections = useMemo(() => {
    if (!itemToView) return [];
    return [
      {
        title: t('incidencias.detail.infoTitle'),
        fields: [
          {
            label: t('incidencias.detail.proveedor'),
            value: itemToView.proveedorNombre || '—',
          },
          {
            label: t('incidencias.detail.fechaRegistro'),
            value: new Date(itemToView.createdAt).toLocaleString(),
          },
          {
            label: t('incidencias.detail.estado'),
            value: INCIDENCIA_STATUS_LABEL[itemToView.estado],
          },
          {
            label: t('incidencias.detail.idRecepcion'),
            value: itemToView.recepcionId || '—',
          },
          {
            label: t('incidencias.detail.motivo'),
            value:
              itemToView.motivoIncidencia || t('incidencias.detail.sinMotivo'),
            fullWidth: true,
          },
        ],
      },
      {
        title: t('incidencias.detail.notasTitle'),
        fields: [
          {
            label: t('incidencias.detail.notasRecepcion'),
            value:
              itemToView.observacionesRecepcion ||
              t('incidencias.detail.sinObservaciones'),
            fullWidth: true,
          },
          {
            label: t('incidencias.detail.notasResolucion'),
            value:
              itemToView.observacionesResolucion ||
              t('incidencias.detail.sinNotasResolucion'),
            fullWidth: true,
          },
        ],
      },
      ...(itemToView.resuelta
        ? [
            {
              title: t('incidencias.detail.resolucionTitle'),
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
                      {t('incidencias.detail.resueltaLabel')}
                    </Typography>
                  </Stack>
                  <Stack spacing={2}>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mb: 0.5 }}
                      >
                        {t('incidencias.detail.fechaResolucion')}
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
                        {t('incidencias.detail.notasResolucion')}
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
        title: t('incidencias.detail.discrepanciaTitle', {
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
                      {t('incidencias.detail.pedida')}
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {linea.cantidadEsperada} {linea.unidad || 'ud'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('incidencias.detail.recibido')}
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {linea.cantidadRecibida} {linea.unidad || 'ud'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('incidencias.detail.diferencia')}
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
                      {t('incidencias.detail.pendiente')}
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
                    {t('incidencias.detail.nota', {
                      text: linea.observaciones,
                    })}
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
        title={t('incidencias.pageTitle')}
        totalItems={totalItemsVista}
        totalItemsLabel={t('incidencias.totalItemsLabel')}
        searchValue={searchTerm}
        onSearchChange={(v) => {
          setSearchTerm(v);
          setPage(1);
        }}
        searchPlaceholder={t('incidencias.searchPlaceholder')}
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

      <IncidenciasStatusTabs
        value={resolucionTab}
        onChange={handleResolucionTabChange}
        closedValue={cerradasTab}
        onClosedChange={(nextTab) => {
          setCerradasTab(nextTab);
          setPage(1);
        }}
      />

      <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <DataTable
          columns={columns}
          data={dataPaginada}
          isLoading={isLoading}
          renderActions={renderActions}
          emptyStateMessage={
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <ReportProblemOutlinedIcon
                sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {isCerradasTab
                  ? cerradasTab === 'todas'
                    ? t('incidencias.empty.noClosed')
                    : t('incidencias.empty.noStatus', {
                        status: INCIDENCIA_STATUS_LABEL[cerradasTab],
                      })
                  : t('incidencias.empty.noOpen')}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: 400, mx: 'auto' }}
              >
                {searchTerm
                  ? t('incidencias.empty.searchHint')
                  : isCerradasTab
                    ? t('incidencias.empty.closedHint')
                    : t('incidencias.empty.openHint')}
              </Typography>
            </Box>
          }
          pagination={{
            currentPage: page,
            totalPages: totalPagesVista,
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
        title={t('incidencias.detail.title')}
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
                {t('incidencias.adjustButton')}
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
                {t('incidencias.resolveButton')}
              </Button>
            </Stack>
          ) : undefined
        }
      />

      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => !isDeleting && setItemToDelete(null)}
        onConfirm={handleDelete}
        title={t('incidencias.deleteDialog.title')}
        message={t('incidencias.deleteDialog.message')}
        confirmText={t('incidencias.deleteDialog.confirm')}
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
