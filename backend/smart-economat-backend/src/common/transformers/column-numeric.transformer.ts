export class ColumnNumericTransformer {
  to(data: number | null | undefined): number | null {
    return data ?? null;
  }

  from(data: string | number | null | undefined): number {
    if (data === null || data === undefined || data === '') {
      return 0;
    }

    const parsed = typeof data === 'number' ? data : parseFloat(data);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
