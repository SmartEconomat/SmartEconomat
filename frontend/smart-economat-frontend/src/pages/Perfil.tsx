import React from 'react';
import { Box, Container, Typography, Breadcrumbs, Link, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ProfileForm from '../features/profile/components/ProfileForm';
import ChangePasswordForm from '../features/profile/components/ChangePasswordForm';

/**
 * Página de Perfil y Ajustes.
 * Permite al usuario gestionar sus datos básicos y seguridad.
 */
const Perfil: React.FC = () => {
    return (
        <Container maxWidth="lg" sx={{ py: 4, px: { xs: 1, sm: 2, md: 3 } }}>
            {/* Cabecera y Breadcrumbs */}
            <Box mb={4}>
                <Typography variant="h4" fontWeight={700} gutterBottom color="primary.main">
                    Mi Perfil
                </Typography>
                <Breadcrumbs
                    separator={<NavigateNextIcon fontSize="small" />}
                    aria-label="breadcrumb"
                >
                    <Link underline="hover" color="inherit" component={RouterLink} to="/">
                        Inicio
                    </Link>
                    <Typography color="text.primary" fontWeight={500}>
                        Ajustes de Perfil
                    </Typography>
                </Breadcrumbs>
            </Box>

            {/* Contenido principal */}
            <Box mb={4}>
                <Typography variant="body1" color="text.secondary">
                    Aquí puedes actualizar tu información personal y gestionar la seguridad de tu cuenta.
                </Typography>
            </Box>

            <Box
                display="grid"
                gap={{ xs: 2, md: 4 }}
                gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }}
                alignItems="start"
            >
                <ProfileForm />
                <ChangePasswordForm />
            </Box>
        </Container>
    );
};

export default Perfil;
