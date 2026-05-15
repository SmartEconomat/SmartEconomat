import { RecepcionController } from '../../../src/modules/recepcion/controller/recepcion.controller';

/**
 * Tests de regresión para RECEPCION-001:
 * Bug de seguridad — el controlador hacía dto.usuarioId = dto.usuarioId || userId,
 * lo que permitía a un cliente enviar un usuarioId arbitrario para suplantar al
 * operador registrado en la recepción, comprometiendo auditoría y reportes.
 * El fix impone siempre dto.usuarioId = userId del token.
 */
describe('RecepcionController — protección de autoría en recepción', () => {
  const mockRecepcionStockService = {
    procesarRecepcion: jest.fn().mockResolvedValue({ id: 'rec-1' }),
    procesarRecepcionMasiva: jest.fn(),
  };
  const mockRecepcionService = {
    findAll: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };
  const mockPdfReportService = { generateReport: jest.fn() };

  let controller: RecepcionController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new RecepcionController(
      mockRecepcionService as any,
      mockRecepcionStockService as any,
      mockPdfReportService as any
    );
  });

  it('siempre usa el userId del token, ignorando el usuarioId del cuerpo', async () => {
    const req = { user: { id: 'token-user-id' } };
    const dto = {
      usuarioId: 'otro-usuario-fraudulento',
      pedidoId: 'p-1',
    } as any;

    await controller.create(dto, req);

    expect(mockRecepcionStockService.procesarRecepcion).toHaveBeenCalledWith(
      expect.objectContaining({ usuarioId: 'token-user-id' })
    );
  });

  it('asigna el userId del token aunque el DTO no traiga usuarioId', async () => {
    const req = { user: { id: 'real-user-456' } };
    const dto = { pedidoId: 'p-2' } as any;

    await controller.create(dto, req);

    const calledDto =
      mockRecepcionStockService.procesarRecepcion.mock.calls[0][0];
    expect(calledDto.usuarioId).toBe('real-user-456');
  });

  it('un atacante con usuarioId en body no puede suplantar al operador', async () => {
    const req = { user: { id: 'legitimate-operator' } };
    const dto = { usuarioId: 'admin-victim', pedidoId: 'p-3' } as any;

    await controller.create(dto, req);

    const calledDto =
      mockRecepcionStockService.procesarRecepcion.mock.calls[0][0];
    expect(calledDto.usuarioId).toBe('legitimate-operator');
    expect(calledDto.usuarioId).not.toBe('admin-victim');
  });
});
