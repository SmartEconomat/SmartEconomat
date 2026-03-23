export class RecepcionCompletadaEvent {
  constructor(
    public readonly recepcionId: string,
    public readonly nAlbaran?: string,
    public readonly pedidoIds: string[] = [],
    public readonly fechaRecepcion?: Date,
    public readonly userId?: string
  ) {}
}
