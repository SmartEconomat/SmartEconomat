import { Test, TestingModule } from '@nestjs/testing';
import { AuditListener } from 'src/modules/movimiento/listeners/audit.listener';
import { MovimientoHelper } from 'src/common/helpers/movimiento.helper';
import { AuditEvent } from 'src/common/events/audit.event';
import { TipoMovimiento } from 'src/modules/movimiento/enums/movimiento.enums';

describe('AuditListener', () => {
  let listener: AuditListener;
  let createMovimiento: jest.Mock;

  beforeEach(async () => {
    createMovimiento = jest.fn();
    const movimientoHelperMock: Pick<MovimientoHelper, 'createMovimiento'> = {
      createMovimiento,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditListener,
        { provide: MovimientoHelper, useValue: movimientoHelperMock },
      ],
    }).compile();

    listener = module.get<AuditListener>(AuditListener);
  });

  it('should call createMovimiento on event', async () => {
    const event = new AuditEvent(
      'user-123',
      TipoMovimiento.ENTRADA,
      'Receta',
      'receta-1',
      'Creación test'
    );
    await listener.handleAuditLogEvent(event);

    expect(createMovimiento).toHaveBeenCalledWith(
      'user-123',
      TipoMovimiento.ENTRADA,
      'Receta',
      'receta-1',
      0,
      undefined,
      undefined,
      'Creación test',
      undefined,
      undefined,
      undefined
    );
  });
});
