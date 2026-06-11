import clsx from 'clsx';

export function cn(...args: clsx.ClassValue[]) {
  return clsx(args);
}

export function extractPlainTextFromTipTapJSON(content: unknown): string {
  if (!content || typeof content !== 'object') {
    return '';
  }

  const walk = (node: unknown): string => {
    if (!node || typeof node !== 'object') {
      return '';
    }

    const typedNode = node as { text?: string; content?: unknown[] };
    const text = typedNode.text ?? '';
    const children = Array.isArray(typedNode.content)
      ? typedNode.content.map((item) => walk(item)).join(' ')
      : '';

    return `${text} ${children}`.trim();
  };

  return walk(content).replace(/\s+/g, ' ').trim();
}
