const extractText = (node: any): string => {
  if (!node) return '';
  let text = '';

  if (typeof node === 'string' || typeof node === 'number') {
    text = String(node);
  } else if (Array.isArray(node)) {
    text = node.map(extractText).join(' ');
  } else if (Object.keys(node).includes('props')) {
    if (node.props.label) text = extractText(node.props.label);
    else if (node.props.title) text = extractText(node.props.title);
    else if (node.props.children) text = extractText(node.props.children);
  }

  if (/^\d{6,}$/.test(text)) {
    return text.split('').join(' ');
  }

  return text;
};

console.log('Test 1 (Barcode):', extractText('8423456789012'));
console.log('Test 2 (Number):', extractText(1234567));
console.log('Test 3 (Short):', extractText('12345'));
console.log('Test 4 (Fake React):', extractText({ props: { label: '8423456789012' } }));
