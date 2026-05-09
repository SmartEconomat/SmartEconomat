import {
  TIEMPO_RECETA_VALUES,
  TiempoReceta,
  getTiempoRecetaMinutos,
} from '../../../src/modules/receta/enums/receta.enums';

describe('receta.enums', () => {
  it('expone los tiempos canónicos de receta en el orden esperado', () => {
    expect(TIEMPO_RECETA_VALUES).toEqual([
      TiempoReceta.MIN_10,
      TiempoReceta.MIN_15,
      TiempoReceta.MIN_20,
      TiempoReceta.MIN_25,
      TiempoReceta.MIN_30,
      TiempoReceta.MIN_40,
      TiempoReceta.MIN_45,
      TiempoReceta.MIN_50,
      TiempoReceta.MIN_60,
      TiempoReceta.MIN_75,
      TiempoReceta.MIN_90,
      TiempoReceta.MIN_120,
    ]);
  });

  it('convierte cada valor del enum a minutos válidos para el backend', () => {
    expect(
      TIEMPO_RECETA_VALUES.map((tiempoReceta) =>
        getTiempoRecetaMinutos(tiempoReceta)
      )
    ).toEqual([10, 15, 20, 25, 30, 40, 45, 50, 60, 75, 90, 120]);
  });
});
