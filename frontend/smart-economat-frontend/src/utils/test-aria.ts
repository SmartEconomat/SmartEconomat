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

console.log('Test 1 (Barcode):', extractText('8423456789012'));
console.log('Test 2 (Number):', extractText(1234567));
console.log('Test 3 (Short):', extractText('12345'));
console.log(
  'Test 4 (Fake React):',
  extractText({ props: { label: '8423456789012' } })
);
