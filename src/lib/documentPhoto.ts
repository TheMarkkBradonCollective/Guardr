const DOCUMENT_MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.85;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Resize credential, audit, and other document photos before persisting as base64. */
export async function processDocumentPhotoFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a JPEG, PNG, or WebP image.');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('Image must be under 10 MB.');
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, DOCUMENT_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('Could not process image.');
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
}
