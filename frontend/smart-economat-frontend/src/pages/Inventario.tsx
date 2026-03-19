import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Tooltip,
  SelectChangeEvent,
  Stack,
} from '@mui/material';
import { Autocomplete, CircularProgress } from '@mui/material';
import DataTable, { Column } from '../components/ui/DataTable';
import StatusChip from '../components/ui/StatusChip';
import {
  fetchInventario,
  agregarInventarioPorProducto,
  createInventarioItem,
} from '../services/inventario.service';
import type {
  InventarioItem,
  InventarioPorProducto,
} from '../services/inventario.types';
import { UbicacionService } from '../services/ubicacion.service';
import type { Ubicacion } from '../services/ubicacion.types';
import UbicacionesModal from '../components/inventario/UbicacionesModal';
import InventoryDetailModal from '../components/inventario/InventoryDetailModal';
import { useToast } from '../store/toast.hooks';
import { usePermission } from '../store/auth.hooks';
import {
  searchProductoProveedor,
  type ProductoProveedorOption,
} from '../services/productoProveedor.service';

import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SyncAltIcon from '@mui/icons-material/SyncAlt';

import PageToolbar from '../components/ui/PageToolbar';
import BarcodeScanner from '../components/ui/BarcodeScanner';
import InventarioFilters, {
  InventarioFiltersState,
} from '../features/inventario/InventarioFilters';

const initialFilters: InventarioFiltersState = {
  categorias: [],
  ubicaciones: [],
};

