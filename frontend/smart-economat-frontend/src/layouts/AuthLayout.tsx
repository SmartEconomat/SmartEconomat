import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container, CssBaseline } from '@mui/material';

const AuthLayout: React.FC = () => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default'
            }}
        >
            <CssBaseline />
            <Container component="main" maxWidth={false} disableGutters>
                <Outlet />
            </Container>
        </Box>
    );
};

export default AuthLayout;
