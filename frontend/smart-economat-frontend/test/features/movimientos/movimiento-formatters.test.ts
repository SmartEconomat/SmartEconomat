import {
  getMovimientoUsuarioDisplayName,
  getMovimientoUsuarioInitial,
} from '../../../src/features/movimientos/movimiento-formatters';

describe('movimiento-formatters', () => {
  it('prioriza nombre sobre username y email', () => {
    expect(
      getMovimientoUsuarioDisplayName({
        id: '1',
        nombre: 'Ana Perez',
        username: 'aperez',
        email: 'ana@example.com',
      })
    ).toBe('Ana Perez');
  });

  it('usa username cuando nombre no viene informado', () => {
    expect(
      getMovimientoUsuarioDisplayName({
        id: '1',
        nombre: '   ',
        username: 'aperez',
        email: 'ana@example.com',
      })
    ).toBe('aperez');
  });

  it('usa email cuando solo existe email', () => {
    expect(
      getMovimientoUsuarioDisplayName({
        id: '1',
        email: 'ana@example.com',
      })
    ).toBe('ana@example.com');
  });

  it('devuelve marcador por defecto e inicial U cuando no hay identidad visible', () => {
    expect(getMovimientoUsuarioDisplayName({ id: '1' })).toBe('—');
    expect(getMovimientoUsuarioInitial({ id: '1' })).toBe('U');
  });

  it('calcula la inicial a partir del valor visible resuelto', () => {
    expect(
      getMovimientoUsuarioInitial({
        id: '1',
        username: 'profesor',
      })
    ).toBe('P');
  });
});
