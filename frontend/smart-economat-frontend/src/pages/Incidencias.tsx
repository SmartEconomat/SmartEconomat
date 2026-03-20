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
import DataTable, { Column } from '../components/ui/DataTable';
import PageToolbar from '../components/ui/PageToolbar';
import DetailModal from '../components/ui/DetailModal';
import StatusChip from '../components/ui/StatusChip';
import {
  Incidencia,
  IncidenciasQueryParams,
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
  const [itemToDelete, setItemToDelete] = useState<Incidencia | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleResolve = async (id: string, observaciones: string) => {
    setIsResolving(true);
    try {
      if (!user?.id) {
        throw new Error('No se pudo identificar al usuario autenticado.');
      }

      await resolveIncidencia(id, {
        usuarioId: String(user.id),
        observacionesResolucion: observaciones,
      });
      toast.success('Incidencia marcada como resuelta');
      setItemToResolve(null);
      if (itemToView?.id === id) {
        setItemToView(null);
      }
      loadData();
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
        id: 'lineasCount',
        label: 'Productos Afectados',
        render: (row) => (
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" fontWeight={600}>
              {row.lineas?.length || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              líneas
            </Typography>
          </Stack>
        ),
      },
      {
        id: 'resuelta',
        label: 'Estado',
        render: (row) => (
          <StatusChip
            status={row.resuelta ? 'primary' : 'warning'}
            label={row.resuelta ? 'Resuelta' : 'Pendiente'}
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
      sx={{ minWidth: 120, justifyContent: 'flex-start' }}
    >
      <Box sx={{ width: 34, display: 'flex', justifyContent: 'center' }}>
        <Tooltip title="Ver detalle">
          <IconButton
            onClick={() => setItemToView(row)}
            size="small"
            color="inherit"
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={{ width: 34, display: 'flex', justifyContent: 'center' }}>
        {!row.resuelta && canResolve && (
          <Tooltip title="Marcar como resuelta">
            <IconButton
              onClick={() => setItemToResolve(row)}
              size="small"
              color="success"
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
            value: itemToView.resuelta ? 'Resuelta' : 'Pendiente',
          },
          { label: 'ID Recepción', value: itemToView.recepcionId || '—' },
        ],
      },
      {
        title: 'Observaciones de Recepción',
        fields: [
          {
            label: 'Notas',
            value: itemToView.observacionesRecepcion || 'Sin observaciones',
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
                  <StatusChip
                    status={
                      linea.tipoDiferencia === 'FALTANTE' ? 'error' : 'warning'
                    }
                    label={linea.tipoDiferencia}
                    size="small"
                  />
                </Stack>
                <Stack direction="row" spacing={3}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Esperado
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {linea.cantidadEsperada}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Recibido
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {linea.cantidadRecibida}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Diferencia
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color="error.main"
                    >
                      {linea.diferencia > 0
                        ? `+${linea.diferencia}`
                        : linea.diferencia}
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
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={() => {
                setItemToResolve(itemToView);
              }}
            >
              Marcar como Resuelta
            </Button>
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

      <ResolveIncidenciaModal
        isOpen={!!itemToResolve}
        onClose={() => setItemToResolve(null)}
        onResolve={(obs) => handleResolve(itemToResolve!.id, obs)}
        isLoading={isResolving}
        providerName={itemToResolve?.proveedorNombre}
      />
    </Box>
  );
};

export default Incidencias;
