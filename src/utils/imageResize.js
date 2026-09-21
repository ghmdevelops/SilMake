// Reduz a imagem mantendo a proporção original, limitando o maior lado.
// Usado nas fotos de produto: sem recorte (para não cortar o produto), mas
// leve o suficiente para não pesar no banco nem na vitrine.
export function fileToResizedDataUrl(file, maxSize = 800, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("O arquivo escolhido não é uma imagem."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Não foi possível abrir a imagem."));
      img.onload = () => {
        // Só reduz; imagens menores que o limite são mantidas no tamanho.
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        // Fundo branco: PNG com transparência viraria preto no JPEG.
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}

// Tamanho aproximado, em KB, de uma imagem em data URL (base64).
export function dataUrlSizeKb(dataUrl) {
  const base64 = (dataUrl || "").split(",")[1] || "";
  // Cada 4 caracteres de base64 representam 3 bytes.
  return Math.round((base64.length * 3) / 4 / 1024);
}

// Converte a imagem escolhida pelo cliente num quadrado pequeno antes de
// salvar. Isso é essencial: uma foto de celular tem alguns MB e iria inteira
// para o banco em base64 (que ainda infla ~33%). Recortando no centro e
// reduzindo para 160px, o avatar fica com poucos KB.
export function fileToSquareDataUrl(file, size = 160, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("O arquivo escolhido não é uma imagem."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Não foi possível abrir a imagem."));
      img.onload = () => {
        // Recorta o maior quadrado possível a partir do centro da foto.
        const side = Math.min(img.width, img.height);
        const offsetX = (img.width - side) / 2;
        const offsetY = (img.height - side) / 2;

        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, offsetX, offsetY, side, side, 0, 0, size, size);

        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}
