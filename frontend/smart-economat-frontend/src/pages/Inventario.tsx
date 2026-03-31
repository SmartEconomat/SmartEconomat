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
import { profesorService } from '../services/profesor.service';
import {
  searchProductoProveedor,
  type ProductoProveedorOption,
} from '../services/productoProveedor.service';
import { searchByBarcode } from '../services/openfoodfacts.service';

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

const PRODUCTO_CREATE_FIELDS_BASE: DynamicField[] = [
  { name: 'nombre', label: 'Nombre Comercial', required: true },
  { name: 'marca', label: 'Marca' },
  { name: 'descripcion', label: 'Descripción' },
  {
    name: 'contenido',
    label: 'Contenido Numérico',
    type: 'number',
    required: true,
  },
  {
    name: 'unidad',
    label: 'Unidad de Medida',
    type: 'select',
    required: true,
    options: [
      { value: UnidadMedida.KG, label: 'Kg' },
      { value: UnidadMedida.G, label: 'Gramo' },
      { value: UnidadMedida.L, label: 'Litro' },
      { value: UnidadMedida.ML, label: 'Mililitro' },
      { value: UnidadMedida.UNIDAD, label: 'Unidad' },
      { value: UnidadMedida.PAQ, label: 'Paquete' },
    ],
    width: 6,
  },
  {
    name: 'tipo',
    label: 'Categoría',
    type: 'select',
    required: true,
    width: 6,
    options: [
      { value: CategoriaProducto.VERDURA, label: 'Verdura' },
      { value: CategoriaProducto.FRUTA, label: 'Fruta' },
      { value: CategoriaProducto.CARNE, label: 'Carne' },
      { value: CategoriaProducto.PESCADO, label: 'Pescado' },
      { value: CategoriaProducto.MARISCO, label: 'Marisco' },
      { value: CategoriaProducto.LACTEO, label: 'Lácteo' },
      { value: CategoriaProducto.HUEVO, label: 'Huevo' },
      { value: CategoriaProducto.CEREAL, label: 'Cereal' },
      { value: CategoriaProducto.LEGUMBRE, label: 'Legumbre' },
      { value: CategoriaProducto.FRUTO_SECO, label: 'Fruto Seco' },
      { value: CategoriaProducto.CONDIMENTO, label: 'Condimento' },
      { value: CategoriaProducto.ACEITE, label: 'Aceite' },
      { value: CategoriaProducto.AZUCAR, label: 'Azúcar' },
      { value: CategoriaProducto.BEBIDA, label: 'Bebida' },
      { value: CategoriaProducto.OTRO, label: 'Otro' },
    ],
  },
  { name: 'codigoBarras', label: 'Código de Barras', type: 'barcode' },
];

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
  const canAjustar = usePermission('inventario:ajustar_stock');
  const canCrear = usePermission('inventario:crear');
  const canGestionarUbicaciones = usePermission(
    'inventario:gestionar_ubicaciones'
  );
  const canCrearProducto = usePermission('productos:crear');

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
      toast.error('Error al cargar ubicaciones');
      return [];
    }
  }, [toast]);

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
    if (ubicaciones.length === 0) {
      void loadUbicaciones();
    }
  };

  const handleOpenSearchScanner = useCallback(() => {
    if (typeof document !== 'undefined') {
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement) {
        activeElement.blur();
      }
    }

    window.requestAnimationFrame(() => {
      setIsSearchScannerOpen(true);
    });
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
  }, [tabIndex, assignedLocations]);

  useEffect(() => {
    void reloadInventario();
  }, [tabIndex, assignedLocations, canSeeGeneral, reloadInventario]);

  const productoCreateSchema = useMemo<DynamicField[]>(() => {
    const schema = [...PRODUCTO_CREATE_FIELDS_BASE];
    schema.push({
      name: 'proveedores',
      label: 'Proveedores Asociados',
      type: 'proveedores',
      position: 'bottom',
      required: true,
      defaultValue: [],
      options: proveedores.map((p) => ({ value: p.id, label: p.nombre })),
    });
    return schema;
  }, [proveedores]);

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
          toast.info(
            'No se encontró relación producto/proveedor para este artículo. Asocia un proveedor y vuelve a intentarlo.'
          );
        }
      } catch (err: unknown) {
        console.error('Error preparando alta en inventario:', err);
        toast.error('Error al cargar opciones de producto/proveedor.');
      } finally {
        setIsSearchingProductoProveedor(false);
      }
    },
    [loadUbicaciones, toast, ubicaciones.length]
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
      toast.success('Producto creado correctamente en catálogo.');

      if (canCrear) {
        openCantidadDialogForProduct({
          barcode: creado.codigoBarras || codigoBarras || '',
          nombre: creado.nombre,
        });
      } else {
        toast.info(
          'Producto creado, pero no tienes permisos para añadirlo al inventario.'
        );
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al crear el producto.';
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
        toast.success('Producto localizado en inventario.');
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
            toast.info(
              'Producto encontrado en catálogo. Indica la cantidad que quieres añadir al inventario.'
            );
          } else {
            toast.info(
              'Producto encontrado en catálogo, pero no tienes permisos para añadir inventario.'
            );
          }
          return;
        }
      } catch (err: unknown) {
        console.error('Error comprobando producto escaneado:', err);
      }

      if (!canCrearProducto) {
        toast.info(
          'Este código no existe en inventario y no tienes permisos para crear productos.'
        );
        return;
      }

      setBarcodePendienteCrearProducto(code);
    },
    [canCrear, canCrearProducto, data, openCantidadDialogForProduct, toast]
  );

  const handleConfirmCantidadScanner = async () => {
    const producto = productoPendienteCantidadInventario;
    if (!producto) return;

    const cantidad = Number(cantidadEscaneo);
    if (Number.isNaN(cantidad) || cantidad <= 0) {
      toast.error('La cantidad a añadir debe ser un número mayor que 0.');
      return;
    }

    if (!canCrear) {
      toast.info('No tienes permisos para añadir inventario.');
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
        throw new Error(
          'No hay ubicaciones disponibles para registrar el inventario.'
        );
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
          toast.error(
            'No existe relación producto/proveedor para este artículo. Asocia un proveedor y vuelve a intentarlo.'
          );
          return;
        }

        toast.info(
          'Se encontraron varias relaciones producto/proveedor. Selecciona una manualmente para completar el alta en inventario.'
        );
        void openInventarioCreateForProduct(producto, cantidad, options);
        return;
      }

      await createInventarioItem({
        productoProveedorId: selectedOption.id,
        cantidadActual: cantidad,
        cantidadMinima: 0,
        ubicacionId: ubicacionDestinoId,
      });

      toast.success(`Stock añadido correctamente para ${producto.nombre}.`);
      setIsCantidadDialogOpen(false);
      setProductoPendienteCantidadInventario(null);
      setCantidadEscaneo('1');
      await reloadInventario();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'No se pudo añadir el producto al inventario.';
      toast.error(message);
    } finally {
      setIsAddingFromScanner(false);
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
        autoFocusSearch={true}
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
        onScanBarcode={handleOpenSearchScanner}
      />

      <BarcodeScanner
        open={isSearchScannerOpen}
        onClose={() => setIsSearchScannerOpen(false)}
        onScan={(code) => {
          void handleSearchScannerResult(code);
        }}
        title="Escanear Producto para Buscar"
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tabIndex}
          onChange={(_, v) => {
            setTabIndex(v);
            setPage(1);
          }}
          aria-label="inventory tabs"
        >
          <Tab label="Mis Ubicaciones" />
          {canSeeGeneral && <Tab label="Inventario General" />}
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
                  ? 'No hay productos que coincidan con tu búsqueda o filtros'
                  : tabIndex === 0
                    ? assignedLocations.length === 0
                      ? 'No tienes ubicaciones asignadas'
                      : `No hay stock en ${assignedLocations.map((l) => l.nombre).join(', ')}`
                    : 'No hay stock en inventario'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchTerm.trim() ||
                filters.categorias.length > 0 ||
                filters.ubicaciones.length > 0
                  ? 'Prueba con otros términos o limpia los filtros.'
                  : tabIndex === 0 && assignedLocations.length === 0
                    ? 'Contacta con tu profesor o administrador para que te asigne un slot.'
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
              {isSaving ? 'Guardando...' : 'Guardar'}
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
          title="Crear Nuevo Producto"
          size="lg"
          fields={productoCreateSchema}
          initialData={createProductoInitialData}
          onSubmit={handleCreateProductoDesdeInventario}
          isSubmitting={isSavingProducto}
          requireConfirmation={true}
          confirmationMessage="¿Deseas crear este producto y dejarlo listo para inventario?"
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
          title="Producto no encontrado"
          message={
            barcodePendienteCrearProducto
              ? `Este producto (${barcodePendienteCrearProducto}) no existe en inventario. ¿Deseas crearlo en el catálogo?`
              : 'Este producto no existe en inventario. ¿Deseas crearlo en el catálogo?'
          }
          confirmText="Sí, crear producto"
          cancelText="No"
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
          <DialogTitle>Cantidad a añadir</DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {productoPendienteCantidadInventario
                ? `Indica la cantidad que quieres añadir para "${productoPendienteCantidadInventario.nombre}".`
                : 'Indica la cantidad que quieres añadir al inventario.'}
            </Typography>
            <TextField
              autoFocus
              fullWidth
              label="Cantidad a añadir"
              type="number"
              value={cantidadEscaneo}
              onChange={(e) => setCantidadEscaneo(e.target.value)}
              inputProps={{ min: 0.01, step: 'any' }}
              error={cantidadEscaneo !== '' && !isCantidadEscaneoValida}
              helperText={
                cantidadEscaneo !== '' && !isCantidadEscaneoValida
                  ? 'Debe ser un número mayor que 0'
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
              Cancelar
            </Button>
            <Button
              onClick={() => {
                void handleConfirmCantidadScanner();
              }}
              variant="contained"
              disabled={isAddingFromScanner || !isCantidadEscaneoValida}
            >
              {isAddingFromScanner ? 'Añadiendo...' : 'Añadir al inventario'}
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
