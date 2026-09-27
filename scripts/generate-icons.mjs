// Gera os ícones do app (PWA, aba do navegador, tela inicial do celular)
// a partir do símbolo do logo.
//
// Rode com: node scripts/generate-icons.mjs
// (Rode antes o prepare-logo.mjs, que produz o logo-simbolo.png.)
//
// Usa só o SÍMBOLO, não o logo completo: num ícone de 48px na tela inicial,
// a palavra "SilBeauty" vira um borrão ilegível. O desenho do rosto com a
// flor é reconhecível mesmo pequeno.
import sharp from "sharp";
import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "..", "public");
const simbolo = resolve(publicDir, "logo-simbolo.png");

const ROSA = { r: 236, g: 111, b: 155, alpha: 1 };
const CLARO = { r: 253, g: 241, b: 246, alpha: 1 };

// Coloca o símbolo centralizado sobre um fundo sólido, quadrado.
//
// Ícone precisa de fundo próprio: com transparência, ele fica invisível
// sobre papéis de parede claros na tela inicial do celular.
async function comFundo(tamanho, margem, fundo) {
  const interno = Math.round(tamanho * (1 - margem * 2));
  const arte = await sharp(simbolo)
    .resize(interno, interno, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  return sharp({
    create: { width: tamanho, height: tamanho, channels: 4, background: fundo },
  })
    .composite([{ input: arte, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function run() {
  if (!existsSync(simbolo)) {
    console.error("Falta public/logo-simbolo.png. Rode antes: node scripts/prepare-logo.mjs");
    process.exit(1);
  }

  // Ícones comuns: margem pequena, o desenho ocupa quase tudo.
  for (const [nome, tamanho] of [
    ["pwa-192x192.png", 192],
    ["pwa-512x512.png", 512],
    ["apple-touch-icon.png", 180],
  ]) {
    const buf = await comFundo(tamanho, 0.1, CLARO);
    await sharp(buf).toFile(resolve(publicDir, nome));
  }

  // Ícone "maskable": o Android recorta as bordas em formatos variados
  // (círculo, quadrado arredondado). A margem maior garante que o desenho
  // não seja cortado, e o fundo rosa preenche a área que sobra.
  const maskable = await comFundo(512, 0.22, ROSA);
  await sharp(maskable).toFile(resolve(publicDir, "pwa-maskable-512x512.png"));

  console.log("Ícones gerados a partir do símbolo do logo, em client/public/");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
