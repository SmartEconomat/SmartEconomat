import React from 'react';
import { Typography, Container } from '@mui/material';

const Pedidos: React.FC = () => {
    return (
        <Container>
            <Typography variant="h4" component="h1" gutterBottom>
                Pedidos
            </Typography>
            <Typography variant="body1">
                Gestión de pedidos (En construcción)
            </Typography>
        </Container>
    );
};

export default Pedidos;
