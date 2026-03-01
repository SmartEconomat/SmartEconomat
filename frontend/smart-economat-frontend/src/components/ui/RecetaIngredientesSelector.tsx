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
import { fetchProductos } from '../../services/producto.service';
import { Producto } from '../../services/producto.types';
import {
  RecetaIngrediente,
  UnidadIngrediente,
} from '../../services/receta.types';
import { EU_ALLERGENS } from './AllergenSelector';

export interface UI_RecetaIngrediente {
  productoId: string;
  cantidad: number;
  unidad: UnidadIngrediente;
  producto?: {
    id: string;
    nombre: string;
    alergenos?: { id_producto: string; alergeno: string }[];
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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoading(true);
      try {
        const products = await fetchProductos(1, 100);
        setAllProducts(products.data);
      } catch (error) {
        console.error('Error loading products for recipe:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, []);

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
  };

  const handleUpdateLine = (
    index: number,
    field: keyof UI_RecetaIngrediente,
    newValue: any
  ) => {
    const newLines = [...value];
    newLines[index] = { ...newLines[index], [field]: newValue };

    if (field === 'productoId') {
      const product = allProducts.find((p) => p.id === newValue);
      if (product) {
        newLines[index].producto = {
          id: product.id,
          nombre: product.nombre,
          alergenos: product.alergenos,
        };
      }
    }

    onChange(newLines);
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

    return Array.from(allergenSet)
      .map((id) => EU_ALLERGENS.find((ea) => ea.id === id))
      .filter((a): a is (typeof EU_ALLERGENS)[0] => a !== undefined);
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
                <TableCell sx={{ fontWeight: 'bold', width: 150 }}>
                  Unidad
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
                    ? allProducts.find((p) => p.id === line.productoId)
                    : null;

                  // Para opciones iniciales en caso de modo edición
                  const options = [...allProducts];
                  if (
                    line.producto &&
                    !allProducts.find((p) => p.id === line.producto?.id)
                  ) {
                    options.push(line.producto as any);
                  }

                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <Autocomplete
                          options={options}
                          getOptionLabel={(option) => option.nombre || ''}
                          value={selectedProduct || line.producto || null}
                          isOptionEqualToValue={(option, val) =>
                            option.id === val.id
                          }
                          onChange={(_, newValue) =>
                            handleUpdateLine(
                              index,
                              'productoId',
                              newValue?.id || ''
                            )
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              variant="standard"
                              placeholder="Buscar producto..."
                            />
                          )}
                          size="small"
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
