// Image uploads to Alfudi's Cloudinary account (unsigned upload preset).
// These three values are public by design — they already ship in the Alfudi
// frontend bundle; the API *secret* is never used in the browser. Env vars
// override them (e.g. to point a staging build at another account).

const CLOUD = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined) || "divk8m0ff";
const PRESET = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined) || "alfudi";
const API_KEY = (import.meta.env.VITE_CLOUDINARY_API_KEY as string | undefined) || "661615993757787";

export const uploadsEnabled = !!(CLOUD && PRESET);

const MAX_BYTES = 15 * 1024 * 1024;
const MAX_EDGE = 2000; // px — plenty for storefront images, much faster on mobile data

/** Downscale big photos to MAX_EDGE and re-encode as WebP before upload. GIF/SVG pass through untouched. */
async function optimize(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 400 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/webp', 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' });
  } catch {
    return file; // older browsers: upload the original
  }
}

export async function uploadImage(file: File): Promise<string> {
  if (!uploadsEnabled) throw new Error('Image uploads are not configured — paste an image URL instead.');
  if (!file.type.startsWith('image/')) throw new Error(`"${file.name}" is not an image.`);
  if (file.size > MAX_BYTES) throw new Error(`"${file.name}" is over 15 MB.`);
  const fd = new FormData();
  fd.append('file', await optimize(file));
  fd.append('upload_preset', PRESET);
  if (API_KEY) fd.append('api_key', API_KEY);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, { method: 'POST', body: fd });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `Upload failed (${res.status})`);
  }
  return (await res.json()).secure_url as string;
}
