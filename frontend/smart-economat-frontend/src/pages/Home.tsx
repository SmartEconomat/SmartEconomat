import React from 'react';
import { Typography, Box, Paper } from '@mui/material';
import { useAuth } from '../store/AuthContext';

const Home: React.FC = () => {
    const { user } = useAuth();

    return (
        <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
                Hola, <strong>{user?.name}</strong>. Bienvenido al sistema de gestión Smart Economat.
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ flex: { xs: '1 1 100%', md: '0 1 300px' } }}>
                    <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 200 }}>
                        <Typography variant="h6" component="h3" gutterBottom color="primary">
                            Nuevo Artículo
                        </Typography>
                        <Typography variant="body2">
                            Ejemplo de tarjeta para accesos rápidos.
                        </Typography>
                    </Paper>
                </Box>
                <Box sx={{ flex: { xs: '1 1 100%', md: '0 1 300px' } }}>
                    <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 200 }}>
                        <Typography variant="h6" component="h3" gutterBottom color="primary">
                            Nuevo Pedido
                        </Typography>
                        <Typography variant="body2">
                            Ejemplo de tarjeta para accesos rápidos.
                        </Typography>
                    </Paper>
                </Box>
                {/* Añadir más tarjetas aquí */}
            </Box>
        </Box>
    );
};

export default Home;
