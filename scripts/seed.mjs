// Script para popular o Firebase Realtime Database com produtos fake,
// só para você visualizar como a loja vai ficar.
// Rode com: node scripts/seed.mjs
//
// Requer que as regras do Realtime Database permitam escrita pública em "products"
// (veja o README.md na raiz do projeto).

const DATABASE_URL = "https://flow-fcfb6-default-rtdb.firebaseio.com";

const fakeProducts = [
  {
    name: "Vela Aromática Lavanda",
    price: 39.9,
    category: "Decoração",
    description: "Vela artesanal de cera de soja com essência de lavanda, queima de até 30 horas.",
    image: "https://picsum.photos/seed/SilBeauty1/600/600",
  },
  {
    name: "Caneca de Cerâmica Pintada à Mão",
    price: 54.5,
    category: "Casa",
    description: "Caneca 300ml feita e pintada à mão, cada peça é única.",
    image: "https://picsum.photos/seed/SilBeauty2/600/600",
  },
  {
    name: "Bolsa de Crochê Boho",
    price: 129.9,
    category: "Acessórios",
    description: "Bolsa de crochê 100% algodão, forrada, com alça de couro sintético.",
    image: "https://picsum.photos/seed/SilBeauty3/600/600",
  },
  {
    name: "Sabonete Artesanal Kit c/ 3",
    price: 45,
    category: "Beleza",
    description: "Kit com 3 sabonetes artesanais glicerinados, aromas de coco, avelã e erva-doce.",
    image: "https://picsum.photos/seed/SilBeauty4/600/600",
  },
  {
    name: "Caderno Artesanal Capa Dura",
    price: 68,
    category: "Papelaria",
    description: "Caderno com 80 folhas, capa dura revestida em tecido e costura exposta.",
    image: "https://picsum.photos/seed/SilBeauty5/600/600",
  },
  {
    name: "Brinco de Resina Floral",
    price: 32.9,
    category: "Acessórios",
    description: "Par de brincos artesanais em resina cristal com flores secas naturais.",
    image: "https://picsum.photos/seed/SilBeauty6/600/600",
  },
];

async function seed() {
  console.log(`Enviando ${fakeProducts.length} produtos fake para o Firebase...`);

  for (const product of fakeProducts) {
    const res = await fetch(`${DATABASE_URL}/products.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...product, createdAt: Date.now() }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Falha ao enviar "${product.name}": ${res.status} ${text}`);
    }

    console.log(`✔ ${product.name}`);
  }

  console.log("Pronto! Produtos fake adicionados.");
}

seed().catch((err) => {
  console.error("Erro ao popular produtos:", err.message);
  process.exit(1);
});
