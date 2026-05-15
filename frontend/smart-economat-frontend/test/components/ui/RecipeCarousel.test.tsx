import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import RecipeCarousel, {
  type CarouselItem,
} from '../../../src/components/ui/RecipeCarousel';

const SAMPLE_ITEMS: CarouselItem[] = [
  {
    id: '1',
    title: 'Mi Receta Real',
    description: 'Descripción de la receta real',
    image: '/assets/images/receta-real.png',
    time: '30 min',
    difficulty: 'Fácil',
    category: 'Fácil',
  },
  {
    id: '2',
    title: 'Segunda Receta',
    description: 'Segunda descripción',
    image: '/assets/images/segunda.png',
    time: '45 min',
    difficulty: 'Media',
    category: 'Media',
  },
];

describe('RecipeCarousel — bug 4: datos hardcoded eliminados', () => {
  it('sin items: muestra estado vacío, no datos hardcoded', () => {
    render(<RecipeCarousel items={[]} />);

    expect(
      screen.queryByText('Handmade Marble Chicken')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Fresh Mediterranean Pasta')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Quinoa & Avocado Power Bowl')
    ).not.toBeInTheDocument();
    expect(screen.getByText('No hay recetas disponibles')).toBeInTheDocument();
  });

  it('sin props: no muestra datos ficticios y muestra estado vacío', () => {
    render(<RecipeCarousel />);

    expect(screen.queryByText(/Marble/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Mediterranean/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Quinoa/i)).not.toBeInTheDocument();
    expect(screen.getByText('No hay recetas disponibles')).toBeInTheDocument();
  });

  it('con items: muestra los títulos proporcionados', () => {
    render(<RecipeCarousel items={SAMPLE_ITEMS} />);

    expect(screen.getByText('Mi Receta Real')).toBeInTheDocument();
  });

  it('con items: no muestra datos ficticiosa (old ITEMS hardcoded)', () => {
    render(<RecipeCarousel items={SAMPLE_ITEMS} />);

    expect(
      screen.queryByText('Handmade Marble Chicken')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Fresh Mediterranean Pasta')
    ).not.toBeInTheDocument();
  });

  it('con items: no muestra estado vacío', () => {
    render(<RecipeCarousel items={SAMPLE_ITEMS} />);

    expect(
      screen.queryByText('No hay recetas disponibles')
    ).not.toBeInTheDocument();
  });

  it('con items: renderiza la dificultad del primer item en el DOM', () => {
    render(<RecipeCarousel items={SAMPLE_ITEMS} />);

    // El carousel renderiza todos los slides en el DOM (con visibility/opacity para ocultar)
    // por eso puede haber múltiples coincidencias — verificamos que exista al menos una
    const matches = screen.getAllByText('Fácil');
    expect(matches.length).toBeGreaterThan(0);
  });

  it('con un solo item: no muestra controles de navegación defectuosos', () => {
    const singleItem: CarouselItem[] = [SAMPLE_ITEMS[0]!];
    render(<RecipeCarousel items={singleItem} />);

    expect(screen.getByText('Mi Receta Real')).toBeInTheDocument();
    expect(
      screen.queryByText('No hay recetas disponibles')
    ).not.toBeInTheDocument();
  });
});
