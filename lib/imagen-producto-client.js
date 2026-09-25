export const PRODUCT_IMAGE_WIDTH = 1600;
export const PRODUCT_IMAGE_HEIGHT = 1200;

/**
 * Prepara las fotos nuevas en un lienzo 4:3 uniforme. El repuesto no se
 * recorta: se escala completo y el espacio restante queda blanco.
 */
export const prepararImagenProducto = (file, calidad = 0.86) =>
  new Promise(resolve => {
    if (!file?.type?.startsWith('image/') || file.type === 'image/gif') {
      resolve(file);
      return;
    }

    const imagen = new Image();
    const objectUrl = URL.createObjectURL(file);
    imagen.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = PRODUCT_IMAGE_WIDTH;
      canvas.height = PRODUCT_IMAGE_HEIGHT;
      const contexto = canvas.getContext('2d');
      if (!contexto) {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
        return;
      }

      const escala = Math.min(PRODUCT_IMAGE_WIDTH / imagen.naturalWidth, PRODUCT_IMAGE_HEIGHT / imagen.naturalHeight);
      const ancho = Math.round(imagen.naturalWidth * escala);
      const alto = Math.round(imagen.naturalHeight * escala);
      contexto.fillStyle = '#ffffff';
      contexto.fillRect(0, 0, PRODUCT_IMAGE_WIDTH, PRODUCT_IMAGE_HEIGHT);
      contexto.drawImage(imagen, Math.round((PRODUCT_IMAGE_WIDTH - ancho) / 2), Math.round((PRODUCT_IMAGE_HEIGHT - alto) / 2), ancho, alto);
      URL.revokeObjectURL(objectUrl);
      canvas.toBlob(blob => {
        resolve(blob
          ? new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
          : file);
      }, 'image/jpeg', calidad);
    };
    imagen.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
    imagen.src = objectUrl;
  });
