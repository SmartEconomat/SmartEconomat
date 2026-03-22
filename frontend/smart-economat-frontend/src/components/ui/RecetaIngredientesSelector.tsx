import React, { useState, useEffect, useMemo } from 'react';
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
  Select,
  MenuItem,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import {
  fetchProductos,
  getProductoById,
  searchProductosByName,
} from '../../services/producto.service';
import { Producto, ProductoProveedor } from '../../services/producto.types';
import { UnidadIngrediente } from '../../services/receta.types';
import { EU_ALLERGENS } from '../../utils/constants';

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
    alergenos?: { id_producto: string; alergeno: string }[];
    proveedores?: ProductoProveedor[];
  };
}

interface RecetaIngredientesSelectorProps {
  value: UI_RecetaIngrediente[];
  onChange: (value: UI_RecetaIngrediente[]) => void;
}

const RecetaIngredientesSelector: React.FC<RecetaIngredientesSelectorProps> = ({
  value = [],
  onChange,
}) => {
  const [allProducts, setAllProducts] = useState<Producto[]>([]);
  const [productDetails, setProductDetails] = useState<
    Record<string, Producto>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [searchResultsByLine, setSearchResultsByLine] = useState<
    Record<number, Producto[]>
  >({});
  const [isSearchingByLine, setIsSearchingByLine] = useState<
    Record<number, boolean>
  >({});

  const getAvailableProviders = (
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
  };

  const getCheapestProvider = (
    providers: ProductoProveedor[]
  ): ProductoProveedor | undefined => {
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
  };

  const buildInlineProduct = (product: Producto) => ({
    id: product.id,
    nombre: product.nombre,
    alergenos: product.alergenos,
    proveedores: product.proveedores,
  });

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const limit = 50;
        let currentPage = 1;
        let totalPages = 1;
        const loadedProducts: Producto[] = [];

        do {
          const response = await fetchProductos(currentPage, limit);
          loadedProducts.push(...response.data);
          totalPages = response.totalPages || 1;
          currentPage += 1;
        } while (currentPage <= totalPages);

        const uniqueProducts = Array.from(
          new Map(
            loadedProducts.map((product) => [product.id, product])
          ).values()
        );

        setAllProducts(uniqueProducts);
      } catch (error) {
        console.error('Error loading products for recipe:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);

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

      setProductDetails((prev) => {
        const next = { ...prev };
        loadedProducts.forEach((product) => {
          if (product) {
            next[product.id] = product;
          }
        });
        return next;
      });
    };

    void loadMissingProductDetails();

    return () => {
      cancelled = true;
    };
  }, [value, productDetails]);

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
  }, [value, productDetails, onChange]);

  const handleAddLine = () => {
    const newLines = [
      ...value,
      { productoId: '', cantidad: 1, unidad: UnidadIngrediente.GRAMO },
    ];
    onChange(newLines);
  };

  const handleRemoveLine = (index: number) => {
    const newLines = value.filter((_, i) => i !== index);
    onChange(newLines);
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

  const handleProductSearch = async (index: number, query: string) => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      setSearchResultsByLine((prev) => ({ ...prev, [index]: [] }));
      setIsSearchingByLine((prev) => ({ ...prev, [index]: false }));
      return;
    }

    setIsSearchingByLine((prev) => ({ ...prev, [index]: true }));

    try {
      const products = await searchProductosByName(trimmedQuery);
      setSearchResultsByLine((prev) => ({ ...prev, [index]: products }));
    } catch (error) {
      console.error('Error searching products for recipe:', error);
      setSearchResultsByLine((prev) => ({ ...prev, [index]: [] }));
    } finally {
      setIsSearchingByLine((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleUpdateLine = (
    index: number,
    field: keyof UI_RecetaIngrediente,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    newValue: any
  ) => {
    const newLines = [...value];
    newLines[index] = { ...newLines[index], [field]: newValue };

    if (field === 'productoId' && newValue) {
      // Fetch the complete product with providers
      getProductoById(newValue).then((product) => {
        if (product) {
          setProductDetails((prev) => ({ ...prev, [product.id]: product }));

          const cheapestProvider = getCheapestProvider(
            product.proveedores || []
          );

          newLines[index].producto = {
            ...buildInlineProduct(product),
          };

          newLines[index].proveedorFavoritoId = cheapestProvider?.proveedor?.id;
          newLines[index].proveedorFavoritoAuto = Boolean(
            cheapestProvider?.proveedor?.id
          );
          onChange(newLines);
        }
      });
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
      const product = allProducts.find((p) => p.id === line.productoId);
      if (product && product.alergenos) {
        product.alergenos.forEach((a) => allergenSet.add(a.alergeno));
      } else if (line.producto && line.producto.alergenos) {
        line.producto.alergenos.forEach((a) => allergenSet.add(a.alergeno));
      }
    });

    return (
      Array.from(allergenSet)
        .map((id) => EU_ALLERGENS.find((ea) => ea.id === id))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((a): a is any => a !== undefined)
    );
  }, [value, allProducts]);

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
          Ingredientes de la Receta
        </Typography>
        <Button
          startIcon={<AddIcon />}
          variant="outlined"
          size="small"
          onClick={handleAddLine}
          disabled={isLoading}
        >
          Añadir Ingrediente
        </Button>
      </Box>

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
              Alérgenos en esta receta:
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

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 120 }}>
                  Cantidad
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 140 }}>
                  Unidad
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>
                  Proveedor fav.
                </TableCell>
                <TableCell sx={{ width: 50 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {value.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    align="center"
                    sx={{ py: 3, color: 'text.secondary' }}
                  >
                    No hay ingredientes añadidos a la receta
                  </TableCell>
                </TableRow>
              ) : (
                value.map((line, index) => {
                  const selectedProduct = line.productoId
                    ? productDetails[line.productoId] ||
                      allProducts.find((p) => p.id === line.productoId) ||
                      null
                    : null;
                  const availableProviders = getAvailableProviders(
                    line,
                    selectedProduct
                  );
                  const cheapestProviderId =
                    getCheapestProvider(availableProviders)?.proveedor?.id;

                  const optionsMap = new Map<string, Producto>();

                  [
                    ...allProducts,
                    ...(searchResultsByLine[index] || []),
                  ].forEach((product) => {
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
                      <TableCell sx={{ minWidth: 250 }}>
                        <Autocomplete
                          options={options}
                          getOptionLabel={(option) => option.nombre || ''}
                          value={selectedProduct || line.producto || null}
                          loading={Boolean(isSearchingByLine[index])}
                          openOnFocus
                          isOptionEqualToValue={(option, val) =>
                            (option.id || option) === (val.id || val)
                          }
                          onInputChange={(_, inputValue, reason) => {
                            if (reason === 'input') {
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
                          renderOption={(props, option) => (
                            <li {...props} key={option.id}>
                              {option.nombre}
                            </li>
                          )}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              variant="standard"
                              placeholder="Buscar producto..."
                              helperText="Escribe al menos 2 letras para buscar productos."
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
                          noOptionsText="No hay productos disponibles"
                          size="small"
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={line.cantidad || ''}
                          onChange={(e) =>
                            handleUpdateLine(
                              index,
                              'cantidad',
                              Number(e.target.value)
                            )
                          }
                          variant="standard"
                          inputProps={{ min: 0.01, step: 'any' }}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={line.unidad || ''}
                          onChange={(e) =>
                            handleUpdateLine(index, 'unidad', e.target.value)
                          }
                          variant="standard"
                          fullWidth
                        >
                          {Object.values(UnidadIngrediente).map((unidad) => (
                            <MenuItem key={unidad} value={unidad}>
                              {unidad}
                            </MenuItem>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={line.proveedorFavoritoId || ''}
                          onChange={(e) =>
                            handleUpdateLine(
                              index,
                              'proveedorFavoritoId',
                              e.target.value
                            )
                          }
                          variant="standard"
                          fullWidth
                          displayEmpty
                          disabled={!line.productoId}
                          renderValue={(val) => {
                            if (!val) {
                              return <em>Sin proveedor disponible</em>;
                            }

                            const selected = availableProviders.find(
                              (pp) => pp.proveedor?.id === val
                            );

                            if (selected) {
                              const isAutomatic =
                                line.proveedorFavoritoAuto ||
                                selected.proveedor?.id === cheapestProviderId;

                              return (
                                <Box
                                  sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 0.75,
                                    color: isAutomatic
                                      ? 'success.dark'
                                      : 'primary.dark',
                                    fontWeight: 'bold',
                                  }}
                                >
                                  <span>
                                    {selected.proveedor?.nombre} (
                                    {selected.precioUnitario}€)
                                  </span>
                                  {isAutomatic && (
                                    <Box
                                      component="span"
                                      sx={{
                                        fontSize: '0.7rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: 0.5,
                                        fontWeight: 700,
                                      }}
                                    >
                                      Auto
                                    </Box>
                                  )}
                                </Box>
                              );
                            }
                            return val;
                          }}
                        >
                          <MenuItem value="">
                            <em>Seleccionar automáticamente el más barato</em>
                          </MenuItem>
                          {availableProviders.map((pp) => (
                            <MenuItem
                              key={pp.proveedor?.id || 'unknown'}
                              value={pp.proveedor?.id}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
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
                                <span>
                                  {pp.proveedor?.nombre ||
                                    'Proveedor desconocido'}{' '}
                                  ({pp.precioUnitario}€)
                                </span>
                                {pp.proveedor?.id === cheapestProviderId && (
                                  <Box
                                    component="span"
                                    sx={{
                                      fontSize: '0.72rem',
                                      bgcolor: 'success.light',
                                      color: 'success.dark',
                                      px: 0.75,
                                      py: 0.15,
                                      borderRadius: 999,
                                      fontWeight: 700,
                                    }}
                                  >
                                    Más barato
                                  </Box>
                                )}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Quitar">
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
      )}
    </Box>
  );
};

export default RecetaIngredientesSelector;
