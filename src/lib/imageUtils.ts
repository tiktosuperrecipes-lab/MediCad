export const compressImage = (file: File, maxWidth: number = 700, targetKb: number = 150): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
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
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};
