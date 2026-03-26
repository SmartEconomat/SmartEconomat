import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  IconButton,
  MenuItem,
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
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import {
  searchProductoProveedor,
  ProductoProveedorOption,
} from '../../services/productoProveedor.service';
import { PedidoProducto } from '../../services/pedido.types';
import {
  normalizeUnidadMedida,
  UnidadMedida,
} from '../../services/producto.types';

interface PedidoLineasSelectorProps {
  value: Partial<PedidoProducto>[];
  onChange: (value: Partial<PedidoProducto>[]) => void;
  proveedorId?: string;
  disabled?: boolean;
}

interface FlatProductoProveedor {
  id: string; // id de ProductoProveedor
  productoId: string;
  nombreProducto: string;
  unidad?: UnidadMedida;
  contenido?: number;
  nombreProveedor: string;
  proveedorId: string;
  precioUnitario: number;
  marca?: string;
}

interface ProductOption {
  key: string;
  productoId: string;
  nombreProducto: string;
  proveedores: FlatProductoProveedor[];
}

type ProductoProveedorSearchResult = ProductoProveedorOption & {
  precioUnitario?: number;
};

const buildProductKey = (productoId?: string, nombreProducto?: string) =>
  productoId ||
  `nombre:${(nombreProducto || 'desconocido').trim().toLowerCase()}`;

const createEmptyLine = () => ({
  productoId: '',
  productoProveedorId: '',
  proveedorId: '',
  unidad: undefined,
  contenido: undefined,
  cantidad: 1,
  precioUnitario: 0,
  _key: `${Date.now()}-${Math.random()}`,
});

const getStableLineKey = (
  line: Partial<PedidoProducto> & {
    id?: string;
    _key?: string;
    productoProveedorId?: string;
  },
  originalIndex: number
) =>
  line.id || line._key || line.productoProveedorId || `line-${originalIndex}`;

const isDiscreteUnit = (unidad?: UnidadMedida) =>
  unidad === UnidadMedida.UNIDAD || unidad === UnidadMedida.PAQ;

const getUnidadLabel = (unidad?: UnidadMedida) => {
  switch (unidad) {
    case UnidadMedida.KG:
      return 'kg';
    case UnidadMedida.G:
      return 'g';
    case UnidadMedida.L:
      return 'l';
    case UnidadMedida.ML:
      return 'ml';
    case UnidadMedida.UNIDAD:
      return 'uds';
    case UnidadMedida.PAQ:
      return 'paq';
    default:
      return '—';
  }
};

const formatContenido = (contenido?: number, unidad?: UnidadMedida) => {
  if (!Number.isFinite(contenido) || !contenido || contenido <= 0) {
    return '';
  }

  return `${contenido} ${getUnidadLabel(unidad)}`;
};

const hasPackageFormat = (contenido?: number, unidad?: UnidadMedida) =>
  Boolean(Number.isFinite(contenido) && contenido && contenido > 0 && unidad);

