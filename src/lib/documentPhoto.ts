const DOCUMENT_MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.85;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read image file.'));
    reader.readAsDataURL(file);
  });
}

async function resizeDataUrl(dataUrl: string, maxDimension: number): Promise<string> {
  const bitmap = await createImageBitmap(await (await fetch(dataUrl)).blob());
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
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

/** Resize credential, audit, and other document photos before persisting as base64. */
export async function processDocumentPhotoFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name)) {
    throw new Error('Please choose a JPEG, PNG, or WebP image.');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('Image must be under 10 MB.');
  }

  try {
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
  } catch {
    const dataUrl = await readFileAsDataUrl(file);
    if (!dataUrl.startsWith('data:image/')) {
      throw new Error('Could not process image. Try JPEG or PNG.');
    }
    try {
      return await resizeDataUrl(dataUrl, DOCUMENT_MAX_DIMENSION);
    } catch {
      return dataUrl;
    }
  }
}
