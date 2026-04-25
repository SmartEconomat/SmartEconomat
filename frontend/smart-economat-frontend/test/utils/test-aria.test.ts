import { describe, it, expect } from 'vitest';

const extractText = (node: unknown): string => {
  if (!node) return '';
  let text = '';

  if (typeof node === 'string' || typeof node === 'number') {
    text = String(node);
  } else if (Array.isArray(node)) {
    text = node.map((n) => extractText(n)).join(' ');
  } else if (typeof node === 'object' && node !== null && 'props' in node) {
    const props = (node as { props: Record<string, unknown> }).props;
    if (props.label) text = extractText(props.label);
    else if (props.title) text = extractText(props.title);
    else if (props.children) text = extractText(props.children);
  }

  if (/^\d{6,}$/.test(text)) {
    return text.split('').join(' ');
  }

  return text;
};

describe('Aria Text Extraction Utils (Debug/Test)', () => {
  it('should extract and format barcode correctly', () => {
    const result = extractText('8423456789012');
    expect(result).toBe('8 4 2 3 4 5 6 7 8 9 0 1 2');
  });

  it('should extract and format long numbers correctly', () => {
    const result = extractText(1234567);
    expect(result).toBe('1 2 3 4 5 6 7');
  });

  it('should not format short numeric strings', () => {
    const result = extractText('12345');
    expect(result).toBe('12345');
  });

  it('should extract from fake React props correctly', () => {
    const result = extractText({ props: { label: '8423456789012' } });
    expect(result).toBe('8 4 2 3 4 5 6 7 8 9 0 1 2');
  });
});