const PedidoLineasSelector: React.FC<PedidoLineasSelectorProps> = ({
  value = [],
  onChange,
  proveedorId,
  disabled = false,
}) => {
  const [allFlatProducts, setAllFlatProducts] = useState<
    FlatProductoProveedor[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedQuantityKey, setFocusedQuantityKey] = useState<string | null>(
    null
  );

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        // Usar searchProductoProveedor sin filtro para obtener todos los productos-proveedores
        const productoProveedores = await searchProductoProveedor('', 50, 0);
        const flat: FlatProductoProveedor[] = productoProveedores.map((pp) => ({
          id: pp.id,
          productoId:
            pp.productoId || buildProductKey(undefined, pp.productoNombre),
          nombreProducto: pp.productoNombre || 'Desconocido',
          unidad: normalizeUnidadMedida(pp.unidad),
          contenido: pp.contenido,
          nombreProveedor: pp.proveedorNombre || 'Desconocido',
          proveedorId: pp.proveedorId || '',
          precioUnitario: Number(
            (pp as ProductoProveedorSearchResult).precioUnitario ?? 0
          ),
          marca: pp.marca,
        }));
        setAllFlatProducts(flat);
      } catch (error) {
        console.error('Error loading products for order:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);

  const handleAddLine = () => {
    const newLines = [...value, createEmptyLine()];
    onChange(newLines);
  };

  const handleRemoveLine = (index: number) => {
    const newLines = value.filter((_, i) => i !== index);
    onChange(newLines);
  };

  const filteredProducts = allFlatProducts;

  const providerEntries = React.useMemo(() => {
    const optionsMap = new Map<string, FlatProductoProveedor>();

    filteredProducts.forEach((p) => optionsMap.set(p.id, p));

    value.forEach((line) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lineData = line as any;
      if (
        lineData.productoProveedorId &&
        !optionsMap.has(lineData.productoProveedorId)
      ) {
        if (lineData.productoProveedor) {
          optionsMap.set(lineData.productoProveedorId, {
            id: lineData.productoProveedorId,
            productoId:
              lineData.productoProveedor.producto?.id ||
              buildProductKey(
                undefined,
                lineData.productoProveedor.producto?.nombre
              ),
            nombreProducto:
              lineData.productoProveedor.producto?.nombre || 'Desconocido',
            unidad: normalizeUnidadMedida(
              lineData.productoProveedor.producto?.unidad
            ),
            contenido: lineData.productoProveedor.producto?.contenido,
            nombreProveedor:
              lineData.productoProveedor.proveedor?.nombre || 'Desconocido',
            proveedorId: lineData.productoProveedor.proveedor?.id || '',
            precioUnitario: lineData.precioUnitario || 0,
            marca: lineData.productoProveedor.marca,
          });
        }
      }
    });

    return Array.from(optionsMap.values());
  }, [filteredProducts, value]);

  const productOptions = React.useMemo(() => {
    const map = new Map<string, ProductOption>();

    providerEntries.forEach((entry) => {
      const key = buildProductKey(entry.productoId, entry.nombreProducto);
      if (!map.has(key)) {
        map.set(key, {
          key,
          productoId: entry.productoId,
          nombreProducto: entry.nombreProducto,
          proveedores: [],
        });
      }
      map.get(key)?.proveedores.push(entry);
    });

    return Array.from(map.values()).sort((left, right) =>
      left.nombreProducto.localeCompare(right.nombreProducto, 'es')
    );
  }, [providerEntries]);

  const getProviderOptionsByProduct = React.useCallback(
    (productoId?: string, nombreProducto?: string) => {
      const key = buildProductKey(productoId, nombreProducto);
      return (
        productOptions.find((option) => option.key === key)?.proveedores || []
      );
    },
    [productOptions]
  );

  const applyProviderSelection = React.useCallback(
    (
      line: Partial<PedidoProducto> & {
        productoId?: string;
        proveedorId?: string;
        nombreProveedor?: string;
        nombreProducto?: string;
        unidad?: UnidadMedida;
        contenido?: number;
        _key?: string;
      },
      provider: FlatProductoProveedor | null
    ) => {
      if (!provider) {
        return {
          ...line,
          productoProveedorId: '',
          proveedorId: '',
          nombreProveedor: '',
          unidad: undefined,
          contenido: undefined,
          precioUnitario: 0,
        };
      }

      return {
        ...line,
        productoId: provider.productoId,
        nombreProducto: provider.nombreProducto,
        unidad: provider.unidad,
        contenido: provider.contenido,
        productoProveedorId: provider.id,
        proveedorId: provider.proveedorId,
        nombreProveedor: provider.nombreProveedor,
        precioUnitario: provider.precioUnitario,
      };
    },
    []
  );

  const getSelectedProductOption = React.useCallback(
    (line: Partial<PedidoProducto>) => {
      const current = line as Partial<PedidoProducto> & {
        productoId?: string;
        nombreProducto?: string;
      };

      const selectedProvider = providerEntries.find(
        (entry) => entry.id === current.productoProveedorId
      );

      const resolvedProductId =
        current.productoId ||
        selectedProvider?.productoId ||
        current.productoProveedor?.producto?.id;
      const resolvedProductName =
        current.nombreProducto ||
        selectedProvider?.nombreProducto ||
        current.productoProveedor?.producto?.nombre;

      return (
        productOptions.find(
          (option) =>
            option.key ===
            buildProductKey(resolvedProductId, resolvedProductName)
        ) || null
      );
    },
    [productOptions, providerEntries]
  );

  const getSelectedProviderOption = React.useCallback(
    (line: Partial<PedidoProducto>) => {
      const current = line as Partial<PedidoProducto> & {
        proveedorId?: string;
      };

      return (
        providerEntries.find(
          (entry) => entry.id === current.productoProveedorId
        ) ||
        providerEntries.find(
          (entry) =>
            entry.proveedorId === current.proveedorId &&
            entry.productoId ===
              (current as Partial<PedidoProducto> & { productoId?: string })
                .productoId
        ) ||
        null
      );
    },
    [providerEntries]
  );

  const handleProductChange = (
    index: number,
    product: ProductOption | null
  ) => {
    const newLines = [...value];
    const currentLine = newLines[index] as Partial<PedidoProducto> & {
      productoId?: string;
      proveedorId?: string;
      nombreProveedor?: string;
      nombreProducto?: string;
      unidad?: UnidadMedida;
      contenido?: number;
      _key?: string;
    };

    if (!product) {
      const clearedLine: typeof currentLine = {
        ...currentLine,
        productoId: '',
        nombreProducto: '',
        productoProveedorId: '',
        proveedorId: '',
        nombreProveedor: '',
        unidad: undefined,
        contenido: undefined,
        precioUnitario: 0,
      };
      newLines[index] = clearedLine;
      onChange(newLines);
      return;
    }

    const providers = product.proveedores;
    const baseLine = {
      ...currentLine,
      productoId: product.productoId,
      nombreProducto: product.nombreProducto,
    };

    newLines[index] =
      providers.length === 1
        ? applyProviderSelection(baseLine, providers[0])
        : applyProviderSelection(baseLine, null);

    onChange(newLines);
  };

  const handleProviderChange = (index: number, providerId: string) => {
    const newLines = [...value];
    const currentLine = newLines[index] as Partial<PedidoProducto> & {
      productoId?: string;
      proveedorId?: string;
      nombreProveedor?: string;
      nombreProducto?: string;
    };
    const provider = providerEntries.find((entry) => entry.id === providerId);
    newLines[index] = applyProviderSelection(currentLine, provider || null);
    onChange(newLines);
  };

  const handleUpdateLine = (
    index: number,
    field: string,
    newValue: unknown
  ) => {
    const newLines = [...value];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lineData = newLines[index] as any;
    newLines[index] = { ...newLines[index], [field]: newValue };

    // Preservar la clave única si existe
    if (lineData._key) {
      (newLines[index] as Partial<PedidoProducto> & { _key?: string })._key =
        lineData._key;
    }

    onChange(newLines);
  };

  // La lógica que autolimpiaba las líneas de otros proveedores ha sido eliminada
  // para permitir crear pedidos multi-proveedor desde el mismo modal.

  const totalOrder = value.reduce(
    (sum, line) =>
      sum + Number(line.cantidad || 0) * Number(line.precioUnitario || 0),
    0
  );

  const groups = new Map<
    string,
    {
      proveedorNombre: string;
      lines: Array<{ line: Partial<PedidoProducto>; originalIndex: number }>;
    }
  >();

  groups.set('empty', {
    proveedorNombre: 'Nuevos Productos (Selecciona uno)',
    lines: [],
  });

  value.forEach((line, index) => {
    const selectedProvider = getSelectedProviderOption(line);
    const pId = selectedProvider?.proveedorId || '';
    const pName = selectedProvider?.nombreProveedor || '';

    if (!pId) {
      groups.get('empty')!.lines.push({ line, originalIndex: index });
    } else {
      if (!groups.has(pId)) {
        groups.set(pId, {
          proveedorNombre: pName || 'Proveedor Desconocido',
          lines: [],
        });
      }
      groups.get(pId)!.lines.push({ line, originalIndex: index });
    }
  });

  if (groups.get('empty')!.lines.length === 0) {
    groups.delete('empty');
  }
  const renderLinesForGroup = (
    groupLines: Array<{ line: Partial<PedidoProducto>; originalIndex: number }>,
    proveedorName: string,
    options?: {
      showProviderTitle?: boolean;
      showGroupSubtotal?: boolean;
    }
  ) => {
    const showProviderTitle = options?.showProviderTitle ?? true;
    const showGroupSubtotal = options?.showGroupSubtotal ?? true;
    const wrapperMarginBottom = showGroupSubtotal ? 4 : 1;
    const groupTotal = groupLines.reduce(
      (sum, item) =>
        sum +
        Number(item.line.cantidad || 0) * Number(item.line.precioUnitario || 0),
      0
    );

    return (
      <Box key={proveedorName} sx={{ mb: wrapperMarginBottom }}>
        {showProviderTitle && (
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 'bold',
              mb: 1,
              color: 'primary.main',
              borderBottom: '1px solid #ccc',
              pb: 0.5,
            }}
          >
            Proveedor: {proveedorName}
          </Typography>
        )}
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 220 }}>
                  Proveedor
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 120 }}>
                  Cantidad
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 120 }}>
                  Precio Unid.
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 120 }}>
                  Subtotal
                </TableCell>
                {!disabled && (
                  <TableCell
                    sx={{ width: 32, minWidth: 32, px: 0.5 }}
                  ></TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {groupLines.map(({ line, originalIndex }) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const lineData = line as any;
                const selectedProduct = getSelectedProductOption(line);
                const selectedProvider = getSelectedProviderOption(line);
                const selectedUnit =
                  selectedProvider?.unidad ||
                  normalizeUnidadMedida(lineData.unidad) ||
                  normalizeUnidadMedida(
                    lineData.productoProveedor?.producto?.unidad
                  );
                const selectedContenido =
                  selectedProvider?.contenido ||
                  lineData.contenido ||
                  lineData.productoProveedor?.producto?.contenido;
                const isPackageQuantity = hasPackageFormat(
                  selectedContenido,
                  selectedUnit
                );

                const quantityStep =
                  isPackageQuantity || isDiscreteUnit(selectedUnit) ? 1 : 'any';
                const quantityMin =
                  isPackageQuantity || isDiscreteUnit(selectedUnit) ? 1 : 0.001;
                const quantityFocusMessage = isPackageQuantity
                  ? `Este producto se pide por paquetes de ${formatContenido(selectedContenido, selectedUnit)}.`
                  : selectedUnit
                    ? `Este producto se pide en ${getUnidadLabel(selectedUnit)}.`
                    : '';
                const providerOptions = getProviderOptionsByProduct(
                  selectedProduct?.productoId,
                  selectedProduct?.nombreProducto
                );
                const uniqueKey = getStableLineKey(lineData, originalIndex);

                return (
                  <TableRow
                    key={uniqueKey}
                    sx={{
                      '& > td': {
                        verticalAlign: 'top',
                      },
                    }}
                  >
                    <TableCell>
                      {disabled ? (
                        <Typography variant="body2" sx={{ my: 1 }}>
                          {selectedProduct
                            ? selectedProduct.nombreProducto
                            : '(Producto no encontrado)'}
                        </Typography>
                      ) : (
                        <Autocomplete
                          options={productOptions}
                          getOptionKey={(option) => option.key}
                          getOptionLabel={(option) =>
                            option.proveedores.length > 1
                              ? `${option.nombreProducto} (${option.proveedores.length} proveedores)`
                              : option.nombreProducto
                          }
                          isOptionEqualToValue={(option, currentValue) =>
                            option.key === currentValue.key
                          }
                          value={selectedProduct || null}
                          onChange={(_, newValue) =>
                            handleProductChange(originalIndex, newValue)
                          }
                          disabled={disabled}
                          renderOption={(props, option) => {
                            return (
                              <li {...props} key={option.key}>
                                {option.proveedores.length > 1
                                  ? `${option.nombreProducto} (${option.proveedores.length} proveedores)`
                                  : option.nombreProducto}
                              </li>
                            );
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              variant="standard"
                              placeholder={disabled ? '' : 'Buscar producto...'}
                            />
                          )}
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {disabled ? (
                        <Typography variant="body2" sx={{ my: 1 }}>
                          {selectedProvider?.nombreProveedor ||
                            lineData.nombreProveedor ||
                            '—'}
                        </Typography>
                      ) : providerOptions.length <= 1 ? (
                        <TextField
                          variant="standard"
                          fullWidth
                          value={providerOptions[0]?.nombreProveedor || ''}
                          placeholder={
                            selectedProduct
                              ? 'Proveedor automático'
                              : 'Selecciona un producto'
                          }
                          InputProps={{ readOnly: true }}
                        />
                      ) : (
                        <TextField
                          select
                          variant="standard"
                          fullWidth
                          value={selectedProvider?.id || ''}
                          onChange={(event) =>
                            handleProviderChange(
                              originalIndex,
                              event.target.value
                            )
                          }
                          placeholder="Selecciona proveedor"
                        >
                          <MenuItem value="" disabled>
                            Selecciona proveedor
                          </MenuItem>
                          {providerOptions.map((provider) => (
                            <MenuItem key={provider.id} value={provider.id}>
                              {provider.nombreProveedor}
                              {provider.marca ? ` - ${provider.marca}` : ''}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    </TableCell>
                    <TableCell>
                      {disabled ? (
                        <Typography variant="body2">
                          {line.cantidad || 0}{' '}
                          {isPackageQuantity
                            ? `paq. (${formatContenido(selectedContenido, selectedUnit)})`
                            : getUnidadLabel(selectedUnit)}
                        </Typography>
                      ) : (
                        <TextField
                          type="number"
                          disabled={disabled}
                          value={line.cantidad || ''}
                          onChange={(e) => {
                            const rawValue = e.target.value;

                            if (rawValue === '') {
                              handleUpdateLine(originalIndex, 'cantidad', '');
                              return;
                            }

                            const parsedValue =
                              isPackageQuantity || isDiscreteUnit(selectedUnit)
                                ? Math.trunc(Number(rawValue))
                                : Number(rawValue);

                            handleUpdateLine(
                              originalIndex,
                              'cantidad',
                              parsedValue
                            );
                          }}
                          variant="standard"
                          inputProps={{
                            min: quantityMin,
                            step: quantityStep,
                            inputMode:
                              isPackageQuantity || isDiscreteUnit(selectedUnit)
                                ? 'numeric'
                                : 'decimal',
                          }}
                          helperText={
                            focusedQuantityKey === uniqueKey
                              ? quantityFocusMessage
                              : ' '
                          }
                          onFocus={() => setFocusedQuantityKey(uniqueKey)}
                          onBlur={() =>
                            setFocusedQuantityKey((current) =>
                              current === uniqueKey ? null : current
                            )
                          }
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {disabled ? (
                        <Typography variant="body2">
                          {line.precioUnitario || '0.00'} €
                        </Typography>
                      ) : (
                        <TextField
                          type="number"
                          value={line.precioUnitario || ''}
                          onChange={(e) =>
                            handleUpdateLine(
                              originalIndex,
                              'precioUnitario',
                              Number(e.target.value)
                            )
                          }
                          variant="standard"
                          inputProps={{ step: '0.01' }}
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ my: 1 }}>
                        {(
                          Number(line.cantidad || 0) *
                          Number(line.precioUnitario || 0)
                        ).toFixed(2)}{' '}
                        €
                      </Typography>
                    </TableCell>
                    {!disabled && (
                      <TableCell sx={{ width: 32, minWidth: 32, px: 0.5 }}>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveLine(originalIndex)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        {showGroupSubtotal && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mr: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Subtotal Proveedor: <strong>{groupTotal.toFixed(2)} €</strong>
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Box
        sx={{
          mb: 2,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          Líneas del Pedido{' '}
          {!proveedorId && !disabled ? '(Multi-Proveedor Habilitado)' : ''}
        </Typography>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : value.length === 0 ? (
        <Box>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 220 }}>
                    Proveedor
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 120 }}>
                    Cantidad
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 120 }}>
                    Precio Unid.
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', width: 120 }}>
                    Subtotal
                  </TableCell>
                  {!disabled && (
                    <TableCell
                      sx={{ width: 32, minWidth: 32, px: 0.5 }}
                    ></TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell
                    colSpan={disabled ? 5 : 6}
                    align="center"
                    sx={{ py: 4 }}
                  >
                    <Typography color="text.secondary">
                      Aún no hay ningún producto en la cesta. Usa el botón
                      "Añadir Producto" para comenzar.
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {!disabled && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
              <Button
                startIcon={<AddIcon />}
                variant="outlined"
                size="small"
                onClick={handleAddLine}
                disabled={isLoading}
                color="primary"
              >
                Añadir Producto
              </Button>
            </Box>
          )}
        </Box>
      ) : (
        <Box>
          {disabled
            ? Array.from(groups.values()).map((group) =>
                renderLinesForGroup(group.lines, group.proveedorNombre)
              )
            : renderLinesForGroup(
                value.map((line, originalIndex) => ({ line, originalIndex })),
                'Líneas del pedido',
                {
                  showProviderTitle: false,
                  showGroupSubtotal: false,
                }
              )}

          {!disabled && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
              <Button
                startIcon={<AddIcon />}
                variant="outlined"
                size="small"
                onClick={handleAddLine}
                disabled={isLoading}
                color="primary"
              >
                Añadir Producto
              </Button>
            </Box>
          )}

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              mt: 1,
              p: 2,
              bgcolor: 'action.hover',
              borderRadius: 1,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              TOTAL ESTIMADO: {totalOrder.toFixed(2)} €
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default PedidoLineasSelector;
