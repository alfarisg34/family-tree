/**
 * Image optimization utility for compressing and resizing family photos
 * Keeps files light and fast while maintaining crisp visual quality.
 */

export interface OptimizedImageResult {
  dataUrl: string;
  originalSize: number;
  optimizedSize: number;
  width: number;
  height: number;
  compressionRatio: string;
}

/**
 * Compresses an image File or Blob to an optimized WebP or JPEG DataURL
 * @param file - File or Blob of image
 * @param maxWidth - Max width in pixels (e.g. 600 for avatar, 1200 for carousel)
 * @param maxHeight - Max height in pixels
 * @param quality - Compression quality (0.0 to 1.0, recommended 0.82)
 */
export async function optimizeImage(
  file: File | Blob,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.82
): Promise<OptimizedImageResult> {
  return new Promise((resolve, reject) => {
    const originalSize = file.size;
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect ratio preserving dimensions
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context not available'));
          return;
        }

        // Image smoothing for high quality downscaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first, fallback to JPEG
        let dataUrl: string;
        try {
          dataUrl = canvas.toDataURL('image/webp', quality);
          if (!dataUrl.startsWith('data:image/webp')) {
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
        } catch {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // Estimate size from Base64
        const stringLength = dataUrl.length - 'data:image/webp;base64,'.length;
        const optimizedSize = Math.round((stringLength * 3) / 4);
        const ratio = originalSize > 0 
          ? ((1 - optimizedSize / originalSize) * 100).toFixed(1) + '%' 
          : '0%';

        resolve({
          dataUrl,
          originalSize,
          optimizedSize,
          width,
          height,
          compressionRatio: ratio,
        });
      };

      img.onerror = () => reject(new Error('Failed to load image for optimization'));
      img.src = event.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Format bytes to readable string (KB / MB)
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
