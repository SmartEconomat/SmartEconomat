import React, {
  useCallback,
  useState,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import {
  Box,
  Button,
  IconButton,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Autocomplete,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import Select from './Select';
import NumericInput from './NumericInput';
import MenuItem from '@mui/material/MenuItem';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import {
  getProductoById,
  searchProductosByName,
} from '../../services/producto.service';
import { Producto, ProductoProveedor } from '../../services/producto.types';
import { UnidadIngrediente } from '../../services/receta.types';
import { EU_ALLERGENS } from '../../utils/constants';
import { useTranslation } from 'react-i18next';

/** Contrato de tipos público (UI_RecetaIngrediente). Contexto: smart-economat-frontend (SPA). */
export interface UI_RecetaIngrediente {
  productoId: string;
  cantidad: number;
  unidad: UnidadIngrediente;
  mermaAplicada?: number;
  proveedorFavoritoId?: string;
  proveedorFavoritoAuto?: boolean;
  producto?: {
    id: string;
    nombre: string;
    alergenos?: { productoId: string; alergeno: string }[];
    proveedores?: ProductoProveedor[];
  } | null;
}

interface RecetaIngredientesSelectorProps {
  value: UI_RecetaIngrediente[];
  onChange: (value: UI_RecetaIngrediente[]) => void;
}

const PRODUCT_SEARCH_MIN_CHARS = 2;
const PRODUCT_SEARCH_DEBOUNCE_MS = 300;
const PRODUCT_SEARCH_CACHE_MAX_ENTRIES = 50;

const RecetaIngredientesSelector: React.FC<RecetaIngredientesSelectorProps> = ({
  value = [],
  onChange,
}) => {
  const { t } = useTranslation();
  const [productDetails, setProductDetails] = useState<
    Record<string, Producto>
  >({});
  const [searchResultsByLine, setSearchResultsByLine] = useState<
    Record<number, Producto[]>
  >({});
  const [isSearchingByLine, setIsSearchingByLine] = useState<
    Record<number, boolean>
  >({});
  const searchDebounceTimersRef = useRef<
    Record<number, ReturnType<typeof setTimeout> | undefined>
  >({});
  const searchRequestIdRef = useRef<Record<number, number>>({});
  const productSearchCacheRef = useRef<Map<string, Producto[]>>(new Map());

  const upsertProductDetails = useCallback(
    (products: Array<Producto | null | undefined>) => {
      if (products.length === 0) {
        return;
      }

      setProductDetails((prev) => {
        let hasChanges = false;
        const next = { ...prev };

        products.forEach((product) => {
          if (!product?.id) {
            return;
          }

          const existing = next[product.id];
          if (!existing || !existing.proveedores?.length) {
            next[product.id] = product;
            hasChanges = true;
          }
        });

        return hasChanges ? next : prev;
      });
    },
    []
  );

  const getAvailableProviders = useCallback(
    (
      line: UI_RecetaIngrediente,
      fallbackProduct?: Producto | null
    ): ProductoProveedor[] => {
      const detailedProduct = line.productoId
        ? productDetails[line.productoId]
        : undefined;

      return (
        detailedProduct?.proveedores ||
        fallbackProduct?.proveedores ||
        line.producto?.proveedores ||
        []
      );
    },
    [productDetails]
  );

  const getCheapestProvider = useCallback(
    (providers: ProductoProveedor[]): ProductoProveedor | undefined => {
      const providersWithPrice = providers.filter(
        (provider) =>
          provider.proveedor?.id &&
          typeof provider.precioUnitario === 'number' &&
          Number.isFinite(provider.precioUnitario)
      );

      if (providersWithPrice.length > 0) {
        return providersWithPrice.reduce((cheapest, current) =>
          (current.precioUnitario ?? Number.POSITIVE_INFINITY) <
          (cheapest.precioUnitario ?? Number.POSITIVE_INFINITY)
            ? current
            : cheapest
        );
      }

      return providers.find((provider) => provider.proveedor?.id);
    },
    []
  );

  const buildInlineProduct = useCallback(
    (product: Producto) => ({
      id: product.id,
      nombre: product.nombre,
      alergenos: product.alergenos,
      proveedores: product.proveedores,
    }),
    []
  );

  const getOptionId = useCallback(
    (option?: Pick<Producto, 'id'> | UI_RecetaIngrediente['producto'] | null) =>
      option?.id,
    []
  );

  const clearPendingSearchTimers = useCallback(() => {
    Object.values(searchDebounceTimersRef.current).forEach((timer) => {
      if (timer) {
        clearTimeout(timer);
      }
    });
  }, []);

  useEffect(() => clearPendingSearchTimers, [clearPendingSearchTimers]);

  useEffect(() => {
    const productIdsToLoad = Array.from(
      new Set(
        value
          .map((line) => line.productoId)
          .filter(
            (productoId): productoId is string =>
              Boolean(productoId) && !productDetails[productoId]
          )
      )
    );

    if (productIdsToLoad.length === 0) {
      return;
    }

    let cancelled = false;

    const loadMissingProductDetails = async () => {
      const loadedProducts = await Promise.all(
        productIdsToLoad.map((productoId) => getProductoById(productoId))
      );

      if (cancelled) {
        return;
      }

      upsertProductDetails(
        loadedProducts.filter((product): product is Producto =>
          Boolean(product?.id)
        )
      );
    };

    void loadMissingProductDetails();

    return () => {
      cancelled = true;
    };
  }, [value, productDetails, upsertProductDetails]);

  useEffect(() => {
    let hasChanges = false;

    const nextLines = value.map((line) => {
      if (!line.productoId) {
        return line;
      }

      const detailedProduct = productDetails[line.productoId];
      if (!detailedProduct) {
        return line;
      }

      let nextLine = line;
      const nextInlineProduct = buildInlineProduct(detailedProduct);

      if (
        !line.producto ||
        line.producto.id !== detailedProduct.id ||
        !line.producto.proveedores?.length
      ) {
        nextLine = {
          ...nextLine,
          producto: nextInlineProduct,
        };
        hasChanges = true;
      }

      const availableProviders = getAvailableProviders(
        nextLine,
        detailedProduct
      );
      const currentProviderIsValid = Boolean(
        nextLine.proveedorFavoritoId &&
        availableProviders.some(
          (provider) => provider.proveedor?.id === nextLine.proveedorFavoritoId
        )
      );

      if (!currentProviderIsValid) {
        const cheapestProvider = getCheapestProvider(availableProviders);
        const cheapestProviderId = cheapestProvider?.proveedor?.id;

        if (
          nextLine.proveedorFavoritoId !== cheapestProviderId ||
          nextLine.proveedorFavoritoAuto !== Boolean(cheapestProviderId)
        ) {
          nextLine = {
            ...nextLine,
            proveedorFavoritoId: cheapestProviderId,
            proveedorFavoritoAuto: Boolean(cheapestProviderId),
          };
          hasChanges = true;
        }
      }

      return nextLine;
    });

    if (hasChanges) {
      onChange(nextLines);
    }
  }, [
    value,
    productDetails,
    onChange,
    getAvailableProviders,
    getCheapestProvider,
    buildInlineProduct,
  ]);

  const handleAddLine = () => {
    const newLines = [
      ...value,
      {
        productoId: '',
        cantidad: 1,
        unidad: UnidadIngrediente.GRAMO,
        mermaAplicada: 0,
      },
    ];
    onChange(newLines);
  };

  const handleRemoveLine = (index: number) => {
    const newLines = value.filter((_, i) => i !== index);
    onChange(newLines);

    if (searchDebounceTimersRef.current[index]) {
      clearTimeout(searchDebounceTimersRef.current[index]);
      delete searchDebounceTimersRef.current[index];
    }
    delete searchRequestIdRef.current[index];

    setSearchResultsByLine((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setIsSearchingByLine((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const handleProductSearch = useCallback(
    (index: number, query: string) => {
      const trimmedQuery = query.trim();

      if (searchDebounceTimersRef.current[index]) {
        clearTimeout(searchDebounceTimersRef.current[index]);
        delete searchDebounceTimersRef.current[index];
      }

      const requestId = (searchRequestIdRef.current[index] ?? 0) + 1;
      searchRequestIdRef.current[index] = requestId;

      if (trimmedQuery.length < PRODUCT_SEARCH_MIN_CHARS) {
        setSearchResultsByLine((prev) => ({ ...prev, [index]: [] }));
        setIsSearchingByLine((prev) => ({ ...prev, [index]: false }));
        return;
      }

      setIsSearchingByLine((prev) => ({ ...prev, [index]: true }));

      searchDebounceTimersRef.current[index] = setTimeout(async () => {
        const cacheKey = trimmedQuery.toLowerCase();
        const cachedResults = productSearchCacheRef.current.get(cacheKey);

        if (cachedResults) {
          if (searchRequestIdRef.current[index] === requestId) {
            setSearchResultsByLine((prev) => ({
              ...prev,
              [index]: cachedResults,
            }));
            setIsSearchingByLine((prev) => ({ ...prev, [index]: false }));
          }
          return;
        }

        try {
          const products = await searchProductosByName(trimmedQuery);

          if (searchRequestIdRef.current[index] !== requestId) {
            return;
          }

          productSearchCacheRef.current.set(cacheKey, products);
          while (
            productSearchCacheRef.current.size >
            PRODUCT_SEARCH_CACHE_MAX_ENTRIES
          ) {
            const oldestEntry = productSearchCacheRef.current.keys().next();
            if (oldestEntry.done) {
              break;
            }
            productSearchCacheRef.current.delete(oldestEntry.value);
          }

          upsertProductDetails(products);
          setSearchResultsByLine((prev) => ({ ...prev, [index]: products }));
        } catch (error) {
          if (searchRequestIdRef.current[index] === requestId) {
            console.error('Error searching products for recipe:', error);
            setSearchResultsByLine((prev) => ({ ...prev, [index]: [] }));
          }
        } finally {
          if (searchRequestIdRef.current[index] === requestId) {
            setIsSearchingByLine((prev) => ({ ...prev, [index]: false }));
          }
        }
      }, PRODUCT_SEARCH_DEBOUNCE_MS);
    },
    [upsertProductDetails]
  );

  const handleUpdateLine = (
    index: number,
    field: keyof UI_RecetaIngrediente,
    newValue: UI_RecetaIngrediente[keyof UI_RecetaIngrediente]
  ) => {
    const newLines = [...value];
    newLines[index] = { ...newLines[index], [field]: newValue };

    if (field === 'productoId' && typeof newValue === 'string' && newValue) {
      const selectedProduct =
        productDetails[newValue] ||
        searchResultsByLine[index]?.find(
          (product) => product.id === newValue
        ) ||
        null;

      if (selectedProduct) {
        upsertProductDetails([selectedProduct]);
      }

      const availableProviders = getAvailableProviders(
        newLines[index],
        selectedProduct
      );
      const cheapestProviderId =
        getCheapestProvider(availableProviders)?.proveedor?.id;

      newLines[index].producto = selectedProduct
        ? {
            ...buildInlineProduct(selectedProduct),
          }
        : undefined;
      newLines[index].proveedorFavoritoId = cheapestProviderId;
      newLines[index].proveedorFavoritoAuto = Boolean(cheapestProviderId);
      onChange(newLines);

      if (!selectedProduct || !selectedProduct.proveedores?.length) {
        getProductoById(newValue)
          .then((product) => {
            if (product) {
              upsertProductDetails([product]);
            }
          })
          .catch((error) => {
            console.error('Error loading product details for recipe:', error);
          });
      }
    } else if (field === 'productoId' && !newValue) {
      // Reset if product is cleared
      newLines[index].producto = undefined;
      newLines[index].proveedorFavoritoId = undefined;
      newLines[index].proveedorFavoritoAuto = undefined;
      onChange(newLines);
    } else if (field === 'proveedorFavoritoId') {
      const availableProviders = getAvailableProviders(newLines[index]);
      const cheapestProviderId =
        getCheapestProvider(availableProviders)?.proveedor?.id;

      if (!newValue) {
        newLines[index].proveedorFavoritoId = cheapestProviderId;
        newLines[index].proveedorFavoritoAuto = Boolean(cheapestProviderId);
      } else {
        newLines[index].proveedorFavoritoAuto = newValue === cheapestProviderId;
      }

      onChange(newLines);
    } else {
      onChange(newLines);
    }
  };

  // Calcular alérgenos únicos de los productos seleccionados
  const uniqueAllergens = useMemo(() => {
    const allergenSet = new Set<string>();
    value.forEach((line) => {
      const product = line.productoId
        ? productDetails[line.productoId] || line.producto
        : line.producto;
      if (product && product.alergenos) {
        product.alergenos.forEach((a) => allergenSet.add(a.alergeno));
      }
    });

    return Array.from(allergenSet)
      .map((id) => EU_ALLERGENS.find((ea) => ea.id === id))
      .filter(
        (allergen): allergen is (typeof EU_ALLERGENS)[number] =>
          allergen !== undefined
      );
  }, [value, productDetails]);

  return (
    <Box sx={{ mt: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          {t('recipes.ingredientes.titulo')}
        </Typography>
        <Button
          startIcon={<AddIcon />}
          variant="outlined"
          size="small"
          onClick={handleAddLine}
        >
          {t('recipes.ingredientes.anadir')}
        </Button>
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: 'block', mb: 1.5 }}
      >
        {t('recipes.ingredientes.buscarAyuda')}
      </Typography>

      {/* Display de alérgenos derivados */}
      {uniqueAllergens.length > 0 && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            bgcolor: 'warning.light',
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              color: 'warning.contrastText',
              gap: 1,
            }}
          >
            <ErrorOutlineIcon />
            <Typography variant="body2" fontWeight="bold">
              {t('recipes.ingredientes.alergenosTitulo')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {uniqueAllergens.map((allergen) => (
              <Tooltip key={allergen.id} title={allergen.label}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    bgcolor: 'background.paper',
                    px: 1,
                    py: 0.5,
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  {allergen.icon}
                  <Typography variant="caption">{allergen.label}</Typography>
                </Box>
              </Tooltip>
            ))}
          </Box>
        </Box>
      )}

      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ mb: 2, overflowX: 'auto' }}
      >
        <Table
          size="small"
          aria-label={t('recipes.ingredientes.titulo')}
          sx={{ minWidth: 960, tableLayout: 'fixed' }}
        >
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell
                sx={{ fontWeight: 'bold', width: '38%', whiteSpace: 'nowrap' }}
              >
                {t('recipes.ingredientes.columns.producto')}
              </TableCell>
              <TableCell
                sx={{ fontWeight: 'bold', width: '9%', whiteSpace: 'nowrap' }}
              >
                {t('recipes.ingredientes.columns.cantidad')}
              </TableCell>
              <TableCell
                sx={{ fontWeight: 'bold', width: '9%', whiteSpace: 'nowrap' }}
              >
                {t('recipes.ingredientes.columns.unidad')}
              </TableCell>
              <TableCell
                sx={{ fontWeight: 'bold', width: '9%', whiteSpace: 'nowrap' }}
              >
                {t('recipes.ingredientes.columns.merma')}
              </TableCell>
              <TableCell
                sx={{ fontWeight: 'bold', width: '29%', whiteSpace: 'nowrap' }}
              >
                {t('recipes.ingredientes.columns.proveedorFav')}
              </TableCell>
              <TableCell sx={{ width: '6%' }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {value.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  align="center"
                  sx={{ py: 3, color: 'text.secondary' }}
                >
                  {t('recipes.ingredientes.empty')}
                </TableCell>
              </TableRow>
            ) : (
              value.map((line, index) => {
                const selectedProduct = line.productoId
                  ? productDetails[line.productoId] ||
                    searchResultsByLine[index]?.find(
                      (product) => product.id === line.productoId
                    ) ||
                    (line.producto as Producto | null) ||
                    null
                  : null;
                const availableProviders = getAvailableProviders(
                  line,
                  selectedProduct
                );
                const cheapestProviderId =
                  getCheapestProvider(availableProviders)?.proveedor?.id;

                const optionsMap = new Map<string, Producto>();

                (searchResultsByLine[index] || []).forEach((product) => {
                  optionsMap.set(product.id, product);
                });

                if (selectedProduct?.id) {
                  optionsMap.set(selectedProduct.id, selectedProduct);
                }

                if (line.producto?.id) {
                  optionsMap.set(line.producto.id, line.producto as Producto);
                }

                const options = Array.from(optionsMap.values());

                return (
                  <TableRow key={`ing-row-${index}`}>
                    <TableCell
                      sx={{ verticalAlign: 'top', py: 1, minWidth: 0 }}
                    >
                      <Autocomplete
                        options={options}
                        getOptionLabel={(option) => option.nombre || ''}
                        value={selectedProduct || line.producto || null}
                        loading={Boolean(isSearchingByLine[index])}
                        openOnFocus
                        isOptionEqualToValue={(option, currentValue) =>
                          getOptionId(option) === getOptionId(currentValue)
                        }
                        onInputChange={(_, inputValue, reason) => {
                          if (reason === 'input' || reason === 'clear') {
                            void handleProductSearch(index, inputValue);
                          }
                        }}
                        onChange={(_, newValue) =>
                          handleUpdateLine(
                            index,
                            'productoId',
                            newValue?.id || ''
                          )
                        }
                        renderOption={(props, option) => {
                          const listItemProps = {
                            ...props,
                          } as React.HTMLAttributes<HTMLLIElement> & {
                            keepMounted?: boolean;
                            key?: React.Key;
                          };

                          delete listItemProps.keepMounted;
                          delete listItemProps.key;

                          return (
                            <li {...listItemProps} key={option.id}>
                              {option.nombre}
                            </li>
                          );
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            variant="outlined"
                            placeholder={t(
                              'recipes.ingredientes.buscarProducto'
                            )}
                            InputLabelProps={{ shrink: true }}
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {isSearchingByLine[index] ? (
                                    <CircularProgress
                                      color="inherit"
                                      size={16}
                                    />
                                  ) : null}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
                          />
                        )}
                        noOptionsText={t('recipes.ingredientes.sinProductos')}
                        size="small"
                        fullWidth
                      />
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top', py: 1 }}>
                      <NumericInput
                        name={`ing-cant-${index}`}
                        label=""
                        value={line.cantidad || ''}
                        onChange={(parsed) =>
                          handleUpdateLine(index, 'cantidad', parsed ?? 0)
                        }
                        variant="outlined"
                        size="small"
                        fullWidth
                      />
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top', py: 1 }}>
                      <Select
                        name={`ing-unidad-${index}`}
                        label=""
                        value={line.unidad || ''}
                        onChange={(e) =>
                          handleUpdateLine(index, 'unidad', e.target.value)
                        }
                        variant="outlined"
                        size="small"
                        fullWidth
                        margin="none"
                      >
                        {Object.values(UnidadIngrediente).map((unidad) => (
                          <MenuItem key={unidad} value={unidad}>
                            {unidad}
                          </MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top', py: 1 }}>
                      <NumericInput
                        name={`ing-merma-${index}`}
                        label=""
                        value={line.mermaAplicada ?? 0}
                        onChange={(parsed) =>
                          handleUpdateLine(
                            index,
                            'mermaAplicada',
                            Math.min(100, Math.max(0, parsed ?? 0))
                          )
                        }
                        inputProps={{
                          min: 0,
                          max: 100,
                          'aria-label': `merma-aplicada-${index}`,
                        }}
                        variant="outlined"
                        size="small"
                        fullWidth
                      />
                    </TableCell>
                    <TableCell
                      sx={{ verticalAlign: 'top', py: 1, minWidth: 0 }}
                    >
                      <Select
                        name={`ing-prov-${index}`}
                        label=""
                        value={
                          availableProviders.some(
                            (p) => p.proveedor?.id === line.proveedorFavoritoId
                          )
                            ? line.proveedorFavoritoId || ''
                            : ''
                        }
                        onChange={(e) =>
                          handleUpdateLine(
                            index,
                            'proveedorFavoritoId',
                            e.target.value
                          )
                        }
                        variant="outlined"
                        size="small"
                        fullWidth
                        margin="none"
                        SelectProps={{
                          displayEmpty: true,
                          renderValue: (val) => {
                            if (!val) {
                              return (
                                <em>
                                  {t('recipes.ingredientes.sinProveedor')}
                                </em>
                              );
                            }

                            const selected = availableProviders.find(
                              (pp) => pp.proveedor?.id === val
                            );

                            if (selected) {
                              const isAutomatic =
                                line.proveedorFavoritoAuto ||
                                selected.proveedor?.id === cheapestProviderId;

                              const selectedProviderName =
                                selected.proveedor?.nombre ||
                                t('recipes.ingredientes.proveedorDesconocido');

                              const selectedProviderPrice =
                                typeof selected.precioUnitario === 'number' &&
                                Number.isFinite(selected.precioUnitario)
                                  ? `${selected.precioUnitario}€`
                                  : '—';

                              return (
                                <Box
                                  sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    justifyContent: 'center',
                                    gap: 0.2,
                                    maxWidth: '100%',
                                    minWidth: 0,
                                    lineHeight: 1.15,
                                  }}
                                >
                                  <Typography
                                    component="span"
                                    variant="body2"
                                    sx={{
                                      color: isAutomatic
                                        ? 'success.dark'
                                        : 'primary.dark',
                                      fontWeight: 700,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      minWidth: 0,
                                      width: '100%',
                                    }}
                                  >
                                    {selectedProviderName}
                                  </Typography>
                                  <Box
                                    component="span"
                                    sx={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 0.75,
                                      maxWidth: '100%',
                                      minWidth: 0,
                                      color: 'text.secondary',
                                      fontSize: '0.72rem',
                                    }}
                                  >
                                    <Box
                                      component="span"
                                      sx={{
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {selectedProviderPrice}
                                    </Box>
                                    {isAutomatic && (
                                      <Box
                                        component="span"
                                        sx={{
                                          fontSize: '0.68rem',
                                          textTransform: 'uppercase',
                                          letterSpacing: 0.35,
                                          fontWeight: 700,
                                          color: 'success.dark',
                                        }}
                                      >
                                        {t('recipes.ingredientes.auto')}
                                      </Box>
                                    )}
                                  </Box>
                                </Box>
                              );
                            }
                            return val as string;
                          },
                          sx: {
                            '& .MuiSelect-select': {
                              minWidth: 0,
                              display: 'flex',
                              alignItems: 'center',
                              overflow: 'hidden',
                            },
                          },
                        }}
                        disabled={!line.productoId}
                      >
                        <MenuItem value="">
                          <em>{t('recipes.ingredientes.autoMasBarato')}</em>
                        </MenuItem>
                        {availableProviders.map((pp) => (
                          <MenuItem
                            key={pp.proveedor?.id || 'unknown'}
                            value={pp.proveedor?.id}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                gap: 0.15,
                                minWidth: 0,
                                width: '100%',
                                fontWeight:
                                  pp.proveedor?.id === cheapestProviderId
                                    ? 700
                                    : 400,
                                color:
                                  pp.proveedor?.id === cheapestProviderId
                                    ? 'success.dark'
                                    : 'inherit',
                              }}
                            >
                              <Box
                                component="span"
                                sx={{
                                  width: '100%',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {pp.proveedor?.nombre ||
                                  t(
                                    'recipes.ingredientes.proveedorDesconocido'
                                  )}
                              </Box>
                              <Box
                                component="span"
                                sx={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 0.75,
                                  color: 'text.secondary',
                                  fontSize: '0.72rem',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                <Box component="span">{pp.precioUnitario}€</Box>
                                {pp.proveedor?.id === cheapestProviderId && (
                                  <Box
                                    component="span"
                                    sx={{
                                      fontSize: '0.68rem',
                                      bgcolor: 'success.light',
                                      color: 'success.dark',
                                      px: 0.75,
                                      py: 0.15,
                                      borderRadius: 999,
                                      fontWeight: 700,
                                    }}
                                  >
                                    {t('recipes.ingredientes.masBarato')}
                                  </Box>
                                )}
                              </Box>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'top', py: 1 }}>
                      <Tooltip title={t('comun.quitar')}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveLine(index)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default RecetaIngredientesSelector;
