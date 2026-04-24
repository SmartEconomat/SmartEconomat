import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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

import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';

import PageToolbar from '../components/ui/PageToolbar';
import BarcodeScanner from '../components/ui/BarcodeScanner';
import InventarioFilters, {
  InventarioFiltersState,
} from '../features/inventario/InventarioFilters';

/** Default empty filter state for the inventory page. */
const initialFilters: InventarioFiltersState = {
  categorias: [],
  ubicaciones: [],
};

/** Units of measure that represent a measurable (continuous) quantity. */
const MEASURABLE_STOCK_UNITS = new Set<UnidadMedida>([
  UnidadMedida.KG,
  UnidadMedida.G,
  UnidadMedida.L,
  UnidadMedida.ML,
]);

/**
 * Formats a stock value as a unit string.
 * @param value - The numeric stock value.
 * @returns Formatted string, e.g. "3.00 uds".
 */
const formatStockUnits = (value: number): string =>
  `${(Number(value) || 0).toFixed(2)} uds`;

/**
 * Formats a content amount with its unit, converting to larger units when applicable.
 * @param value - The numeric amount.
 * @param unit - The unit of measure.
 * @returns Formatted string.
 */
const formatEquivalentAmount = (value: number, unit: UnidadMedida): string => {
  if (unit === UnidadMedida.ML && Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(2)} ${UnidadMedida.L}`;
  }

  if (unit === UnidadMedida.G && Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(2)} ${UnidadMedida.KG}`;
  }

  return `${value.toFixed(2)} ${unit}`;
};

/**
 * Builds an equivalent content string from unit count and content-per-unit.
 * Returns null when the unit is not measurable or content data is missing.
 * @param cantidadUnidades - Number of units in stock.
 * @param contenidoPorUnidad - Content per unit (e.g. 250 ml).
 * @param unidad - Raw unit string from the product.
 * @returns Formatted equivalent string or null.
 */
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

/** Shape of a supplier entry within the product creation form. */
interface ProductoFormProveedor {
  proveedorId: string;
  nombre?: string;
  marca?: string;
  codigoBarras?: string;
  precioUnitario?: number | string;
}

/** Shape of all fields in the product creation form. */
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

