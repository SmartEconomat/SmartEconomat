import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Tabs,
  Tab,
  useTheme,
  alpha,
} from '@mui/material';
import { Autocomplete, CircularProgress } from '@mui/material';
import DataTable, { Column } from '../components/ui/DataTable';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import DynamicFormModal, {
  DynamicField,
} from '../components/ui/DynamicFormModal';
import StatusChip from '../components/ui/StatusChip';
import {
  fetchInventario,
  agregarInventarioPorProducto,
  createInventarioItem,
} from '../services/inventario.service';
import {
  createProducto,
  getProductoByBarcode,
} from '../services/producto.service';
import type { Proveedor } from '../services/proveedor.types';
import type {
  InventarioItem,
  InventarioPorProducto,
} from '../services/inventario.types';
import {
  CategoriaProducto,
  UnidadMedida,
  normalizeUnidadMedida,
} from '../services/producto.types';
import { UbicacionService } from '../services/ubicacion.service';
import type { Ubicacion } from '../services/ubicacion.types';
import { fetchProveedores } from '../services/proveedor.service';
import UbicacionesModal from '../components/inventario/UbicacionesModal';
import InventoryDetailModal from '../components/inventario/InventoryDetailModal';
import { useToast } from '../store/toast.hooks';
import { useAuth, usePermission } from '../store/auth.hooks';
import { isElevatedRole } from '../sherlock-auth/permissions';
import { PERMISSIONS } from '../sherlock-auth/permissions.constants';
import { profesorService } from '../services/profesor.service';
import {
  searchProductoProveedor,
  type ProductoProveedorOption,
} from '../services/productoProveedor.service';
import { searchByBarcode } from '../services/openfoodfacts.service';

import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import HomeWorkOutlinedIcon from '@mui/icons-material/HomeWorkOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';

import PageToolbar from '../components/ui/PageToolbar';
import BarcodeScanner from '../components/ui/BarcodeScanner';
import InventarioFilters, {
  InventarioFiltersState,
} from '../features/inventario/InventarioFilters';
import { useTranslation } from 'react-i18next';
import { getEnumLabel } from '../i18n/enumPresentation';

const initialFilters: InventarioFiltersState = {
  categorias: [],
  ubicaciones: [],
};

const MEASURABLE_STOCK_UNITS = new Set<UnidadMedida>([
  UnidadMedida.KG,
  UnidadMedida.G,
  UnidadMedida.L,
  UnidadMedida.ML,
]);

const formatStockUnits = (value: number): string =>
  `${(Number(value) || 0).toFixed(2)} uds`;

const formatEquivalentAmount = (value: number, unit: UnidadMedida): string => {
  if (unit === UnidadMedida.ML && Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(2)} ${UnidadMedida.L}`;
  }

  if (unit === UnidadMedida.G && Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(2)} ${UnidadMedida.KG}`;
  }

  return `${value.toFixed(2)} ${unit}`;
};

const formatEquivalentByConstruction = (
  cantidadUnidades: number,
  contenidoPorUnidad?: number,
  unidad?: string
): string | null => {
  const normalizedUnit = normalizeUnidadMedida(unidad);
  if (!normalizedUnit || !MEASURABLE_STOCK_UNITS.has(normalizedUnit)) {
    return null;
  }

  if (!contenidoPorUnidad || !Number.isFinite(contenidoPorUnidad)) {
    return null;
  }

  const totalContenido = cantidadUnidades * contenidoPorUnidad;
  return `≈ ${formatEquivalentAmount(totalContenido, normalizedUnit)}`;
};

interface ProductoFormProveedor {
  proveedorId: string;
  nombre?: string;
  marca?: string;
  codigoBarras?: string;
  precioUnitario?: number | string;
}

interface ProductoFormData extends Record<string, unknown> {
  nombre?: string;
  marca?: string;
  descripcion?: string;
  unidad?: string;
  tipo?: CategoriaProducto;
  contenido?: number | string;
  codigoBarras?: string;
  proveedores?: ProductoFormProveedor[];
}

