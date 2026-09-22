import { getDiscount } from "./pricing";

// Monta a arte quadrada de Stories (1080x1920) de um produto, pronta para
// postar no Instagram.
//
// Por que existe: montar esse card à mão, produto por produto, toda semana,
// é trabalho repetido — e a loja já tem foto, nome, preço e desconto. Aqui
// tudo isso vira uma imagem em um clique.

const W = 1080;
const H = 1920;

function formatPrice(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Quebra o texto em linhas que cabem na largura, com limite de linhas.
// A última ganha reticências quando sobra texto.
function wrapText(ctx, text, maxWidth, maxLines) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (ctx.measureText(attempt).width <= maxWidth) {
      current = attempt;
      continue;
    }
    if (current) lines.push(current);
    current = word;
    if (lines.length === maxLines) break;
  }

  if (lines.length < maxLines && current) lines.push(current);

  if (lines.length === maxLines) {
    const rest = words.join(" ");
    const shown = lines.join(" ");
    if (shown.length < rest.length) {
      let last = lines[maxLines - 1];
      while (last && ctx.measureText(`${last}...`).width > maxWidth) {
        last = last.slice(0, -1);
      }
      lines[maxLines - 1] = `${last}...`;
    }
  }

  return lines;
}

// Carrega a foto pedindo permissão de leitura entre origens. Sem o
// crossOrigin, desenhar uma imagem de outro site "suja" o canvas e a
// exportação é bloqueada pelo navegador.
function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    // Imagens enviadas por upload viram data: URL e não precisam disso.
    if (!src.startsWith("data:")) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawBackground(ctx) {
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#fdf1f6");
  grad.addColorStop(0.5, "#ffffff");
  grad.addColorStop(1, "#f6f0fb");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Manchas de cor nos cantos, as mesmas do site.
  ctx.globalAlpha = 0.5;
  const blob = ctx.createRadialGradient(140, 160, 0, 140, 160, 420);
  blob.addColorStop(0, "rgba(236, 111, 155, 0.55)");
  blob.addColorStop(1, "rgba(236, 111, 155, 0)");
  ctx.fillStyle = blob;
  ctx.fillRect(0, 0, W, 700);

  const blob2 = ctx.createRadialGradient(950, 1760, 0, 950, 1760, 420);
  blob2.addColorStop(0, "rgba(201, 163, 224, 0.5)");
  blob2.addColorStop(1, "rgba(201, 163, 224, 0)");
  ctx.fillStyle = blob2;
  ctx.fillRect(0, 1300, W, 620);
  ctx.globalAlpha = 1;
}

function drawBrand(ctx) {
  ctx.textAlign = "center";
  ctx.font = "800 62px Poppins, Segoe UI, system-ui, sans-serif";

  const sil = "Sil";
  const beauty = "Beauty";
  const silW = ctx.measureText(sil).width;
  const beautyW = ctx.measureText(beauty).width;
  const startX = (W - (silW + beautyW)) / 2;

  ctx.textAlign = "left";
  ctx.fillStyle = "#16161c";
  ctx.fillText(sil, startX, 150);
  ctx.fillStyle = "#ec6f9b";
  ctx.fillText(beauty, startX + silW, 150);
  ctx.textAlign = "center";
}

function drawPhoto(ctx, img) {
  const size = 820;
  const x = (W - size) / 2;
  const y = 250;

  ctx.save();
  roundRect(ctx, x, y, size, size, 48);
  ctx.fillStyle = "#f1f1f5";
  ctx.fill();
  ctx.clip();

  if (img) {
    // "cover": preenche o quadrado sem distorcer, cortando o excesso.
    const scale = Math.max(size / img.width, size / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, x + (size - dw) / 2, y + (size - dh) / 2, dw, dh);
  } else {
    ctx.fillStyle = "#c9c9d2";
    ctx.font = "500 40px Inter, Segoe UI, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Foto indisponível", W / 2, y + size / 2);
  }

  ctx.restore();
  return y + size;
}

function drawDiscountBadge(ctx, percent) {
  const x = (W - 820) / 2 + 34;
  const y = 250 + 34;
  const w = 168;
  const h = 78;

  roundRect(ctx, x, y, w, h, 39);
  ctx.fillStyle = "#ec6f9b";
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 42px Poppins, Segoe UI, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`-${percent}%`, x + w / 2, y + 54);
}

// Gera a arte e devolve um Blob PNG. Devolve null se o navegador bloquear a
// exportação (ver comentário no catch).
export async function buildStoryImage(product, { siteUrl = "" } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  const discount = getDiscount(product);
  const img = await loadImage(product.image);

  function render(withPhoto) {
    drawBackground(ctx);
    drawBrand(ctx);
    const bottomOfPhoto = drawPhoto(ctx, withPhoto ? img : null);
    if (discount) drawDiscountBadge(ctx, discount.percent);

    let y = bottomOfPhoto + 100;
    ctx.textAlign = "center";

    if (product.category) {
      ctx.fillStyle = "#ec6f9b";
      ctx.font = "700 32px Inter, Segoe UI, system-ui, sans-serif";
      ctx.fillText(product.category.toUpperCase(), W / 2, y);
      y += 62;
    }

    ctx.fillStyle = "#16161c";
    ctx.font = "700 58px Poppins, Segoe UI, system-ui, sans-serif";
    for (const line of wrapText(ctx, product.name, W - 160, 3)) {
      ctx.fillText(line, W / 2, y);
      y += 72;
    }

    y += 34;

    if (discount) {
      ctx.fillStyle = "#9a9aa5";
      ctx.font = "500 40px Inter, Segoe UI, system-ui, sans-serif";
      const old = formatPrice(discount.oldPrice);
      ctx.fillText(old, W / 2, y);
      // Risco sobre o preço antigo.
      const oldW = ctx.measureText(old).width;
      ctx.strokeStyle = "#9a9aa5";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(W / 2 - oldW / 2, y - 13);
      ctx.lineTo(W / 2 + oldW / 2, y - 13);
      ctx.stroke();
      y += 82;
    }

    ctx.fillStyle = "#ec6f9b";
    ctx.font = "800 96px Poppins, Segoe UI, system-ui, sans-serif";
    ctx.fillText(formatPrice(product.price), W / 2, y);

    // Rodapé com o endereço da loja.
    if (siteUrl) {
      ctx.fillStyle = "#6b6b76";
      ctx.font = "600 36px Inter, Segoe UI, system-ui, sans-serif";
      ctx.fillText(siteUrl.replace(/^https?:\/\//, ""), W / 2, H - 92);
    }
  }

  render(true);

  return new Promise((resolve) => {
    // JPEG em vez de PNG: a mesma arte sai com cerca de um sexto do tamanho
    // (de ~1,1 MB para pouco mais de 150 KB). Não há transparência aqui, e o
    // arquivo vai ser enviado pelo celular — peso importa.
    const finish = () => canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);

    try {
      // Só aqui o navegador reclama: desenhar a imagem de outro site
      // funciona, exportar não. Se acontecer, refazemos sem a foto — um card
      // sem imagem ainda serve, uma exceção não.
      canvas.toDataURL();
      finish();
    } catch {
      console.warn(
        "A foto do produto está hospedada num site que não autoriza download. Gerando o card sem ela."
      );
      render(false);
      finish();
    }
  });
}
