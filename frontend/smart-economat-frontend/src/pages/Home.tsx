import { Typography, Box, Paper, Button } from '@mui/material';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';

const Home: React.FC = () => {
    const { user } = useAuth();
    const toast = useToast();

    const handleTestToast = () => {
        toast.success('¡Sistema de notificaciones funcionando correctamente!');
    };

    return (
        <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
                Hola, <strong>{user?.name}</strong>. Bienvenido al sistema de gestión Smart Economat.
            </Typography>

            <Button
                variant="contained"
                onClick={handleTestToast}
                sx={{ mb: 4 }}
            >
                Probar Notificación
            </Button>

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
