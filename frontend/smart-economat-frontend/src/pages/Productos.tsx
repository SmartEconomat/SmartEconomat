import React from 'react';
import { Typography, Container } from '@mui/material';

const Productos: React.FC = () => {
    return (
        <Container>
            <Typography variant="h4" component="h1" gutterBottom>
                Productos
            </Typography>
            <Typography variant="body1">
                Gestión de productos (En construcción)
            </Typography>
        </Container>
    );
};

export default Productos;
