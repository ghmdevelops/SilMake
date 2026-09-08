// Script único para gerar os ícones PWA/PNG a partir dos SVGs de origem.
// Rode com: node scripts/generate-icons.mjs
import sharp from "sharp";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "..", "public");

const favicon = readFileSync(resolve(publicDir, "favicon.svg"));
const maskable = readFileSync(resolve(publicDir, "icon-source-maskable.svg"));

async function run() {
  // Ícones "any" (com fundo arredondado), usados no manifest e no apple-touch-icon
  await sharp(favicon).resize(192, 192).png().toFile(resolve(publicDir, "pwa-192x192.png"));
  await sharp(favicon).resize(512, 512).png().toFile(resolve(publicDir, "pwa-512x512.png"));
  await sharp(favicon).resize(180, 180).png().toFile(resolve(publicDir, "apple-touch-icon.png"));

  // Ícone "maskable" (full-bleed, sem cantos arredondados pré-definidos)
  await sharp(maskable)
    .resize(512, 512)
    .png()
    .toFile(resolve(publicDir, "pwa-maskable-512x512.png"));

  console.log("Ícones gerados em client/public/");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
