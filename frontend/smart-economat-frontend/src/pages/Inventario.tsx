import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
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
  InventarioPorProducto,
  LocalInventario,
} from '../services/inventario.types';
import { localInventarioValues } from '../services/inventario.types';
import { useToast } from '../store/ToastContext';
import {
  searchProductoProveedor,
  type ProductoProveedorOption,
} from '../services/productoProveedor.service';

import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import SearchIcon from '@mui/icons-material/SearchOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';

const Inventario: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState<InventarioPorProducto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  const [ubicacionAlmacen, setUbicacionAlmacen] = useState<LocalInventario>(
    localInventarioValues[0]
  );
  const [fechaCaducidad, setFechaCaducidad] = useState('');

  const toast = useToast();

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchInventario()
      .then((items) => {
        const agregado = agregarInventarioPorProducto(items);
        setData(agregado);
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
      const agregado = agregarInventarioPorProducto(items);
      setData(agregado);
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
        ubicacionAlmacen,
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
      setUbicacionAlmacen('Almacen A');
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
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = normalize(searchTerm.trim());
    return data.filter((p) => {
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
  }, [data, searchTerm]);

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
  ];

  return (
    <Box>
      <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 } }}>
        <Box
          mb={3}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={2}
        >
          <Box>
            <Typography variant="h6">Inventario por Producto</Typography>
            <Typography variant="body2" color="text.secondary">
              Stock agregado por producto (suma de todos los lotes y
              proveedores).
            </Typography>
          </Box>
          <Box>
            <Button
              variant="contained"
              onClick={handleOpenCreate}
              sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
            >
              Añadir al inventario
            </Button>
            <IconButton
              color="primary"
              onClick={handleOpenCreate}
              sx={{
                display: { xs: 'inline-flex', sm: 'none' },
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
              }}
              aria-label="Añadir al inventario"
            >
              <InventoryOutlinedIcon />
            </IconButton>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          placeholder="Buscar por producto, tipo, proveedor o ubicación..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          size="small"
          sx={{ mb: 2, width: '100%', maxWidth: 400 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />

        <DataTable
          columns={columns}
          data={filteredData.slice((page - 1) * pageSize, page * pageSize)}
          isLoading={isLoading}
          emptyStateMessage={
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <InventoryOutlinedIcon
                sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {searchTerm.trim()
                  ? 'No hay productos que coincidan con tu búsqueda'
                  : 'No hay stock en inventario'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchTerm.trim()
                  ? 'Prueba con otros términos o limpia el filtro.'
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
            onPageSizeChange: (e) => {
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
                  value={ubicacionAlmacen}
                  onChange={(e) =>
                    setUbicacionAlmacen(e.target.value as LocalInventario)
                  }
                  fullWidth
                >
                  {localInventarioValues.map((loc) => (
                    <MenuItem key={loc} value={loc}>
                      {loc}
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
    </Box>
  );
};

export default Inventario;
