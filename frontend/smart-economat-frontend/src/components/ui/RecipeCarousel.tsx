import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton, Paper, Chip } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
interface CarouselItem {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  id: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  title: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  description: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  image: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  time: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  difficulty: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  category: string;
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
const ITEMS: CarouselItem[] = [
  {
    id: '1',
    title: 'Handmade Marble Chicken',
    description:
      'Una pechuga de pollo veteada con finas hierbas y especias, cocinada a baja temperatura para una jugosidad extrema.',
    image: '/assets/images/recetas/chicken.png',
    time: '45 min',
    difficulty: 'Media',
    category: 'Gourmet',
  },
  {
    id: '2',
    title: 'Fresh Mediterranean Pasta',
    description:
      'Pasta artesanal con tomates cherry confitados, albahaca fresca y lascas de parmesano de 24 meses.',
    image: '/assets/images/recetas/pasta.png',
    time: '20 min',
    difficulty: 'Fácil',
    category: 'Italiana',
  },
  {
    id: '3',
    title: 'Quinoa & Avocado Power Bowl',
    description:
      'Ensalada vibrante de quinoa con aguacate maduro, garbanzos tostados y semillas de granada.',
    image: '/assets/images/recetas/salad.png',
    time: '15 min',
    difficulty: 'Fácil',
    category: 'Saludable',
  },
];

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
const RecipeCarousel: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextSlide = () => {
    setActiveIndex((prev) => (prev === ITEMS.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev === 0 ? ITEMS.length - 1 : prev - 1));
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev === ITEMS.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box
      id="recipe-carousel-container"
      sx={{ width: '100%', mb: 4, position: 'relative' }}
    >
      <Paper
        elevation={0}
        sx={{
          height: { xs: 200, md: 280 },
          borderRadius: 4,
          overflow: 'hidden',
          position: 'relative',
          background: (theme) => theme.palette.background.default,
          transition: 'all 0.5s ease-in-out',
        }}
      >
        {ITEMS.map((item, index) => (
          <Box
            key={item.id}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: activeIndex === index ? 1 : 0,
              visibility: activeIndex === index ? 'visible' : 'hidden',
              transition: 'opacity 0.8s ease-in-out, visibility 0.8s',
              backgroundImage: `url(${item.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              '&::after': {
                content: '""',
                position: 'absolute',
                left: 0,
                bottom: 0,
                width: '100%',
                height: '70%',
                background:
                  'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0) 100%)',
              },
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                p: { xs: 2, md: 3 },
                pl: { xs: 6, md: 8 },
                width: { xs: '100%', md: '60%' },
                zIndex: 2,
                color: 'white',
                transform:
                  activeIndex === index ? 'translateY(0)' : 'translateY(20px)',
                transition: 'transform 0.6s ease-out 0.2s',
              }}
            >
              <Chip
                label={item.category}
                size="small"
                sx={{
                  mb: 1,
                  bgcolor: 'primary.main',
                  color: 'white',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                }}
              />
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 800,
                  mb: 0.5,
                  fontSize: { xs: '1.2rem', md: '1.8rem' },
                }}
              >
                {item.title}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  mb: 3,
                  opacity: 0.9,
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                {item.description}
              </Typography>

              <Box sx={{ display: 'flex', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTimeIcon fontSize="small" color="primary" />
                  <Typography variant="body2">{item.time}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SignalCellularAltIcon fontSize="small" color="primary" />
                  <Typography variant="body2">{item.difficulty}</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        ))}

        {/* Navigation Buttons */}
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            prevSlide();
          }}
          sx={{
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 3,
            color: 'white',
            bgcolor: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(5px)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
          }}
        >
          <ArrowBackIosNewIcon />
        </IconButton>
        <IconButton
          onClick={(e) => {
            e.stopPropagation();
            nextSlide();
          }}
          sx={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 3,
            color: 'white',
            bgcolor: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(5px)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
          }}
        >
          <ArrowForwardIosIcon />
        </IconButton>

        {/* Indicators */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            display: 'flex',
            gap: 1,
            zIndex: 3,
          }}
        >
          {ITEMS.map((_, index) => (
            <Box
              key={index}
              onClick={() => setActiveIndex(index)}
              sx={{
                width: activeIndex === index ? 30 : 8,
                height: 8,
                borderRadius: 4,
                bgcolor:
                  activeIndex === index
                    ? 'primary.main'
                    : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default RecipeCarousel;
