// Cloudinary unsigned upload (same preset as the Alfudi frontend).
const CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
const PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;
const API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY as string | undefined;

export const uploadsEnabled = !!(CLOUD && PRESET);

export async function uploadImage(file: File): Promise<string> {
  if (!uploadsEnabled) throw new Error('Image uploads are not configured — paste an image URL instead.');
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  if (file.size > 8 * 1024 * 1024) throw new Error('Images must be under 8 MB.');
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', PRESET!);
  if (API_KEY) fd.append('api_key', API_KEY);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, { method: 'POST', body: fd });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `Upload failed (${res.status})`);
  }
  return (await res.json()).secure_url as string;
}
