import { Preparacion } from '../../../src/modules/preparacion/preparacion.entity/preparacion.entity';

describe('Preparacion entity', () => {
  it('se puede instanciar con los campos base de la preparación', () => {
    const preparacion = new Preparacion();
    preparacion.recetaId = 'receta-2';
    preparacion.observaciones = 'Lista para cocina';

    expect(preparacion.recetaId).toBe('receta-2');
    expect(preparacion.observaciones).toBe('Lista para cocina');
  });
});
