// Script para adicionar produtos de demonstração marcados como "promoção
// da semana", só para visualizar o carrossel da Home com conteúdo real.
//
// Como as regras do Firebase agora exigem login de admin para escrever
// produtos, rode assim (substituindo pelo seu e-mail/senha de admin):
//
//   No PowerShell:
//   $env:ADMIN_EMAIL="gehaime43@gmail.com"; $env:ADMIN_PASSWORD="sua-senha"; node --use-system-ca scripts/seed-promo.mjs
//
// As credenciais ficam só na sua sessão do terminal, nunca são salvas em
// nenhum arquivo do projeto.
const DATABASE_URL = "https://flow-fcfb6-default-rtdb.firebaseio.com";
const API_KEY = "AIzaSyCeDjRmViI_-R76L10o00iBOc48vLyAGTY";

const demoProducts = [
  {
    name: "Batom Matte Rosa Nude",
    price: 39.9,
    category: "Maquiagem",
    description: "Cor intensa e longa duração, acabamento aveludado que não resseca os lábios.",
    image: "https://picsum.photos/seed/silbeauty-promo1/700/700",
    promotion: true,
  },
  {
    name: "Paleta de Sombras Nude",
    price: 79.9,
    category: "Maquiagem",
    description: "12 tons neutros de alta pigmentação, ideal para looks do dia a dia e noite.",
    image: "https://picsum.photos/seed/silbeauty-promo2/700/700",
    promotion: true,
  },
  {
    name: "Perfume Floral 50ml",
    price: 129.9,
    category: "Perfumaria",
    description: "Fragrância floral adocicada com notas de jasmim e baunilha, fixação prolongada.",
    image: "https://picsum.photos/seed/silbeauty-promo3/700/700",
    promotion: true,
  },
  {
    name: "Kit Skincare Facial",
    price: 149.9,
    category: "Skincare",
    description: "Sabonete, tônico e hidratante facial para uma rotina de cuidados completa.",
    image: "https://picsum.photos/seed/silbeauty-promo4/700/700",
    promotion: false,
  },
];

async function login(email, password) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Falha no login");
  return data.idToken;
}

async function seed() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      "Defina as variáveis ADMIN_EMAIL e ADMIN_PASSWORD antes de rodar este script (veja o comentário no topo do arquivo)."
    );
    process.exit(1);
  }

  console.log("Fazendo login...");
  const idToken = await login(email, password);

  console.log(`Enviando ${demoProducts.length} produtos de demonstração...`);
  for (const product of demoProducts) {
    const res = await fetch(`${DATABASE_URL}/products.json?auth=${idToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...product, createdAt: Date.now() }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Falha ao enviar "${product.name}": ${res.status} ${text}`);
    }

    console.log(`✔ ${product.name}${product.promotion ? " (promoção)" : ""}`);
  }

  console.log("Pronto!");
}

seed().catch((err) => {
  console.error("Erro ao popular produtos:", err.message);
  process.exit(1);
});
