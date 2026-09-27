// Prepara o logo para uso no site, a partir de public/logoSil.png.
//
// Rode com: node scripts/prepare-logo.mjs
//
// O arquivo original vem com fundo cinza sólido (#F3F3F5), não transparente.
// Sobre o fundo do site isso passa despercebido — as duas cores são quase
// iguais —, mas sobre o gradiente rosa da tela de abertura apareceria um
// retângulo cinza em volta do logo.
//
// Gera dois arquivos:
//   logo.png          logo completo (símbolo + palavra), fundo transparente
//   logo-simbolo.png  só o rosto com a flor, para o menu e os ícones
//
// Se um dia você tiver o logo em SVG ou com fundo já transparente, use-o
// direto e este script deixa de ser necessário.

import sharp from "sharp";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "..", "public");
const origem = resolve(publicDir, "logoSil.png");

// Acima deste brilho o pixel é fundo. Abaixo do outro, é desenho. No meio
// fica a transição suavizada da borda — tratá-la como degradê evita o
// contorno serrilhado que um corte seco deixaria.
const FUNDO = 238;
const DESENHO = 205;

// PNG com paleta em vez de cor real. O logo é traço, com poucas cores — a
// paleta reduz o arquivo para uma fração sem diferença visível. Importa
// porque o logo é a primeira imagem que a página carrega, na tela de
// abertura: cada KB aqui atrasa o que a cliente vê primeiro.
const PNG_OPCOES = { palette: true, quality: 90, compressionLevel: 9 };

async function removerFundo(buffer) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const brilho = (data[i] + data[i + 1] + data[i + 2]) / 3;

    if (brilho >= FUNDO) {
      data[i + 3] = 0;
    } else if (brilho > DESENHO) {
      // Borda: opacidade proporcional, para o traço não ficar recortado.
      const proporcao = (FUNDO - brilho) / (FUNDO - DESENHO);
      data[i + 3] = Math.round(data[i + 3] * proporcao);
    }
  }

  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toBuffer();
}

async function run() {
  const original = await sharp(origem).toBuffer();
  const { height } = await sharp(origem).metadata();

  const semFundo = await removerFundo(original);

  // trim() corta o vazio que sobrou nas bordas, para o logo ocupar todo o
  // espaço que receber no layout.
  await sharp(semFundo).trim().png(PNG_OPCOES).toFile(resolve(publicDir, "logo.png"));

  // A palavra "SilBeauty" ocupa a faixa de baixo. Cortamos os 60% de cima
  // para ficar só o símbolo.
  //
  // O corte e o trim vão em etapas separadas de propósito: encadeados, o
  // sharp reordena as operações e o recorte acaba calculado sobre dimensões
  // que não existem mais.
  const meta = await sharp(semFundo).metadata();
  const cortado = await sharp(semFundo)
    .extract({
      left: 0,
      top: 0,
      width: meta.width,
      height: Math.min(meta.height, Math.round(height * 0.6)),
    })
    .png()
    .toBuffer();

  await sharp(cortado).trim().png(PNG_OPCOES).toFile(resolve(publicDir, "logo-simbolo.png"));

  for (const nome of ["logo.png", "logo-simbolo.png"]) {
    const m = await sharp(resolve(publicDir, nome)).metadata();
    console.log(`${nome}: ${m.width}x${m.height}`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