const Inventario: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] =
    useState<InventarioFiltersState>(initialFilters);
  const [data, setData] = useState<InventarioPorProducto[]>([]);
  const [rawItems, setRawItems] = useState<InventarioItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado para el modal de detalle/auditoría
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailMode, setDetailMode] = useState<'view' | 'audit'>('view');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );

  // Estado para crear nuevas entradas de inventario
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [productoProveedorValue, setProductoProveedorValue] =
    useState<ProductoProveedorOption | null>(null);
  const [productoProveedorInput, setProductoProveedorInput] = useState('');
  const [productoProveedorOptions, setProductoProveedorOptions] = useState<
    ProductoProveedorOption[]
  >([]);
  const [isSearchingProductoProveedor, setIsSearchingProductoProveedor] =
    useState(false);
  const [cantidadActual, setCantidadActual] = useState('');
  const [cantidadMinima, setCantidadMinima] = useState('');
  const [cantidadMaxima, setCantidadMaxima] = useState('');
  const [ubicacionId, setUbicacionId] = useState<string>('');
  const [fechaCaducidad, setFechaCaducidad] = useState('');

  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [isUbicacionesModalOpen, setIsUbicacionesModalOpen] = useState(false);
  const [isSearchScannerOpen, setIsSearchScannerOpen] = useState(false);

  const toast = useToast();

  const loadUbicaciones = useCallback(async () => {
    try {
      const data = await UbicacionService.findAll();
      const ubicacionesList = Array.isArray(data) ? data : [];
      setUbicaciones(ubicacionesList);
      if (ubicacionesList.length > 0 && !ubicacionId) {
        setUbicacionId(ubicacionesList[0].id);
      }
    } catch {
      toast.error('Error al cargar ubicaciones');
    }
  }, [toast, ubicacionId]);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchInventario()
      .then((items) => {
        setRawItems(items);
        const agregado = agregarInventarioPorProducto(items);
        setData(agregado);
        setTotalItems(agregado.length);
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error
            ? err.message
            : 'Error desconocido al cargar inventario.';
        setError(message);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Autocomplete remoto: NO cargamos el catálogo completo (escala a millones).
  useEffect(() => {
    if (!isCreateOpen) return;
    const term = productoProveedorInput.trim();
    if (term.length < 2) {
      setProductoProveedorOptions([]);
      setIsSearchingProductoProveedor(false);
      return;
    }

    let cancelled = false;
    setIsSearchingProductoProveedor(true);

    const t = window.setTimeout(() => {
      searchProductoProveedor(term, 20, 0)
        .then((opts) => {
          if (!cancelled) setProductoProveedorOptions(opts);
        })
        .catch((err: unknown) => {
          console.error('Error buscando producto/proveedor:', err);
          if (!cancelled) toast.error('Error al buscar producto/proveedor.');
        })
        .finally(() => {
          if (!cancelled) setIsSearchingProductoProveedor(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [isCreateOpen, productoProveedorInput, toast]);

  const handleOpenCreate = () => {
    setIsCreateOpen(true);
  };

  const handleCloseCreate = () => {
    if (isSaving) return;
    setIsCreateOpen(false);
  };

  const reloadInventario = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await fetchInventario();
      setRawItems(items);
      const agregado = agregarInventarioPorProducto(items);
      setData(agregado);
      setTotalItems(agregado.length);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error desconocido al cargar inventario.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInventario = async () => {
    if (!productoProveedorValue?.id) {
      toast.error('Selecciona un producto/proveedor.');
      return;
    }
    const cantActual = Number(cantidadActual);
    const cantMin = Number(cantidadMinima);
    const cantMax = cantidadMaxima ? Number(cantidadMaxima) : undefined;
    if (Number.isNaN(cantActual) || cantActual < 0) {
      toast.error(
        'La cantidad actual debe ser un número válido mayor o igual a 0.'
      );
      return;
    }
    if (Number.isNaN(cantMin) || cantMin < 0) {
      toast.error(
        'La cantidad mínima debe ser un número válido mayor o igual a 0.'
      );
      return;
    }
    if (cantMax !== undefined && (Number.isNaN(cantMax) || cantMax < 0)) {
      toast.error(
        'La cantidad máxima debe ser un número válido mayor o igual a 0.'
      );
      return;
    }

    // max must be >= min when provided
    if (cantMax !== undefined && cantMax < cantMin) {
      toast.error('La cantidad máxima no puede ser menor que la mínima.');
      return;
    }

    setIsSaving(true);
    try {
      await createInventarioItem({
        productoProveedorId: productoProveedorValue.id,
        cantidadActual: cantActual,
        cantidadMinima: cantMin,
        cantidadMaxima: cantMax,
        ubicacionId,
        fechaCaducidad: fechaCaducidad || undefined,
      });
      toast.success('Entrada de inventario creada correctamente.');
      setIsCreateOpen(false);
      setProductoProveedorValue(null);
      setProductoProveedorInput('');
      setProductoProveedorOptions([]);
      setCantidadActual('');
      setCantidadMinima('');
      setCantidadMaxima('');
      if (ubicaciones.length > 0) setUbicacionId(ubicaciones[0].id);
      setFechaCaducidad('');
      await reloadInventario();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error al crear la entrada de inventario.';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  // form validation helpers (used to enable/disable save button and show inline errors)
  const cantActualNum = Number(cantidadActual);
  const cantMinNum = Number(cantidadMinima);
  const cantMaxNum = cantidadMaxima ? Number(cantidadMaxima) : undefined;
  const isFormValid =
    !!productoProveedorValue?.id &&
    !Number.isNaN(cantActualNum) &&
    cantActualNum >= 0 &&
    !Number.isNaN(cantMinNum) &&
    cantMinNum >= 0 &&
    (cantMaxNum === undefined || (cantMaxNum >= 0 && cantMaxNum >= cantMinNum));

  // normalize a string removing diacritics and lowercasing; used for search
  const normalize = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const filteredData = useMemo(() => {
    let result = data;

    // Search filter
    if (searchTerm.trim()) {
      const term = normalize(searchTerm.trim());
      result = result.filter((p) => {
        const nombre = normalize(p.nombre ?? '');
        const tipo = normalize(p.tipo ?? '');
        const provs = (p.proveedores ?? []).map(normalize).join(' ');
        const ubicaciones = (p.ubicaciones ?? []).map(normalize).join(' ');
        return (
          nombre.includes(term) ||
          tipo.includes(term) ||
          provs.includes(term) ||
          ubicaciones.includes(term)
        );
      });
    }

    // Category filter
    if (filters.categorias.length > 0) {
      result = result.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (p) => p.tipo && filters.categorias.includes(p.tipo as any)
      );
    }

    // Location filter
    if (filters.ubicaciones.length > 0) {
      result = result.filter((p) =>
        p.ubicaciones?.some((loc) => filters.ubicaciones.includes(loc))
      );
    }

    return result;
  }, [data, searchTerm, filters]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filters]);

  const canAjustar = usePermission('inventario:ajustar_stock');
  const canCrear = usePermission('inventario:crear');
  const canGestionarUbicaciones = usePermission(
    'inventario:gestionar_ubicaciones'
  );

  const columns: Column<InventarioPorProducto>[] = [
    { id: 'nombre', label: 'Producto' },
    {
      id: 'tipo',
      label: 'Tipo',
      render: (row) =>
        row.tipo ? (
          <StatusChip status={row.tipo} variant="outlined" size="small" />
        ) : (
          '—'
        ),
      hideOnMobile: true,
    },
    {
      id: 'cantidadTotal',
      label: 'Stock Total',
      align: 'right',
      render: (row) =>
        row.unidad
          ? `${Number(row.cantidadTotal).toFixed(2)} ${row.unidad}`
          : String(row.cantidadTotal),
    },
    {
      id: 'cantidadMinima',
      label: 'Mínimo',
      align: 'right',
      render: (row) =>
        row.unidad
          ? `${Number(row.cantidadMinima).toFixed(2)} ${row.unidad}`
          : String(row.cantidadMinima),
      hideOnMobile: true,
    },
    {
      id: 'bajoStock',
      label: 'Estado',
      render: (row) =>
        row.bajoStock ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <WarningAmberOutlinedIcon color="warning" fontSize="small" />
            <Typography variant="body2" color="warning.main">
              Bajo stock
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            OK
          </Typography>
        ),
    },
    {
      id: 'proveedores',
      label: 'Proveedores',
      render: (row) => row.proveedores?.join(', ') ?? '—',
      hideOnMobile: true,
    },
    {
      id: 'ubicaciones',
      label: 'Ubicaciones',
      render: (row) => row.ubicaciones?.join(', ') ?? '—',
      hideOnMobile: true,
    },
    {
      id: 'acciones',
      label: 'Acciones',
      align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Tooltip title="Ver Detalles y Lotes">
            <IconButton
              size="small"
              color="primary"
              onClick={() => {
                setSelectedProductId(row.productoId);
                setDetailMode('view');
                setDetailModalOpen(true);
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {canAjustar && (
            <Tooltip title="Auditar / Conciliar Stock">
              <IconButton
                size="small"
                color="secondary"
                onClick={() => {
                  setSelectedProductId(row.productoId);
                  setDetailMode('audit');
                  setDetailModalOpen(true);
                }}
              >
                <SyncAltIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <PageToolbar
        title="Inventario por Producto"
        searchValue={searchTerm}
        onSearchChange={(v) => {
          setSearchTerm(v);
          setPage(1);
        }}
        searchPlaceholder="Buscar por producto, tipo, proveedor o ubicación..."
        searchId="search-inventario"
        totalItems={totalItems}
        totalItemsLabel="productos"
        primaryAction={
          canCrear
            ? {
                label: 'Añadir al inventario',
                onClick: handleOpenCreate,
                icon: <AddIcon />,
                id: 'btn-add-inventario',
              }
            : undefined
        }
        secondaryAction={
          canGestionarUbicaciones
            ? {
                label: 'Gestionar Ubicaciones',
                onClick: () => setIsUbicacionesModalOpen(true),
                icon: <SettingsIcon />,
                id: 'btn-manage-locations',
              }
            : undefined
        }
        onViewModeChange={undefined}
        filters={
          <Box width="100%">
            <InventarioFilters
              filters={filters}
              onChange={(newFilters) => {
                setFilters(newFilters);
                setPage(1);
              }}
              ubicacionesDisponibles={ubicaciones}
            />
          </Box>
        }
        onScanBarcode={() => setIsSearchScannerOpen(true)}
      />

      <BarcodeScanner
        open={isSearchScannerOpen}
        onClose={() => setIsSearchScannerOpen(false)}
        onScan={(code) => {
          setSearchTerm(code);
          setPage(1);
        }}
        title="Escanear Producto para Buscar"
      />

      <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <DataTable
          columns={columns}
          data={filteredData.slice((page - 1) * pageSize, page * pageSize)}
          isLoading={isLoading}
          hideTopBar
          emptyStateMessage={
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <InventoryOutlinedIcon
                sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {searchTerm.trim() ||
                filters.categorias.length > 0 ||
                filters.ubicaciones.length > 0
                  ? 'No hay productos que coincidan con tu búsqueda o filtros'
                  : 'No hay stock en inventario'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchTerm.trim() ||
                filters.categorias.length > 0 ||
                filters.ubicaciones.length > 0
                  ? 'Prueba con otros términos o limpia los filtros.'
                  : 'Registra recepciones o crea entradas de inventario para ver el stock.'}
              </Typography>
            </Box>
          }
          pagination={{
            currentPage: page,
            totalPages: Math.ceil(filteredData.length / pageSize) || 1,
            onPageChange: (_, newPage) => setPage(newPage),
            pageSize: pageSize,
            pageSizeOptions: [5, 10, 25, 50],
            onPageSizeChange: (e: SelectChangeEvent<number>) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            },
          }}
        />

        <Dialog
          open={isCreateOpen}
          onClose={handleCloseCreate}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Añadir producto al inventario</DialogTitle>
          <DialogContent dividers>
            <Box display="flex" flexDirection="column" gap={2} mt={1}>
              <Autocomplete
                options={productoProveedorOptions}
                value={productoProveedorValue}
                inputValue={productoProveedorInput}
                onInputChange={(_, newInput) =>
                  setProductoProveedorInput(newInput)
                }
                onChange={(_, newValue) => setProductoProveedorValue(newValue)}
                getOptionLabel={(o) => o.label}
                loading={isSearchingProductoProveedor}
                filterOptions={(x) => x} // sin filtrado local
                noOptionsText={
                  productoProveedorInput.trim().length < 2
                    ? 'Escribe al menos 2 caracteres para buscar…'
                    : 'Sin resultados'
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Producto / Proveedor"
                    placeholder="Buscar producto o proveedor…"
                    fullWidth
                    required
                    error={
                      !productoProveedorValue &&
                      productoProveedorInput.length > 0
                    }
                    helperText={
                      !productoProveedorValue &&
                      productoProveedorInput.length > 0
                        ? 'Debes seleccionar una opción válida'
                        : undefined
                    }
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isSearchingProductoProveedor ? (
                            <CircularProgress color="inherit" size={18} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />

              <Box display="flex" gap={2} flexWrap="wrap">
                <TextField
                  label="Cantidad actual"
                  type="number"
                  value={cantidadActual}
                  onChange={(e) => setCantidadActual(e.target.value)}
                  inputProps={{ min: 0, step: 'any' }}
                  required
                  error={
                    cantidadActual !== '' &&
                    (Number.isNaN(cantActualNum) || cantActualNum < 0)
                  }
                  helperText={
                    cantidadActual !== '' &&
                    (Number.isNaN(cantActualNum) || cantActualNum < 0)
                      ? 'Debe ser un número ≥ 0'
                      : undefined
                  }
                  fullWidth
                />
                <TextField
                  label="Cantidad mínima"
                  type="number"
                  value={cantidadMinima}
                  onChange={(e) => setCantidadMinima(e.target.value)}
                  inputProps={{ min: 0, step: 'any' }}
                  required
                  error={
                    cantidadMinima !== '' &&
                    (Number.isNaN(cantMinNum) || cantMinNum < 0)
                  }
                  helperText={
                    cantidadMinima !== '' &&
                    (Number.isNaN(cantMinNum) || cantMinNum < 0)
                      ? 'Debe ser un número ≥ 0'
                      : undefined
                  }
                  fullWidth
                />
              </Box>

              <Box display="flex" gap={2} flexWrap="wrap">
                <TextField
                  label="Cantidad máxima (opcional)"
                  type="number"
                  value={cantidadMaxima}
                  onChange={(e) => setCantidadMaxima(e.target.value)}
                  inputProps={{ min: 0, step: 'any' }}
                  error={
                    cantidadMaxima !== '' &&
                    cantMaxNum !== undefined &&
                    (Number.isNaN(cantMaxNum) ||
                      cantMaxNum < 0 ||
                      (cantMinNum !== undefined && cantMaxNum < cantMinNum))
                  }
                  helperText={
                    cantidadMaxima !== '' &&
                    cantMaxNum !== undefined &&
                    (Number.isNaN(cantMaxNum) || cantMaxNum < 0
                      ? 'Debe ser un número ≥ 0'
                      : cantMaxNum < cantMinNum
                        ? 'No puede ser menor que la mínima'
                        : undefined)
                  }
                  fullWidth
                />
                <TextField
                  select
                  label="Ubicación de almacén"
                  value={ubicacionId}
                  onChange={(e) => setUbicacionId(e.target.value)}
                  fullWidth
                  required
                >
                  {ubicaciones.map((loc) => (
                    <MenuItem key={loc.id} value={loc.id}>
                      {loc.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <TextField
                label="Fecha de caducidad (opcional)"
                type="date"
                value={fechaCaducidad}
                onChange={(e) => setFechaCaducidad(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCreate} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateInventario}
              variant="contained"
              disabled={isSaving || !isFormValid}
            >
              Guardar
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
      <UbicacionesModal
        open={isUbicacionesModalOpen}
        onClose={() => setIsUbicacionesModalOpen(false)}
        onChanged={loadUbicaciones}
      />

      <InventoryDetailModal
        open={detailModalOpen}
        mode={detailMode}
        productoId={selectedProductId}
        items={rawItems}
        onClose={() => setDetailModalOpen(false)}
        onRefreshItem={reloadInventario}
      />
    </Box>
  );
};

export default Inventario;