const Inventario: React.FC = () => {
  const { t } = useTranslation();
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
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [isUbicacionesModalOpen, setIsUbicacionesModalOpen] = useState(false);
  const [isSearchScannerOpen, setIsSearchScannerOpen] = useState(false);
  const [isCreateProductoModalOpen, setIsCreateProductoModalOpen] =
    useState(false);
  const [isSavingProducto, setIsSavingProducto] = useState(false);
  const [isPreparingCreateProducto, setIsPreparingCreateProducto] =
    useState(false);
  const [createProductoInitialData, setCreateProductoInitialData] = useState<
    Record<string, unknown>
  >({});
  const [barcodePendienteCrearProducto, setBarcodePendienteCrearProducto] =
    useState<string | null>(null);
  const [
    productoPendienteCantidadInventario,
    setProductoPendienteCantidadInventario,
  ] = useState<{
    barcode: string;
    nombre: string;
  } | null>(null);
  const [cantidadEscaneo, setCantidadEscaneo] = useState('1');
  const [isCantidadDialogOpen, setIsCantidadDialogOpen] = useState(false);
  const [isAddingFromScanner, setIsAddingFromScanner] = useState(false);

  const theme = useTheme();
  const toast = useToast();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const hasDashboardFilter = searchParams.get('filter') === 'stockBajo';

  const clearDashboardFilter = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('filter');
    setSearchParams(nextParams, { replace: true });
  };
  const isAdmin = isElevatedRole(user?.rol);
  const canSeeGeneral =
    isAdmin || user?.permisos?.includes(PERMISSIONS.inventario.listar);

  const [tabIndex, setTabIndex] = useState(isAdmin ? 1 : 0);
  const [assignedLocations, setAssignedLocations] = useState<
    { id: string; nombre: string }[]
  >([]);
  const [isLocationsLoading, setIsLocationsLoading] = useState(false);
  const canAjustar = usePermission(PERMISSIONS.inventario.ajustar_stock);
  const canCrear = usePermission(PERMISSIONS.inventario.crear);
  const canGestionarUbicaciones = usePermission(PERMISSIONS.ubicaciones.editar);
  const canCrearProducto = usePermission(PERMISSIONS.productos.crear);

  const loadUbicaciones = useCallback(async (): Promise<Ubicacion[]> => {
    try {
      const data = await UbicacionService.findAll();
      const ubicacionesList = Array.isArray(data) ? data : [];
      setUbicaciones(ubicacionesList);
      if (ubicacionesList.length > 0) {
        setUbicacionId((prev) => prev || ubicacionesList[0].id);
      }
      return ubicacionesList;
    } catch {
      toast.error(t('inventario.errors.cargarUbicaciones'));
      return [];
    }
  }, [toast, t]);

  useEffect(() => {
    void loadUbicaciones();
  }, [loadUbicaciones]);

  const loadAssignedLocations = useCallback(async () => {
    if (!user) return;
    setIsLocationsLoading(true);
    try {
      // Si es profesor o tiene slots asignados
      const response = await profesorService.getSlots();
      const profLocations =
        response.status === 200 && response.data
          ? (response.data
              .map((slot) => ({
                id: slot.ubicacionId,
                nombre:
                  slot.ubicacion?.nombre ||
                  slot.aula ||
                  t('inventario.ubicacionDesconocida'),
              }))
              .filter((loc) => !!loc.id) as { id: string; nombre: string }[])
          : [];

      // También incluimos la ubicación directa del perfil del usuario si existe
      if (user.ubicacionId) {
        const fullList = await UbicacionService.findAll();
        const profileLoc = fullList.find((l) => l.id === user.ubicacionId);
        if (profileLoc && !profLocations.some((l) => l.id === profileLoc.id)) {
          profLocations.push({ id: profileLoc.id, nombre: profileLoc.nombre });
        }
      }

      setAssignedLocations(profLocations);
    } catch (err) {
      console.error('Error al cargar ubicaciones asignadas:', err);
    } finally {
      setIsLocationsLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    void loadUbicaciones();
    void loadAssignedLocations();
  }, [loadUbicaciones, loadAssignedLocations]);

  // Eliminado el useEffect inicial redundante que ya maneja reloadInventario con tabIndex

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

    const timeoutId = window.setTimeout(() => {
      searchProductoProveedor(term, 20, 0)
        .then((opts) => {
          if (!cancelled) setProductoProveedorOptions(opts);
        })
        .catch((err: unknown) => {
          console.error('Error buscando producto/proveedor:', err);
          if (!cancelled)
            toast.error(t('inventario.errors.buscarProductoProveedor'));
        })
        .finally(() => {
          if (!cancelled) setIsSearchingProductoProveedor(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [isCreateOpen, productoProveedorInput, toast, t]);

  const handleOpenCreate = () => {
    setIsCreateOpen(true);
    if (ubicaciones.length === 0) {
      void loadUbicaciones();
    }
  };

  const handleOpenSearchScanner = useCallback(() => {
    setIsSearchScannerOpen(true);
  }, []);

  const handleCloseCreate = () => {
    if (isSaving) return;
    setIsCreateOpen(false);
  };

  const reloadInventario = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await fetchInventario();
      setRawItems(items);
      const itemsToGroup =
        tabIndex === 0
          ? items.filter((item) => {
              const uId = item.ubicacion?.id;
              return uId
                ? assignedLocations.some((loc) => loc.id === uId)
                : false;
            })
          : items;

      const agregado = agregarInventarioPorProducto(itemsToGroup);

      // Aplicar filtro de dashboard si está activo
      const finalData = hasDashboardFilter
        ? agregado.filter((p) => p.bajoStock)
        : agregado;

      setData(finalData);
      setTotalItems(finalData.length);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t('inventario.errors.cargarInventario');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [tabIndex, assignedLocations, hasDashboardFilter, t]);

  useEffect(() => {
    void reloadInventario();
  }, [tabIndex, assignedLocations, canSeeGeneral, reloadInventario]);

  const productoCreateSchema = useMemo<DynamicField[]>(() => {
    const unidadOptions = Object.values(UnidadMedida).map((value) => ({
      value,
      label: value,
    }));
    const categoriaOptions = Object.values(CategoriaProducto).map((value) => ({
      value,
      label: getEnumLabel(t, 'productoCategoria', value),
    }));
    const schema: DynamicField[] = [];
    schema.push({
      name: 'nombre',
      label: t('inventario.form.nombreComercial'),
      required: true,
    });
    schema.push({ name: 'marca', label: t('inventario.form.marca') });
    schema.push({
      name: 'descripcion',
      label: t('inventario.form.descripcion'),
    });
    schema.push({
      name: 'contenido',
      label: t('inventario.form.contenidoNumerico'),
      type: 'number',
      required: true,
    });
    schema.push({
      name: 'unidad',
      label: t('inventario.form.unidadMedida'),
      type: 'select',
      required: true,
      options: unidadOptions,
      width: 6,
    });
    schema.push({
      name: 'tipo',
      label: t('inventario.form.categoria'),
      type: 'select',
      required: true,
      width: 6,
      options: categoriaOptions,
    });
    schema.push({
      name: 'codigoBarras',
      label: t('inventario.form.codigoBarras'),
      type: 'barcode',
    });
    schema.push({
      name: 'proveedores',
      label: t('inventario.form.proveedoresAsociados'),
      type: 'proveedores',
      position: 'bottom',
      required: true,
      defaultValue: [],
      options: proveedores.map((p) => ({ value: p.id, label: p.nombre })),
    });
    return schema;
  }, [proveedores, t]);

  const ensureProveedoresLoaded = useCallback(async (): Promise<void> => {
    if (proveedores.length > 0) return;

    const PAGE_LIMIT = 50;
    const proveedoresResponse = await fetchProveedores(1, PAGE_LIMIT);
    const firstPageProviders = Array.isArray(proveedoresResponse.data)
      ? proveedoresResponse.data
      : [];

    let providers = firstPageProviders;

    if (proveedoresResponse.totalPages > 1) {
      const remainingPages = await Promise.all(
        Array.from({ length: proveedoresResponse.totalPages - 1 }, (_, index) =>
          fetchProveedores(index + 2, PAGE_LIMIT)
        )
      );

      const extraProviders = remainingPages.flatMap((pageResponse) =>
        Array.isArray(pageResponse.data) ? pageResponse.data : []
      );

      providers = [...firstPageProviders, ...extraProviders];
    }

    const uniqueProviders = providers.filter(
      (provider, index, self) =>
        self.findIndex((item) => item.id === provider.id) === index
    );

    if (uniqueProviders.length === 0) {
      throw new Error(
        'No hay proveedores disponibles. Crea al menos uno antes de dar de alta un producto.'
      );
    }

    setProveedores(uniqueProviders);
  }, [proveedores]);

  const buildCreateProductDraft = useCallback(async (barcode: string) => {
    const offData = await searchByBarcode(barcode);

    return {
      nombre: offData?.name || '',
      marca: offData?.brand || '',
      descripcion: offData?.description || '',
      unidad: normalizeUnidadMedida(offData?.uom) || UnidadMedida.UNIDAD,
      tipo: CategoriaProducto.OTRO,
      contenido: offData?.quantity ?? 1,
      codigoBarras: barcode,
      proveedores: [],
    };
  }, []);

  const handleBarcodeFetch = useCallback(async (code: string) => {
    const offData = await searchByBarcode(code);
    if (!offData) return;

    return {
      nombre: offData.name || '',
      marca: offData.brand || '',
      descripcion: offData.description || '',
      unidad: normalizeUnidadMedida(offData.uom) || UnidadMedida.UNIDAD,
      contenido: offData.quantity ?? 1,
    };
  }, []);

  const openCreateProductModalFromBarcode = useCallback(
    async (barcode: string): Promise<boolean> => {
      try {
        await ensureProveedoresLoaded();
        const draft = await buildCreateProductDraft(barcode);
        setCreateProductoInitialData(draft);
        setIsCreateProductoModalOpen(true);
        return true;
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'No se pudo preparar el formulario de alta de producto.';
        toast.error(message);
        return false;
      }
    },
    [buildCreateProductDraft, ensureProveedoresLoaded, toast]
  );

  const handleConfirmCreateProductoFromScanner = useCallback(async () => {
    if (!barcodePendienteCrearProducto) return;

    setIsPreparingCreateProducto(true);
    try {
      const wasOpened = await openCreateProductModalFromBarcode(
        barcodePendienteCrearProducto
      );
      if (wasOpened) {
        setBarcodePendienteCrearProducto(null);
      }
    } finally {
      setIsPreparingCreateProducto(false);
    }
  }, [barcodePendienteCrearProducto, openCreateProductModalFromBarcode]);

  const openCantidadDialogForProduct = useCallback(
    (producto: { barcode: string; nombre: string }) => {
      setProductoPendienteCantidadInventario(producto);
      setCantidadEscaneo('1');
      setIsCantidadDialogOpen(true);
    },
    []
  );

  const openInventarioCreateForProduct = useCallback(
    async (
      producto: { barcode: string; nombre: string },
      initialCantidad?: number,
      preloadedOptions?: ProductoProveedorOption[]
    ) => {
      const query = (producto.barcode || producto.nombre).trim();

      setIsCreateOpen(true);
      if (ubicaciones.length === 0) {
        await loadUbicaciones();
      }

      setProductoProveedorValue(null);
      setProductoProveedorInput(query);
      if (initialCantidad !== undefined) {
        setCantidadActual(String(initialCantidad));
        setCantidadMinima('0');
        setCantidadMaxima('');
      }

      if (query.length < 2 && !preloadedOptions) {
        return;
      }

      setIsSearchingProductoProveedor(true);
      try {
        const options =
          preloadedOptions ?? (await searchProductoProveedor(query, 20, 0));
        setProductoProveedorOptions(options);

        const exactByBarcode = producto.barcode
          ? options.find(
              (option) =>
                option.codigoBarras?.trim() === producto.barcode.trim()
            )
          : undefined;

        if (exactByBarcode) {
          setProductoProveedorValue(exactByBarcode);
        } else if (options.length === 1) {
          setProductoProveedorValue(options[0]);
        }

        if (options.length === 0) {
          toast.info(t('inventario.toast.relacionNoExiste'));
        }
      } catch (err: unknown) {
        console.error('Error preparando alta en inventario:', err);
        toast.error(t('inventario.toast.errorAltaInventario'));
      } finally {
        setIsSearchingProductoProveedor(false);
      }
    },
    [loadUbicaciones, toast, ubicaciones.length, t]
  );

  const handleCreateProductoDesdeInventario = async (
    formData: Record<string, unknown>
  ) => {
    setIsSavingProducto(true);

    try {
      const typedFormData = formData as ProductoFormData;
      const toOptionalString = (value: unknown): string | undefined => {
        if (value == null) return undefined;
        const trimmed = String(value).trim();
        return trimmed !== '' ? trimmed : undefined;
      };

      const nombre = toOptionalString(typedFormData.nombre);
      if (!nombre) {
        throw new Error(t('inventario.crearProductoValidacion.nombreObligatorio'));
      }

      const contenido = Number(typedFormData.contenido);
      if (Number.isNaN(contenido) || contenido <= 0) {
        throw new Error(t('inventario.crearProductoValidacion.contenidoInvalido'));
      }

      const unidad = normalizeUnidadMedida(
        toOptionalString(typedFormData.unidad)
      );
      if (!unidad) {
        throw new Error(t('inventario.crearProductoValidacion.unidadInvalida'));
      }

      const proveedoresForm = Array.isArray(typedFormData.proveedores)
        ? typedFormData.proveedores
        : [];

      const proveedoresPayload = proveedoresForm
        .filter(
          (proveedor) =>
            typeof proveedor.proveedorId === 'string' &&
            proveedor.proveedorId.trim() !== ''
        )
        .map((proveedor) => {
          const precioNormalizado = Number(proveedor.precioUnitario);
          return {
            proveedorId: proveedor.proveedorId.trim(),
            marcaEspecifica: toOptionalString(proveedor.marca),
            codigoBarras: toOptionalString(proveedor.codigoBarras),
            precioUnitario: precioNormalizado,
          };
        });

      if (proveedoresPayload.length === 0) {
        throw new Error(
          t('inventario.crearProductoValidacion.alMenosUnProveedor')
        );
      }

      if (
        proveedoresPayload.some(
          (proveedor) =>
            Number.isNaN(proveedor.precioUnitario) ||
            proveedor.precioUnitario < 0
        )
      ) {
        throw new Error(
          t('inventario.crearProductoValidacion.precioProveedorInvalido')
        );
      }

      const tipo =
        typeof typedFormData.tipo === 'string'
          ? (typedFormData.tipo as CategoriaProducto)
          : CategoriaProducto.OTRO;

      const codigoBarras = toOptionalString(typedFormData.codigoBarras);

      const creado = await createProducto({
        nombre,
        marca: toOptionalString(typedFormData.marca),
        descripcion: toOptionalString(typedFormData.descripcion),
        unidad,
        tipo,
        contenido,
        codigoBarras,
        proveedores: proveedoresPayload,
      });

      setIsCreateProductoModalOpen(false);
      setCreateProductoInitialData({});
      toast.success(t('inventario.toast.productoCreado'));

      if (canCrear) {
        openCantidadDialogForProduct({
          barcode: creado.codigoBarras || codigoBarras || '',
          nombre: creado.nombre,
        });
      } else {
        toast.info(t('inventario.toast.sinPermisosInventario'));
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('inventario.toast.errorCrearProducto');
      toast.error(message);
    } finally {
      setIsSavingProducto(false);
    }
  };

  const handleSearchScannerResult = useCallback(
    async (rawCode: string) => {
      const code = rawCode.trim();
      if (!code) return;

      setSearchTerm(code);
      setPage(1);

      const existsInInventory = data.some(
        (item) => item.codigoBarras?.trim() === code
      );

      if (existsInInventory) {
        toast.success(t('inventario.toast.productLocalizadoInventario'));
        return;
      }

      try {
        const existingProduct = await getProductoByBarcode(code);

        if (existingProduct) {
          if (canCrear) {
            openCantidadDialogForProduct({
              barcode: code,
              nombre: existingProduct.nombre,
            });
            toast.info(t('inventario.toast.productoEnCatalogo'));
          } else {
            toast.info(t('inventario.toast.productoEnCatalogoSinPermisos'));
          }
          return;
        }
      } catch (err: unknown) {
        console.error('Error comprobando producto escaneado:', err);
      }

      if (!canCrearProducto) {
        toast.info(t('inventario.toast.codigoNoExisteSinPermisos'));
        return;
      }

      setBarcodePendienteCrearProducto(code);
    },
    [canCrear, canCrearProducto, data, openCantidadDialogForProduct, toast, t]
  );

  const handleConfirmCantidadScanner = async () => {
    const producto = productoPendienteCantidadInventario;
    if (!producto) return;

    const cantidad = Number(cantidadEscaneo);
    if (Number.isNaN(cantidad) || cantidad <= 0) {
      toast.error(t('inventario.toast.cantidadInvalida'));
      return;
    }

    if (!canCrear) {
      toast.info(t('inventario.toast.sinPermisos'));
      setIsCantidadDialogOpen(false);
      setProductoPendienteCantidadInventario(null);
      setCantidadEscaneo('1');
      return;
    }

    setIsAddingFromScanner(true);
    try {
      const ubicacionesDisponibles =
        ubicaciones.length > 0 ? ubicaciones : await loadUbicaciones();
      const ubicacionDestinoId = ubicacionId || ubicacionesDisponibles[0]?.id;

      if (!ubicacionDestinoId) {
        throw new Error(t('inventario.toast.sinUbicaciones'));
      }

      const query = (producto.barcode || producto.nombre).trim();
      const options = await searchProductoProveedor(query, 20, 0);
      const exactByBarcode = producto.barcode
        ? options.find(
            (option) => option.codigoBarras?.trim() === producto.barcode.trim()
          )
        : undefined;
      const selectedOption =
        exactByBarcode || (options.length === 1 ? options[0] : null);

      if (!selectedOption) {
        setIsCantidadDialogOpen(false);
        setProductoPendienteCantidadInventario(null);
        setCantidadEscaneo('1');

        if (options.length === 0) {
          toast.error(t('inventario.toast.relacionNoExiste'));
          return;
        }

        toast.info(t('inventario.toast.variasRelaciones'));
        void openInventarioCreateForProduct(producto, cantidad, options);
        return;
      }

      await createInventarioItem({
        productoProveedorId: selectedOption.id,
        cantidadActual: cantidad,
        cantidadMinima: 0,
        ubicacionId: ubicacionDestinoId,
      });

      toast.success(
        t('inventario.toast.stockAñadido', { nombre: producto.nombre })
      );
      setIsCantidadDialogOpen(false);
      setProductoPendienteCantidadInventario(null);
      setCantidadEscaneo('1');
      await reloadInventario();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t('inventario.toast.errorInventario');
      toast.error(message);
    } finally {
      setIsAddingFromScanner(false);
    }
  };

  const handleCreateInventario = async () => {
    if (!productoProveedorValue?.id) {
      toast.error(t('inventario.toast.seleccionaProducto'));
      return;
    }
    const cantActual = Number(cantidadActual);
    const cantMin = Number(cantidadMinima);
    const cantMax = cantidadMaxima ? Number(cantidadMaxima) : undefined;
    if (Number.isNaN(cantActual) || cantActual < 0) {
      toast.error(t('inventario.toast.cantActualInvalida'));
      return;
    }
    if (Number.isNaN(cantMin) || cantMin < 0) {
      toast.error(t('inventario.toast.cantMinInvalida'));
      return;
    }
    if (cantMax !== undefined && (Number.isNaN(cantMax) || cantMax < 0)) {
      toast.error(t('inventario.toast.cantMaxInvalida'));
      return;
    }

    // max must be >= min when provided
    if (cantMax !== undefined && cantMax < cantMin) {
      toast.error(t('inventario.toast.cantMaxMenorMin'));
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
      toast.success(t('inventario.toast.inventarioCreado'));
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
          : t('inventario.toast.errorCrearInventario');
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  // form validation helpers (used to enable/disable save button and show inline errors)
  const cantActualNum = Number(cantidadActual);
  const cantMinNum = Number(cantidadMinima);
  const cantMaxNum = cantidadMaxima ? Number(cantidadMaxima) : undefined;
  const cantidadEscaneoNum = Number(cantidadEscaneo);
  const isCantidadEscaneoValida =
    !Number.isNaN(cantidadEscaneoNum) && cantidadEscaneoNum > 0;
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
        const codigo = normalize(p.codigoBarras ?? '');
        const tipo = normalize(p.tipo ?? '');
        const provs = (p.proveedores ?? []).map(normalize).join(' ');
        const ubicaciones = (p.ubicaciones ?? []).map(normalize).join(' ');
        return (
          nombre.includes(term) ||
          codigo.includes(term) ||
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

  const columns: Column<InventarioPorProducto>[] = [
    { id: 'nombre', label: t('inventario.columns.producto') },
    {
      id: 'tipo',
      label: t('inventario.columns.tipo'),
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
      label: t('inventario.columns.stockTotal'),
      align: 'right',
      render: (row) => {
        const equivalente = formatEquivalentByConstruction(
          row.cantidadTotal,
          row.contenidoPorUnidad,
          row.unidad
        );

        return (
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" fontWeight={500}>
              {formatStockUnits(row.cantidadTotal)}
            </Typography>
            {equivalente ? (
              <Typography variant="caption" color="text.secondary">
                {equivalente}
              </Typography>
            ) : null}
          </Box>
        );
      },
    },
    {
      id: 'cantidadMinima',
      label: t('inventario.columns.minimo'),
      align: 'right',
      render: (row) => {
        const equivalente = formatEquivalentByConstruction(
          row.cantidadMinima,
          row.contenidoPorUnidad,
          row.unidad
        );

        return (
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" fontWeight={500}>
              {formatStockUnits(row.cantidadMinima)}
            </Typography>
            {equivalente ? (
              <Typography variant="caption" color="text.secondary">
                {equivalente}
              </Typography>
            ) : null}
          </Box>
        );
      },
      hideOnMobile: true,
    },
    {
      id: 'bajoStock',
      label: t('inventario.columns.estado'),
      render: (row) =>
        row.bajoStock ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <WarningAmberOutlinedIcon color="warning" fontSize="small" />
            <Typography variant="body2" color="warning.main">
              {t('inventario.status.bajoStock')}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {t('inventario.status.ok')}
          </Typography>
        ),
    },
    {
      id: 'proveedores',
      label: t('inventario.columns.proveedores'),
      render: (row) => row.proveedores?.join(', ') ?? '—',
      hideOnMobile: true,
    },
    {
      id: 'ubicaciones',
      label: t('inventario.columns.ubicaciones'),
      render: (row) => row.ubicaciones?.join(', ') ?? '—',
      hideOnMobile: true,
    },
    {
      id: 'acciones',
      label: t('inventario.columns.acciones'),
      align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Tooltip title={t('inventario.actions.verDetalleLotes')}>
            <IconButton
              size="small"
              color="primary"
              id="btn-ver-detalle-stock"
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
            <Tooltip title={t('inventario.actions.auditarStock')}>
              <IconButton
                size="small"
                color="secondary"
                id="btn-ajustar-stock"
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
        id="inventario-toolbar"
        title={t('inventario.titulo')}
        searchValue={searchTerm}
        onSearchChange={(v) => {
          setSearchTerm(v);
          setPage(1);
        }}
        searchPlaceholder={t('inventario.buscar')}
        searchId="search-inventario"
        autoFocusSearch={true}
        totalItems={totalItems}
        totalItemsLabel={t('inventario.totalItemsLabel')}
        primaryAction={
          canCrear
            ? {
                label: t('inventario.actions.anadirInventario'),
                onClick: handleOpenCreate,
                icon: <AddIcon />,
                id: 'btn-add-inventario',
              }
            : undefined
        }
        secondaryAction={
          canGestionarUbicaciones
            ? {
                label: t('inventario.actions.gestionarUbicaciones'),
                onClick: () => setIsUbicacionesModalOpen(true),
                icon: <SettingsIcon />,
                id: 'btn-manage-locations',
              }
            : undefined
        }
        onViewModeChange={undefined}
        filters={
          <Box width="100%" id="inventario-filters">
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
        onScanBarcode={handleOpenSearchScanner}
      />

      <BarcodeScanner
        open={isSearchScannerOpen}
        onClose={() => setIsSearchScannerOpen(false)}
        onScan={(code) => {
          void handleSearchScannerResult(code);
        }}
        title={t('inventario.scanner.titulo')}
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
            id="inventario-tabs"
            value={tabIndex}
            onChange={(_, v) => {
              setTabIndex(v);
              setPage(1);
            }}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
            aria-label={t('inventario.tabs.ariaLabel')}
          >
            <Tab
              icon={<HomeWorkOutlinedIcon />}
              label={t('inventario.tabs.misUbicaciones')}
            />
            {canSeeGeneral && (
              <Tab
                icon={<Inventory2OutlinedIcon />}
                label={t('inventario.tabs.general')}
              />
            )}
          </Tabs>
        </Box>

        <Box sx={{ p: { xs: 2, sm: 4 } }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {hasDashboardFilter && (
            <Alert
              severity="warning"
              icon={<FilterListIcon />}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={clearDashboardFilter}
                  startIcon={<ClearIcon />}
                  sx={{ fontWeight: 700 }}
                >
                  {t('inventario.filters.quitar')}
                </Button>
              }
              sx={{
                mb: 3,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                border: '1px solid',
                borderColor: alpha(theme.palette.warning.main, 0.3),
                '& .MuiAlert-message': { fontWeight: 500 },
              }}
            >
              {t('inventario.filters.stockBajoInfo')}
            </Alert>
          )}

          <DataTable
            id="inventario-table"
            columns={columns}
            data={filteredData.slice((page - 1) * pageSize, page * pageSize)}
            isLoading={isLoading || isLocationsLoading}
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
                    ? t('inventario.empty.noMatch')
                    : tabIndex === 0
                      ? assignedLocations.length === 0
                        ? t('inventario.empty.noAssignedLocations')
                        : t('inventario.empty.noStockLocations', {
                            locations: assignedLocations
                              .map((l) => l.nombre)
                              .join(', '),
                          })
                      : t('inventario.empty.noStock')}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  {searchTerm.trim() ||
                  filters.categorias.length > 0 ||
                  filters.ubicaciones.length > 0
                    ? t('inventario.empty.tryOtherTerms')
                    : tabIndex === 0 && assignedLocations.length === 0
                      ? t('inventario.empty.contactAdmin')
                      : t('inventario.empty.registraRecepciones')}
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
            <DialogTitle>{t('inventario.modalCreate.titulo')}</DialogTitle>
            <DialogContent dividers>
              <Box display="flex" flexDirection="column" gap={2} mt={1}>
                <Autocomplete
                  options={productoProveedorOptions}
                  value={productoProveedorValue}
                  inputValue={productoProveedorInput}
                  onInputChange={(_, newInput) =>
                    setProductoProveedorInput(newInput)
                  }
                  onChange={(_, newValue) =>
                    setProductoProveedorValue(newValue)
                  }
                  getOptionLabel={(o) => o.label}
                  loading={isSearchingProductoProveedor}
                  filterOptions={(x) => x} // sin filtrado local
                  noOptionsText={
                    productoProveedorInput.trim().length < 2
                      ? t('inventario.modalCreate.escribe2')
                      : t('inventario.modalCreate.sinResultados')
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t('inventario.modalCreate.productoProveedor')}
                      placeholder={t(
                        'inventario.modalCreate.buscarProductoProveedor'
                      )}
                      fullWidth
                      required
                      error={
                        !productoProveedorValue &&
                        productoProveedorInput.length > 0
                      }
                      helperText={
                        !productoProveedorValue &&
                        productoProveedorInput.length > 0
                          ? t('inventario.modalCreate.opcionValida')
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
                    label={t('inventario.modalCreate.cantidadActual')}
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
                        ? t('inventario.modalCreate.numeroMayorIgualCero')
                        : undefined
                    }
                    fullWidth
                  />
                  <TextField
                    label={t('inventario.modalCreate.cantidadMinima')}
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
                        ? t('inventario.modalCreate.numeroMayorIgualCero')
                        : undefined
                    }
                    fullWidth
                  />
                </Box>

                <Box display="flex" gap={2} flexWrap="wrap">
                  <TextField
                    label={t('inventario.modalCreate.cantidadMaxima')}
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
                        ? t('inventario.modalCreate.numeroMayorIgualCero')
                        : cantMaxNum < cantMinNum
                          ? t('inventario.modalCreate.maxMenorMin')
                          : undefined)
                    }
                    fullWidth
                  />
                  <TextField
                    select
                    label={t('inventario.modalCreate.ubicacion')}
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
                  label={t('inventario.modalCreate.fechaCaducidad')}
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
                {t('comun.cancelar')}
              </Button>
              <Button
                onClick={handleCreateInventario}
                variant="contained"
                disabled={isSaving || !isFormValid}
              >
                {isSaving ? t('comun.guardando') : t('comun.guardar')}
              </Button>
            </DialogActions>
          </Dialog>

          <DynamicFormModal
            isOpen={isCreateProductoModalOpen}
            onClose={() => {
              if (!isSavingProducto) {
                setIsCreateProductoModalOpen(false);
              }
            }}
            title={t('inventario.dialogs.crearProductoTitulo')}
            size="lg"
            fields={productoCreateSchema}
            initialData={createProductoInitialData}
            onSubmit={handleCreateProductoDesdeInventario}
            isSubmitting={isSavingProducto}
            requireConfirmation={true}
            confirmationMessage={t('inventario.dialogs.crearProductoConfirm')}
            onBarcodeFetch={handleBarcodeFetch}
          />

          <ConfirmDialog
            isOpen={!!barcodePendienteCrearProducto}
            onClose={() => {
              if (!isPreparingCreateProducto) {
                setBarcodePendienteCrearProducto(null);
              }
            }}
            onConfirm={() => {
              void handleConfirmCreateProductoFromScanner();
            }}
            onCancel={() => {
              if (!isPreparingCreateProducto) {
                setBarcodePendienteCrearProducto(null);
              }
            }}
            title={t('inventario.confirm.productoNoEncontradoTitulo')}
            message={
              barcodePendienteCrearProducto
                ? t('inventario.confirm.productoNoEncontradoMsg', {
                    codigo: barcodePendienteCrearProducto,
                  })
                : t('inventario.confirm.productoNoEncontradoMsgGeneric')
            }
            confirmText={t('inventario.confirm.siCrear')}
            cancelText={t('inventario.confirm.no')}
            confirmColor="primary"
            confirmVariant="contained"
            isLoading={isPreparingCreateProducto}
          />

          <Dialog
            open={isCantidadDialogOpen}
            onClose={() => {
              if (!isAddingFromScanner) {
                setIsCantidadDialogOpen(false);
                setProductoPendienteCantidadInventario(null);
                setCantidadEscaneo('1');
              }
            }}
            fullWidth
            maxWidth="xs"
          >
            <DialogTitle>
              {t('inventario.dialogs.cantidadAñadirTitulo')}
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {productoPendienteCantidadInventario
                  ? t('inventario.dialogs.cantidadAñadirDesc', {
                      nombre: productoPendienteCantidadInventario.nombre,
                    })
                  : t('inventario.dialogs.cantidadAñadirDescGeneric')}
              </Typography>
              <TextField
                autoFocus
                fullWidth
                label={t('inventario.dialogs.cantidadAñadirLabel')}
                type="number"
                value={cantidadEscaneo}
                onChange={(e) => setCantidadEscaneo(e.target.value)}
                inputProps={{ min: 0.01, step: 'any' }}
                error={cantidadEscaneo !== '' && !isCantidadEscaneoValida}
                helperText={
                  cantidadEscaneo !== '' && !isCantidadEscaneoValida
                    ? t('inventario.dialogs.debeMayorQueCero')
                    : undefined
                }
              />
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => {
                  setIsCantidadDialogOpen(false);
                  setProductoPendienteCantidadInventario(null);
                  setCantidadEscaneo('1');
                }}
                disabled={isAddingFromScanner}
              >
                {t('inventario.dialogs.cancelar')}
              </Button>
              <Button
                onClick={() => {
                  void handleConfirmCantidadScanner();
                }}
                variant="contained"
                disabled={isAddingFromScanner || !isCantidadEscaneoValida}
              >
                {isAddingFromScanner
                  ? t('inventario.dialogs.añadiendo')
                  : t('inventario.dialogs.añadirAlInventario')}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
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
