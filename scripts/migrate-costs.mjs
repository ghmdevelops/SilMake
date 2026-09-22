// Migração única: move o campo "cost" de products/<id> para
// productCosts/<id> e apaga o original.
//
// Por que é necessário: "products" tem leitura pública (a vitrine precisa dos
// produtos sem login), e a permissão do Firebase é por nó, não por campo.
// Enquanto o custo morar lá, qualquer pessoa consegue ver a sua margem
// abrindo https://<seu-banco>.firebaseio.com/products.json no navegador.
//
// Rode com:
//   node scripts/migrate-costs.mjs            (mostra o que faria)
//   node scripts/migrate-costs.mjs --aplicar  (grava de verdade)
//
// Precisa de um token de admin, porque escrever em products e productCosts é
// restrito à sua conta. Gere assim:
//   Firebase Console → Realtime Database → aba Dados → menu dos três pontos
//   → "Testar regras"... não serve. O caminho simples é usar o segredo do
//   banco (Configurações do projeto → Contas de serviço → Segredos do banco
//   de dados) e passar por variável de ambiente:
//
//   $env:FIREBASE_SECRET="..."; node scripts/migrate-costs.mjs --aplicar

const DB = "https://flow-fcfb6-default-rtdb.firebaseio.com";
const APPLY = process.argv.includes("--aplicar");
const SECRET = process.env.FIREBASE_SECRET;

function url(path) {
  const auth = SECRET ? `?auth=${SECRET}` : "";
  return `${DB}/${path}.json${auth}`;
}

async function run() {
  if (APPLY && !SECRET) {
    console.error(
      "Falta FIREBASE_SECRET. Sem ele o Firebase recusa a escrita em products.\n" +
        'Exemplo: $env:FIREBASE_SECRET="seu-segredo"; node scripts/migrate-costs.mjs --aplicar'
    );
    process.exit(1);
  }

  const res = await fetch(url("products"));
  if (!res.ok) throw new Error(`Não consegui ler os produtos (${res.status})`);
  const products = (await res.json()) || {};

  const comCusto = Object.entries(products).filter(
    ([, p]) => p && typeof p.cost === "number"
  );

  if (comCusto.length === 0) {
    console.log("Nenhum produto com custo em products. Nada a migrar.");
    return;
  }

  console.log(`${comCusto.length} produto(s) com custo exposto em products:`);
  for (const [id, p] of comCusto) {
    console.log(`  ${p.name || id}: R$ ${p.cost}`);
  }

  if (!APPLY) {
    console.log("\nNada foi alterado. Rode de novo com --aplicar para migrar.");
    return;
  }

  // 1) Copia todos os custos de uma vez para o nó protegido.
  const costs = Object.fromEntries(comCusto.map(([id, p]) => [id, p.cost]));
  const write = await fetch(url("productCosts"), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(costs),
  });
  if (!write.ok) throw new Error(`Falha ao gravar productCosts (${write.status})`);
  console.log(`\nCustos copiados para productCosts.`);

  // 2) Só então apaga de products. Nesta ordem de propósito: se o passo 1
  // falhar, o dado antigo continua lá e nada se perde.
  for (const [id] of comCusto) {
    const del = await fetch(url(`products/${id}/cost`), { method: "DELETE" });
    if (!del.ok) {
      console.error(`  ERRO ao apagar o custo de ${id} (${del.status})`);
      continue;
    }
    console.log(`  custo removido de products/${id}`);
  }

  console.log("\nMigração concluída. Confira abrindo products.json no navegador:");
  console.log(`  ${DB}/products.json`);
  console.log('Não deve aparecer nenhum "cost".');
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
