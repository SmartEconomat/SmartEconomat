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
    Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { fetchProductos } from '../../services/producto.service';
import { Producto } from '../../services/producto.types';
import { PedidoProducto } from '../../services/pedido.types';

interface PedidoLineasSelectorProps {
    value: Partial<PedidoProducto>[];
    onChange: (value: Partial<PedidoProducto>[]) => void;
}

interface FlatProductoProveedor {
    id: string; // id de ProductoProveedor
    nombreProducto: string;
    nombreProveedor: string;
    precioUnitario: number;
    marca?: string;
}

const PedidoLineasSelector: React.FC<PedidoLineasSelectorProps> = ({ value = [], onChange }) => {
    const [allFlatProducts, setAllFlatProducts] = useState<FlatProductoProveedor[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const loadProducts = async () => {
            setIsLoading(true);
            try {
                const products = await fetchProductos();
                const flat: FlatProductoProveedor[] = [];
                products.forEach(p => {
                    p.proveedores?.forEach(pp => {
                        flat.push({
                            id: pp.id,
                            nombreProducto: p.nombre,
                            nombreProveedor: pp.proveedor?.nombre || 'Desconocido',
                            precioUnitario: (pp as any).precioUnitario || 0,
                            marca: (pp as any).marca
                        });
                    });
                });
                setAllFlatProducts(flat);
            } catch (error) {
                console.error("Error loading products for order:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadProducts();
    }, []);

    const handleAddLine = () => {
        const newLines = [...value, { productoProveedorId: '', cantidad: 1, precioUnitario: 0 }];
        onChange(newLines);
    };

    const handleRemoveLine = (index: number) => {
        const newLines = value.filter((_, i) => i !== index);
        onChange(newLines);
    };

    const handleUpdateLine = (index: number, field: string, newValue: any) => {
        const newLines = [...value];
        newLines[index] = { ...newLines[index], [field]: newValue };
        
        // Si cambiamos el producto, actualizamos automáticamente el precio unitario
        if (field === 'productoProveedorId') {
            const product = allFlatProducts.find(p => p.id === newValue);
            if (product) {
                newLines[index].precioUnitario = product.precioUnitario;
            }
        }
        
        onChange(newLines);
    };

    const totalOrder = value.reduce((sum, line) => sum + (Number(line.cantidad || 0) * Number(line.precioUnitario || 0)), 0);

    return (
        <Box sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Líneas del Pedido
                </Typography>
                <Button 
                    startIcon={<AddIcon />} 
                    variant="outlined" 
                    size="small" 
                    onClick={handleAddLine}
                    disabled={isLoading}
                >
                    Añadir Producto
                </Button>
            </Box>

            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress size={24} />
                </Box>
            ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: 'action.hover' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Producto / Proveedor</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', width: 120 }}>Cantidad</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', width: 120 }}>Precio Unid.</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', width: 120 }}>Subtotal</TableCell>
                                <TableCell sx={{ width: 50 }}></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {value.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                        No hay productos añadidos al pedido
                                    </TableCell>
                                </TableRow>
                            ) : (
                                value.map((line, index) => {
                                    const selectedProduct = allFlatProducts.find(p => p.id === (line as any).productoProveedorId);
                                    
                                    return (
                                        <TableRow key={index}>
                                            <TableCell>
                                                <Autocomplete
                                                    options={allFlatProducts}
                                                    getOptionLabel={(option) => `${option.nombreProducto} (${option.nombreProveedor}) ${option.marca ? `- ${option.marca}` : ''}`}
                                                    value={selectedProduct || null}
                                                    onChange={(_, newValue) => handleUpdateLine(index, 'productoProveedorId', newValue?.id || '')}
                                                    renderInput={(params) => (
                                                        <TextField {...params} variant="standard" placeholder="Buscar producto..." />
                                                    )}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField 
                                                    type="number"
                                                    value={line.cantidad || ''}
                                                    onChange={(e) => handleUpdateLine(index, 'cantidad', Number(e.target.value))}
                                                    variant="standard"
                                                    inputProps={{ min: 0.001, step: "any" }}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <TextField 
                                                    type="number"
                                                    value={line.precioUnitario || ''}
                                                    onChange={(e) => handleUpdateLine(index, 'precioUnitario', Number(e.target.value))}
                                                    variant="standard"
                                                    inputProps={{ min: 0, step: "0.01" }}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {(Number(line.cantidad || 0) * Number(line.precioUnitario || 0)).toFixed(2)} €
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title="Quitar">
                                                    <IconButton size="small" color="error" onClick={() => handleRemoveLine(index)}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                            {value.length > 0 && (
                                <TableRow sx={{ bgcolor: 'action.hover' }}>
                                    <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>
                                        TOTAL ESTIMADO:
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>
                                        {totalOrder.toFixed(2)} €
                                    </TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
};

export default PedidoLineasSelector;
