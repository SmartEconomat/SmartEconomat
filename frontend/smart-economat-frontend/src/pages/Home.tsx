import React from 'react';
import { Typography, Box, Paper } from '@mui/material';

const Home: React.FC = () => {
    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Inicio
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
                Bienvenido al sistema de gestión Smart Economat.
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ flex: { xs: '1 1 100%', md: '0 1 300px' } }}>
                    <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 200 }}>
                        <Typography variant="h6" gutterBottom color="primary">
                            Accesos Rápidos
                        </Typography>
                        <Typography variant="body2">
                            Aquí podrás ver los accesos directos a las funciones más utilizadas.
                        </Typography>
                    </Paper>
                </Box>
                {/* Añadir más tarjetas aquí */}
            </Box>
        </Box>
    );
};

export default Home;
