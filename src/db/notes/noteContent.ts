function decodeHtml(value: string): string {
  if (typeof document === 'undefined') {
    return value;
  }

  const div = document.createElement('div');
  div.innerHTML = value;
  return div.textContent ?? div.innerText ?? '';
}

export function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

export function markdownToPlainText(value: string): string {
  const withoutCodeBlocks = value.replace(/```[\s\S]*?```/g, ' ');
  const withoutInlineCode = withoutCodeBlocks.replace(/`([^`]+)`/g, '$1');
  const withoutImages = withoutInlineCode.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '$1');
  const withoutLinks = withoutImages.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');
  const withoutFormatting = withoutLinks
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~>#-]/g, ' ')
    .replace(/\d+\.\s+/g, '')
    .replace(/\n{2,}/g, '\n')
    .replace(/[ \t]{2,}/g, ' ');

  return withoutFormatting.trim();
}

export function noteContentToPlainText(value: string): string {
  if (!value.trim()) return '';
  return looksLikeHtml(value) ? decodeHtml(value).trim() : markdownToPlainText(value);
}

export function isNoteContentEmpty(value: string): boolean {
  return !noteContentToPlainText(value);
}
