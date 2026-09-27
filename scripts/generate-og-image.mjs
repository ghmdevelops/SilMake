// Gera a imagem de compartilhamento (Open Graph), usada quando alguém cola um
// link da loja no WhatsApp, Instagram, Facebook ou Telegram.
//
// Rode com: node scripts/generate-og-image.mjs
//
// 1200x630 é a medida que essas redes esperam. Menor que isso aparece
// recortado; sem imagem nenhuma o link vira um retângulo de texto cinza, que
// quase ninguém clica.
import sharp from "sharp";
import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "..", "public");

const W = 1200;
const H = 630;

// Desenhado em SVG e rasterizado: assim o texto sai nítido e o arquivo-fonte
// fica legível para ajustes futuros.
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="fundo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fdf1f6"/>
      <stop offset="50%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f6f0fb"/>
    </linearGradient>
    <radialGradient id="rosa" cx="0.12" cy="0.1" r="0.5">
      <stop offset="0%" stop-color="#ec6f9b" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#ec6f9b" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="lilas" cx="0.9" cy="0.95" r="0.5">
      <stop offset="0%" stop-color="#c9a3e0" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#c9a3e0" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#fundo)"/>
  <rect width="${W}" height="${H}" fill="url(#rosa)"/>
  <rect width="${W}" height="${H}" fill="url(#lilas)"/>

  <g font-family="Poppins, Segoe UI, Arial, sans-serif" text-anchor="middle">
    <text x="${W / 2}" y="420" font-size="30" font-weight="500" fill="#6b6b76" letter-spacing="9">
      BELEZA E CUIDADO
    </text>

    <text x="${W / 2}" y="500" font-size="34" font-weight="500" fill="#4a4a55">
      Maquiagem, skincare e perfumaria
    </text>
  </g>

  <!-- Linha rosa no rodapé: assina a imagem sem competir com o texto -->
  <rect x="0" y="${H - 12}" width="${W}" height="12" fill="#ec6f9b"/>
</svg>
`;

async function run() {
  const logo = resolve(publicDir, "logo.png");
  if (!existsSync(logo)) {
    console.error("Falta public/logo.png. Rode antes: node scripts/prepare-logo.mjs");
    process.exit(1);
  }

  // O logo é composto por cima do fundo, em vez de embutido no SVG: assim a
  // arte usa o arquivo real da marca, e não uma reconstrução em texto que
  // sairia diferente do logo de verdade.
  const marca = await sharp(logo).resize({ height: 300 }).png().toBuffer();
  // A posição é calculada, não delegada ao "gravity": o sharp não aceita as
  // duas formas juntas, e aqui precisamos centralizar na horizontal mas
  // fixar a altura.
  const { width: larguraMarca } = await sharp(marca).metadata();

  // JPEG em vez de PNG: as redes sociais recomendam abaixo de 300 KB, e um
  // PNG dessa dimensão passaria de 1 MB.
  await sharp(Buffer.from(svg))
    .composite([
      { input: marca, top: 80, left: Math.round((W - larguraMarca) / 2) },
    ])
    .jpeg({ quality: 90 })
    .toFile(resolve(publicDir, "og-image.jpg"));

  console.log("Imagem de compartilhamento gerada em client/public/og-image.jpg");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
