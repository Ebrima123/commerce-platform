const dalasi = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Gambian Dalasi, always `D 1,234.00` — pair with `tabular-nums`. */
export const fmtDalasi = (v: number | string | null | undefined) => `D ${dalasi.format(Number(v) || 0)}`;

/** All image URLs for a product, cover first. */
export function productImages(p: { image_url?: string; images?: { url?: string; image_url?: string }[] }): string[] {
  const extra = (p.images ?? []).map(i => i.url || i.image_url || '').filter(Boolean);
  return [...new Set([p.image_url, ...extra].filter(Boolean) as string[])];
}
