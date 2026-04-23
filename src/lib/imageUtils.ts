export const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.6): Promise<string> => {
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

        // Try WebP first if quality is provided (standard clinical quality)
        let dataUrl = canvas.toDataURL('image/webp', quality);
        
        // Fallback to JPEG if WebP is not supported (canvas returns PNG if type not supported)
        // or if somehow PNG is larger than we want
        if (dataUrl.startsWith('data:image/png') || dataUrl.length > 800000) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        
        // If still too large (> 800KB base64), try more aggressive compression
        if (dataUrl.length > 800000) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.4);
        }

        resolve(dataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};
