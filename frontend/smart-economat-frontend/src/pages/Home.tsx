import { useState } from 'react';
import { Typography, Box, Paper, Button, Stack } from '@mui/material';
import Modal from '../components/ui/Modal';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';
import StatusChip from '../components/ui/StatusChip';

const Home: React.FC = () => {
    const { user } = useAuth();
    const toast = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleTestToast = () => {
        toast.success('¡Sistema de notificaciones funcionando correctamente!');
    };

    return (
        <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
                Hola, <strong>{user?.name}</strong>. Bienvenido al sistema de gestión Smart Economat.
            </Typography>


            {import.meta.env.DEV && (
                <Box sx={{ display: 'flex', gap: 2, mb: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Button
                        variant="contained"
                        onClick={handleTestToast}
                    >
                        Probar Notificación
                    </Button>

                    <Button
                        variant="outlined"
                        onClick={() => setIsModalOpen(true)}
                    >
                        Probar Modal
                    </Button>

                    <Stack direction="row" spacing={1}>
                        <StatusChip status="completed" />
                        <StatusChip status="pending" />
                        <StatusChip status="error" label="Fallo Sistema" />
                        <StatusChip status="active" variant="outlined" />
                    </Stack>
                </Box>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Prueba de Modal"
                size="sm"
            >
                <Typography variant="body1" sx={{ mb: 3 }}>
                    Este es un ejemplo en vivo del componente Modal Genérico.
                    Prueba a presionar ESC o hacer clic fuera de este cuadro en el fondo difuminado para cerrarlo.
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button onClick={() => setIsModalOpen(false)} color="inherit">
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                            toast.success("¡Acción confirmada desde el modal!");
                            setIsModalOpen(false);
                        }}
                    >
                        Confirmar
                    </Button>
                </Box>
            </Modal>

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
            </Box>
        </Box>
    );
};

export default Home;