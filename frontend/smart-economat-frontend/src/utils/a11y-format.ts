import React, { ReactNode } from 'react';

/**
 * Utilidad heurística para formatear cadenas numéricas largas para lectores de pantalla.
 * Inserta espacios entre cada dígito para forzar la lectura secuencial uno a uno.
 * Se activa para cadenas puramente numéricas de más de 5 dígitos.
 */
export const formatDigitsForSR = (text: string): string => {
  if (!text) return '';
  const trimmed = text.trim();
  // Solo aplicamos si es puramente numérico (o con algún separador común que limpiaremos)
  // y tiene una longitud considerable (códigos de barras, IDs largos)
  if (/^\d{6,}$/.test(trimmed)) {
    return trimmed.split('').join(' ');
  }
  return trimmed;
};

/**
 * Extrae texto plano de un ReactNode de forma recursiva para etiquetas ARIA.
 * Aplica automáticamente formatDigitsForSR si detecta códigos numéricos.
 */
export const extractA11yText = (node: ReactNode): string => {
  if (!node) return '';
  let text = '';

  if (typeof node === 'string' || typeof node === 'number') {
    text = String(node);
  } else if (Array.isArray(node)) {
    text = node.map(extractA11yText).join(' ');
  } else if (React.isValidElement(node)) {
    // Caso especial: Chips de MUI o componentes con prop label/title
    const element = node as React.ReactElement<any>;
    if (element.props.label) text = extractA11yText(element.props.label);
    else if (element.props.title) text = extractA11yText(element.props.title);
    else if (element.props.children) text = extractA11yText(element.props.children);
  }

  return formatDigitsForSR(text);
};
