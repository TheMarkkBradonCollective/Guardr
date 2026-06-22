const ID_MAX_DIMENSION = 1200;
const SELFIE_MAX_DIMENSION = 800;
const JPEG_QUALITY = 0.85;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

async function processImageFile(file: File, maxDimension: number): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a JPEG, PNG, or WebP image.');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('Image must be under 10 MB.');
  }

  const bitmap = await createImageBitmap(file);
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

export function processIdDocumentFile(file: File): Promise<string> {
  return processImageFile(file, ID_MAX_DIMENSION);
}

export function processIdentitySelfieFile(file: File): Promise<string> {
  return processImageFile(file, SELFIE_MAX_DIMENSION);
}

/** Live front-camera capture for identity verification (not profile photo). */
export function captureIdentitySelfie(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      resolve(null);
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((stream) => {
        const video = document.createElement('video');
        video.srcObject = stream;
        video.playsInline = true;
        video.onloadeddata = () => {
          const maxSide = Math.max(video.videoWidth, video.videoHeight);
          const scale = Math.min(1, SELFIE_MAX_DIMENSION / maxSide);
          const width = Math.max(1, Math.round(video.videoWidth * scale));
          const height = Math.max(1, Math.round(video.videoHeight * scale));
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d')?.drawImage(video, 0, 0, width, height);
          stream.getTracks().forEach((track) => track.stop());
          resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
        };
        void video.play();
      })
      .catch(() => resolve(null));
  });
}
