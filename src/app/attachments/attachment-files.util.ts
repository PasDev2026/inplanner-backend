import * as path from 'path';

export const PREVIEW_WIDTHS = [150, 300];

export function previewFileName(filePath: string, width: number): string {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath, path.extname(filePath));
  return path.join(dir, `${base}.${width}w.webp`);
}

export function extractAttachmentIdsFromHtml(html: string): string[] {
  const matches = html.match(/\/attachments\/([0-9a-fA-F-]{36})/g);
  if (!matches) {
    return [];
  }
  const ids = matches
    .map((m) => m.split('/')[2])
    .filter((part): part is string => part !== undefined);
  return [...new Set(ids)];
}