/**
 * Main Inventario page component.
 * Displays a paginated, filterable table of inventory grouped by product.
 * Supports barcode scanning, inline entry creation, and stock auditing.
 */
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

  const toast = useToast();
  const { user } = useAuth();
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

  /**
   * Loads all warehouse locations from the server and seeds the default
   * ubicacionId when none has been selected yet.
   * @returns The loaded list of locations.
   */
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
      toast.error(t('inventario.toast.errorCargarUbicaciones'));
      return [];
    }
  }, [toast, t]);

  useEffect(() => {
    void loadUbicaciones();
  }, [loadUbicaciones]);

  /**
   * Loads the locations assigned to the current user via professor slots
   * and/or a direct ubicacionId on their profile.
   */
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
                  'Ubicación desconocida',
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
  }, [user]);

  useEffect(() => {
    void loadUbicaciones();
    void loadAssignedLocations();
  }, [loadUbicaciones, loadAssignedLocations]);

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

    const timer = window.setTimeout(() => {
      searchProductoProveedor(term, 20, 0)
        .then((opts) => {
          if (!cancelled) setProductoProveedorOptions(opts);
        })
        .catch((err: unknown) => {
          console.error('Error buscando producto/proveedor:', err);
          if (!cancelled)
            toast.error(t('inventario.toast.errorBuscarProductoProveedor'));
        })
        .finally(() => {
          if (!cancelled) setIsSearchingProductoProveedor(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isCreateOpen, productoProveedorInput, toast, t]);

  /** Opens the create-inventory dialog and ensures locations are loaded. */
  const handleOpenCreate = () => {
    setIsCreateOpen(true);
    if (ubicaciones.length === 0) {
      void loadUbicaciones();
    }
  };

  /** Opens the barcode scanner for searching existing inventory items. */
  const handleOpenSearchScanner = useCallback(() => {
    setIsSearchScannerOpen(true);
  }, []);

  /** Closes the create-inventory dialog unless a save is in progress. */
  const handleCloseCreate = () => {
    if (isSaving) return;
    setIsCreateOpen(false);
  };

  /**
   * Fetches inventory from the server and groups it by product,
   * filtering by assigned locations for the "My Locations" tab.
   */
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
      setData(agregado);
      setTotalItems(agregado.length);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t('inventario.toast.errorCargar', {
              defaultValue: 'Error desconocido al cargar inventario.',
            });
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [tabIndex, assignedLocations, t]);

  useEffect(() => {
    void reloadInventario();
  }, [tabIndex, assignedLocations, canSeeGeneral, reloadInventario]);

  /**
   * Builds the DynamicFormModal schema for product creation, injecting
   * translated labels and the currently loaded supplier list.
   */
  const productoCreateSchema = useMemo<DynamicField[]>(() => {
    const schema: DynamicField[] = [
      {
        name: 'nombre',
        label: t('inventario.productoCreateFields.nombreComercial'),
        required: true,
      },
      { name: 'marca', label: t('inventario.productoCreateFields.marca') },
      {
        name: 'descripcion',
        label: t('inventario.productoCreateFields.descripcion'),
      },
      {
        name: 'contenido',
        label: t('inventario.productoCreateFields.contenidoNumerico'),
        type: 'number',
        required: true,
      },
      {
        name: 'unidad',
        label: t('inventario.productoCreateFields.unidadMedida'),
        type: 'select',
        required: true,
        options: [
          { value: UnidadMedida.KG, label: t('inventario.unidades.kg') },
          { value: UnidadMedida.G, label: t('inventario.unidades.g') },
          { value: UnidadMedida.L, label: t('inventario.unidades.l') },
          { value: UnidadMedida.ML, label: t('inventario.unidades.ml') },
          {
            value: UnidadMedida.UNIDAD,
            label: t('inventario.unidades.unidad'),
          },
          { value: UnidadMedida.PAQ, label: t('inventario.unidades.paquete') },
        ],
        width: 6,
      },
      {
        name: 'tipo',
        label: t('inventario.productoCreateFields.categoria'),
        type: 'select',
        required: true,
        width: 6,
        options: [
          {
            value: CategoriaProducto.VERDURA,
            label: t('inventario.categorias.verdura'),
          },
          {
            value: CategoriaProducto.FRUTA,
            label: t('inventario.categorias.fruta'),
          },
          {
            value: CategoriaProducto.CARNE,
            label: t('inventario.categorias.carne'),
          },
          {
            value: CategoriaProducto.PESCADO,
            label: t('inventario.categorias.pescado'),
          },
          {
            value: CategoriaProducto.MARISCO,
            label: t('inventario.categorias.marisco'),
          },
          {
            value: CategoriaProducto.LACTEO,
            label: t('inventario.categorias.lacteo'),
          },
          {
            value: CategoriaProducto.HUEVO,
            label: t('inventario.categorias.huevo'),
          },
          {
            value: CategoriaProducto.CEREAL,
            label: t('inventario.categorias.cereal'),
          },
          {
            value: CategoriaProducto.LEGUMBRE,
            label: t('inventario.categorias.legumbre'),
          },
          {
            value: CategoriaProducto.FRUTO_SECO,
            label: t('inventario.categorias.frutoSeco'),
          },
          {
            value: CategoriaProducto.CONDIMENTO,
            label: t('inventario.categorias.condimento'),
          },
          {
            value: CategoriaProducto.ACEITE,
            label: t('inventario.categorias.aceite'),
          },
          {
            value: CategoriaProducto.AZUCAR,
            label: t('inventario.categorias.azucar'),
          },
          {
            value: CategoriaProducto.BEBIDA,
            label: t('inventario.categorias.bebida'),
          },
          {
            value: CategoriaProducto.OTRO,
            label: t('inventario.categorias.otro'),
          },
        ],
      },
      {
        name: 'codigoBarras',
        label: t('inventario.productoCreateFields.codigoBarras'),
        type: 'barcode',
      },
    ];
    schema.push({
      name: 'proveedores',
      label: t('inventario.productoCreateFields.proveedoresAsociados'),
      type: 'proveedores',
      position: 'bottom',
      required: true,
      defaultValue: [],
      options: proveedores.map((p) => ({ value: p.id, label: p.nombre })),
    });
    return schema;
  }, [proveedores, t]);

  /**
   * Ensures the supplier list is loaded, fetching all pages if needed.
   * Throws an error when no suppliers exist.
   */
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

  /**
   * Builds a draft object for product creation by querying OpenFoodFacts
   * with the given barcode.
   * @param barcode - The scanned barcode string.
   * @returns A partial product form data object pre-filled from OFF data.
   */
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

  /**
   * Fetches product data from OpenFoodFacts for a barcode scan in the form.
   * @param code - The barcode string to look up.
   * @returns Partial form data or undefined when not found.
   */
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

  /**
   * Opens the product creation modal pre-filled with data derived from a
   * barcode scan, after ensuring suppliers are loaded.
   * @param barcode - The scanned barcode string.
   * @returns True when the modal was successfully opened, false on error.
   */
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

  /**
   * Confirms opening the product-creation modal for the pending barcode
   * that was flagged as not found in inventory.
   */
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

  /**
   * Opens the quantity dialog so the user can specify how many units
   * to add to inventory for a given product.
   * @param producto - Object containing the product's barcode and name.
   */
  const openCantidadDialogForProduct = useCallback(
    (producto: { barcode: string; nombre: string }) => {
      setProductoPendienteCantidadInventario(producto);
      setCantidadEscaneo('1');
      setIsCantidadDialogOpen(true);
    },
    []
  );

  /**
   * Opens the create-inventory dialog pre-filled with a product/supplier
   * search term derived from the scanned product data.
   * @param producto - The product identified by scan.
   * @param initialCantidad - Optional quantity to pre-fill.
   * @param preloadedOptions - Optional pre-loaded autocomplete options.
   */
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

  /**
   * Handles the form submission for creating a new product from the
   * inventory page, then prompts the user to specify a stock quantity.
   * @param formData - The raw form data submitted by DynamicFormModal.
   */
  const handleCreateProductoDesdeInventario = async (
    formData: Record<string, unknown>
  ) => {
    setIsSavingProducto(true);

    try {
      const typedFormData = formData as ProductoFormData;
      /** Converts a value to a trimmed string or undefined. */
      const toOptionalString = (value: unknown): string | undefined => {
        if (value == null) return undefined;
        const trimmed = String(value).trim();
        return trimmed !== '' ? trimmed : undefined;
      };

      const nombre = toOptionalString(typedFormData.nombre);
      if (!nombre) {
        throw new Error('El nombre del producto es obligatorio.');
      }

      const contenido = Number(typedFormData.contenido);
      if (Number.isNaN(contenido) || contenido <= 0) {
        throw new Error('El contenido debe ser un número mayor que 0.');
      }

      const unidad = normalizeUnidadMedida(
        toOptionalString(typedFormData.unidad)
      );
      if (!unidad) {
        throw new Error('Selecciona una unidad de medida válida.');
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
          'Debes asociar al menos un proveedor para poder añadir este producto al inventario.'
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
          'Cada proveedor debe tener un precio de compra válido (número mayor o igual a 0).'
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
        err instanceof Error
          ? err.message
          : t('inventario.toast.errorCrearProducto');
      toast.error(message);
    } finally {
      setIsSavingProducto(false);
    }
  };

  /**
   * Processes a barcode scan from the search scanner:
   * updates the search term and triggers flows to add missing products.
   * @param rawCode - The raw barcode string from the scanner.
   */
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

  /**
   * Handles the confirm action in the quantity dialog triggered from the scanner.
   * Resolves the product/supplier relationship and creates an inventory entry.
   */
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

  /**
   * Submits the manual inventory-entry creation form.
   * Validates all numeric fields before calling the API.
   */
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

  /**
   * Normalises a string by removing diacritics and lowercasing it,
   * used for locale-agnostic search comparisons.
   * @param s - The input string.
   * @returns The normalised string.
   */
  const normalize = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  /** Derived filtered data based on current search term and filters. */
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
        const ubicacionesStr = (p.ubicaciones ?? []).map(normalize).join(' ');
        return (
          nombre.includes(term) ||
          codigo.includes(term) ||
          tipo.includes(term) ||
          provs.includes(term) ||
          ubicacionesStr.includes(term)
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

  /** Column definitions for the inventory DataTable. */
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
              {t('inventario.estado.bajoStock')}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {t('inventario.estado.ok')}
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
          <Tooltip title={t('inventario.actions.verDetalles')}>
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
            <Tooltip title={t('inventario.actions.auditarStock')}>
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
        title={t('inventario.titulo')}
        searchValue={searchTerm}
        onSearchChange={(v) => {
          setSearchTerm(v);
          setPage(1);
        }}
        searchPlaceholder={t('inventario.searchPlaceholder')}
        searchId="search-inventario"
        autoFocusSearch={true}
        totalItems={totalItems}
        totalItemsLabel={t('inventario.totalItemsLabel')}
        primaryAction={
          canCrear
            ? {
                label: t('inventario.dialogs.añadirAlInventarioBtn'),
                onClick: handleOpenCreate,
                icon: <AddIcon />,
                id: 'btn-add-inventario',
              }
            : undefined
        }
        secondaryAction={
          canGestionarUbicaciones
            ? {
                label: t('inventario.dialogs.gestionarUbicaciones'),
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
        onScanBarcode={handleOpenSearchScanner}
      />

      <BarcodeScanner
        open={isSearchScannerOpen}
        onClose={() => setIsSearchScannerOpen(false)}
        onScan={(code) => {
          void handleSearchScannerResult(code);
        }}
        title={t('inventario.dialogs.escanearProducto')}
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tabIndex}
          onChange={(_, v) => {
            setTabIndex(v);
            setPage(1);
          }}
          aria-label={t('inventario.tabsLabel')}
        >
          <Tab label={t('inventario.tabs.misUbicaciones')} />
          {canSeeGeneral && (
            <Tab label={t('inventario.tabs.inventarioGeneral')} />
          )}
        </Tabs>
      </Box>

      <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <DataTable
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
                  ? t('inventario.empty.sinResultados')
                  : tabIndex === 0
                    ? assignedLocations.length === 0
                      ? t('inventario.empty.sinUbicacionesAsignadas')
                      : t('inventario.empty.sinStockUbicaciones', {
                          ubicaciones: assignedLocations
                            .map((l) => l.nombre)
                            .join(', '),
                        })
                    : t('inventario.empty.sinStockGeneral')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchTerm.trim() ||
                filters.categorias.length > 0 ||
                filters.ubicaciones.length > 0
                  ? t('inventario.empty.prueba')
                  : tabIndex === 0 && assignedLocations.length === 0
                    ? t('inventario.empty.contactaProfesor')
                    : t('inventario.empty.registraStock')}
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
          <DialogTitle>{t('inventario.dialogs.añadirTitulo')}</DialogTitle>
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
                    ? t('inventario.dialogs.escribeMas')
                    : t('inventario.dialogs.sinResultados')
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('inventario.dialogs.productoProveedor')}
                    placeholder={t('inventario.dialogs.buscarProducto')}
                    fullWidth
                    required
                    error={
                      !productoProveedorValue &&
                      productoProveedorInput.length > 0
                    }
                    helperText={
                      !productoProveedorValue &&
                      productoProveedorInput.length > 0
                        ? t('inventario.dialogs.debeSeleccionar')
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
                  label={t('inventario.dialogs.cantidadActual')}
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
                      ? t('inventario.dialogs.debeNumero')
                      : undefined
                  }
                  fullWidth
                />
                <TextField
                  label={t('inventario.dialogs.cantidadMinima')}
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
                      ? t('inventario.dialogs.debeNumero')
                      : undefined
                  }
                  fullWidth
                />
              </Box>

              <Box display="flex" gap={2} flexWrap="wrap">
                <TextField
                  label={t('inventario.dialogs.cantidadMaxima')}
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
                      ? t('inventario.dialogs.debeNumero')
                      : cantMaxNum < cantMinNum
                        ? t('inventario.dialogs.maxMenorMin')
                        : undefined)
                  }
                  fullWidth
                />
                <TextField
                  select
                  label={t('inventario.dialogs.ubicacion')}
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
                label={t('inventario.dialogs.fechaCaducidad')}
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
              {t('inventario.dialogs.cancelar')}
            </Button>
            <Button
              onClick={handleCreateInventario}
              variant="contained"
              disabled={isSaving || !isFormValid}
            >
              {isSaving
                ? t('inventario.dialogs.guardando')
                : t('inventario.dialogs.guardar')}
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
              {t('comun.cancelar')}
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
