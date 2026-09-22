// Gera o sitemap.xml incluindo as páginas de produto.
//
// Rode com: node scripts/generate-sitemap.mjs
//
// Por que importa: as páginas de produto são as que trazem visita do Google
// ("sérum de vitamina C", "cera para sobrancelha"). Um sitemap só com páginas
// institucionais deixa justamente elas de fora.
//
// Lê o catálogo pela API REST do Realtime Database — os produtos são de
// leitura pública, então não precisa de credencial.
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "..", "public");

const SITE = "https://silbeauty.netlify.app";
const DB = "https://flow-fcfb6-default-rtdb.firebaseio.com";

// Páginas fixas, com a prioridade que faz sentido para cada uma.
const PAGES = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/dicas-de-beleza", changefreq: "monthly", priority: "0.8" },
  { path: "/sobre", changefreq: "monthly", priority: "0.6" },
  { path: "/faq", changefreq: "monthly", priority: "0.6" },
  { path: "/politica-de-privacidade", changefreq: "yearly", priority: "0.3" },
  { path: "/termos-de-uso", changefreq: "yearly", priority: "0.3" },
];

function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]
  );
}

function urlEntry({ path, changefreq, priority, lastmod }) {
  return [
    "  <url>",
    `    <loc>${SITE}${escapeXml(path)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");
}

async function fetchProducts() {
  // shallow=false porque precisamos de hidden/createdAt de cada produto.
  const res = await fetch(`${DB}/products.json`);
  if (!res.ok) throw new Error(`Firebase respondeu ${res.status}`);
  const data = (await res.json()) || {};

  return Object.entries(data)
    // Produto pausado não deve ser indexado: o cliente cairia numa página
    // que a loja não mostra.
    .filter(([, p]) => p && !p.hidden)
    .map(([id, p]) => ({
      path: `/produto/${id}`,
      changefreq: "weekly",
      priority: "0.9",
      lastmod: p.createdAt
        ? new Date(Number(p.createdAt)).toISOString().slice(0, 10)
        : undefined,
    }));
}

async function run() {
  let products = [];

  try {
    products = await fetchProducts();
    console.log(`${products.length} produto(s) no sitemap.`);
  } catch (err) {
    // Falha de rede não pode quebrar o build: geramos o sitemap só com as
    // páginas fixas, que é melhor que sitemap nenhum.
    console.warn(`Não foi possível ler os produtos (${err.message}). Gerando sem eles.`);
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...[...PAGES, ...products].map(urlEntry),
    "</urlset>",
    "",
  ].join("\n");

  writeFileSync(resolve(publicDir, "sitemap.xml"), xml, "utf8");
  console.log(`sitemap.xml gerado com ${PAGES.length + products.length} URLs.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
