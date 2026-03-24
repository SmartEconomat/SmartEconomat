import React, { useState, useEffect } from 'react';
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
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import {
  searchProductoProveedor,
  ProductoProveedorOption,
} from '../../services/productoProveedor.service';
import { PedidoProducto } from '../../services/pedido.types';

interface PedidoLineasSelectorProps {
  value: Partial<PedidoProducto>[];
  onChange: (value: Partial<PedidoProducto>[]) => void;
  proveedorId?: string;
  disabled?: boolean;
}

interface FlatProductoProveedor {
  id: string; // id de ProductoProveedor
  nombreProducto: string;
  nombreProveedor: string;
  proveedorId: string;
  precioUnitario: number;
  marca?: string;
}

type ProductoProveedorSearchResult = ProductoProveedorOption & {
  precioUnitario?: number;
};

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

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        // Usar searchProductoProveedor sin filtro para obtener todos los productos-proveedores
        const productoProveedores = await searchProductoProveedor('', 50, 0);
        const flat: FlatProductoProveedor[] = productoProveedores.map((pp) => ({
          id: pp.id,
          nombreProducto: pp.productoNombre || 'Desconocido',
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
    const newLines = [
      ...value,
      {
        productoProveedorId: '',
        cantidad: 1,
        precioUnitario: 0,
        _key: `${Date.now()}-${Math.random()}`,
      },
    ];
    onChange(newLines);
  };

  const handleRemoveLine = (index: number) => {
    const newLines = value.filter((_, i) => i !== index);
    onChange(newLines);
  };

  const filteredProducts = allFlatProducts;

  const buildOptionLabel = (option: FlatProductoProveedor) => {
    const label = `${option.nombreProducto} (${option.nombreProveedor})`;
    return option.marca ? `${label} - ${option.marca}` : label;
  };

  // Obtener opciones del Autocomplete incluyendo productos existentes en el valor
  const getAutocompleteOptions = React.useMemo(() => {
    const optionsMap = new Map<string, FlatProductoProveedor>();

    filteredProducts.forEach((p) => optionsMap.set(p.id, p));

    // Siempre agregamos también productos existentes en 'value' por si no estuvieran en allFlatProducts
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
            nombreProducto:
              lineData.productoProveedor.producto?.nombre || 'Desconocido',
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

    // Si cambiamos el producto, actualizamos automáticamente el precio unitario
    if (field === 'productoProveedorId') {
      const product = getAutocompleteOptions.find((p) => p.id === newValue);
      if (product) {
        newLines[index].precioUnitario = product.precioUnitario;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (newLines[index] as any).proveedorId = product.proveedorId;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (newLines[index] as any).nombreProveedor = product.nombreProveedor;
      }
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lineData = line as any;
    let pId = lineData.proveedorId;
    let pName = lineData.nombreProveedor;

    if (lineData.productoProveedorId) {
      const prod = getAutocompleteOptions.find(
        (p) => p.id === lineData.productoProveedorId
      );

      if (prod) {
        pId = prod.proveedorId;
        pName = prod.nombreProveedor;
      }
    }

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
    groupId: string
  ) => {
    const groupTotal = groupLines.reduce(
      (sum, item) =>
        sum +
        Number(item.line.cantidad || 0) * Number(item.line.precioUnitario || 0),
      0
    );

    return (
      <Box key={groupId} sx={{ mb: 4 }}>
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
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 120 }}>
                  Cantidad
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 120 }}>
                  Precio Unid.
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: 120 }}>
                  Subtotal
                </TableCell>
                {!disabled && <TableCell sx={{ width: 50 }}></TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {groupLines.map(({ line, originalIndex }) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const lineData = line as any;
                const selectedProduct = getAutocompleteOptions.find(
                  (p) => p.id === lineData.productoProveedorId
                );
                const uniqueKey =
                  lineData._key ||
                  lineData.id ||
                  `${groupId}-${lineData.productoProveedorId || 'linea'}-${originalIndex}`;

                return (
                  <TableRow key={uniqueKey}>
                    <TableCell>
                      {disabled ? (
                        <Typography variant="body2" sx={{ my: 1 }}>
                          {selectedProduct
                            ? `${selectedProduct.nombreProducto} (${selectedProduct.nombreProveedor}) ${selectedProduct.marca ? `- ${selectedProduct.marca}` : ''}`
                            : '(Producto no encontrado)'}
                        </Typography>
                      ) : (
                        <Autocomplete
                          id={`pedido-linea-producto-${groupId}-${originalIndex}`}
                          options={getAutocompleteOptions}
                          getOptionLabel={buildOptionLabel}
                          getOptionKey={(option) => option.id}
                          value={selectedProduct || null}
                          isOptionEqualToValue={(option, val) =>
                            option.id === val.id
                          }
                          onChange={(_, newValue) =>
                            handleUpdateLine(
                              originalIndex,
                              'productoProveedorId',
                              newValue?.id || ''
                            )
                          }
                          disabled={disabled}
                          renderOption={(props, option) => {
                            const { key, ...restProps } =
                              props as React.HTMLAttributes<HTMLLIElement> & {
                                key?: React.Key;
                              };
                            return (
                              <li {...restProps} key={key}>
                                {buildOptionLabel(option)}
                              </li>
                            );
                          }}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              id={`pedido-linea-producto-input-${groupId}-${originalIndex}`}
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
                        <Typography variant="body2">
                          {line.cantidad || 0}
                        </Typography>
                      ) : (
                        <TextField
                          type="number"
                          disabled={disabled}
                          value={line.cantidad || ''}
                          onChange={(e) =>
                            handleUpdateLine(
                              originalIndex,
                              'cantidad',
                              Number(e.target.value)
                            )
                          }
                          variant="standard"
                          inputProps={{ min: 0.001, step: 'any' }}
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
                          disabled={disabled}
                          value={line.precioUnitario || ''}
                          onChange={(e) =>
                            handleUpdateLine(
                              originalIndex,
                              'precioUnitario',
                              Number(e.target.value)
                            )
                          }
                          variant="standard"
                          inputProps={{ min: 0, step: '0.01' }}
                          size="small"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {(
                          Number(line.cantidad || 0) *
                          Number(line.precioUnitario || 0)
                        ).toFixed(2)}{' '}
                        €
                      </Typography>
                    </TableCell>
                    {!disabled && (
                      <TableCell>
                        <Tooltip title="Quitar">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveLine(originalIndex)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {groupTotal > 0 && (
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell
                    colSpan={3}
                    align="right"
                    sx={{ fontWeight: 'bold' }}
                  >
                    SUBTOTAL {proveedorName}:
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {groupTotal.toFixed(2)} €
                  </TableCell>
                  {!disabled && <TableCell></TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

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
          Líneas del Pedido{' '}
          {!proveedorId && !disabled ? '(Multi-Proveedor Habilitado)' : ''}
        </Typography>
        {!disabled && (
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
        )}
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : value.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{ p: 4, textAlign: 'center', bgcolor: 'transparent' }}
        >
          <Typography color="text.secondary">
            Aún no hay ningún producto en la cesta. Usa el botón "Añadir
            Producto" para comenzar.
          </Typography>
        </Paper>
      ) : (
        <Box>
          {Array.from(groups.entries()).map(([groupId, group]) =>
            renderLinesForGroup(group.lines, group.proveedorNombre, groupId)
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
