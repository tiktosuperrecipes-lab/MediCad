import heic2any from 'heic2any';

export const compressImage = async (file: File, maxWidth: number = 700, targetKb: number = 80): Promise<string> => {
  let fileToProcess: File | Blob = file;

  // Handle HEIC/HEIF files
  const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif') || file.type === 'image/heic' || file.type === 'image/heif';

  if (isHeic) {
    try {
      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.8
      });
      fileToProcess = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    } catch (error) {
      console.error('Erro ao converter HEIC:', error);
      // Fallback to original file, though it will likely fail in the next step if not supported
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(fileToProcess);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Iterative compression to hit target size
        // Base64 size = approx 1.33 * binary size
        const targetBytes = targetKb * 1024 * 0.75; 
        
        let quality = 0.8;
        let dataUrl = '';
        let type = 'image/webp';
        
        // Check if webp is supported
        const testCanvas = document.createElement('canvas');
        if (testCanvas.toDataURL('image/webp').indexOf('data:image/webp') !== 0) {
          type = 'image/jpeg';
        }

        // Try to compress until we hit the target size or minimum quality
        do {
          dataUrl = canvas.toDataURL(type, quality);
          quality -= 0.1;
        } while (dataUrl.length > targetBytes * 1.33 && quality > 0.1);

        resolve(dataUrl);
      };
      img.onerror = (event) => {
        console.error('Image loading error:', event);
        reject(new Error('Erro ao carregar imagem para compressão'));
      };
    };
    reader.onerror = (error) => {
      console.error('File reading error:', error);
      reject(new Error('Erro ao ler arquivo: ' + (error.target?.error?.message || 'Erro desconhecido')));
    };
  });
};
