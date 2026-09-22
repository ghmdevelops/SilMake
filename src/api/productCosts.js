import { db } from "../firebase";
import { ref, onValue, set, remove } from "firebase/database";

// Custo de compra de cada produto. Fica num nó separado, de leitura restrita
// à conta admin.
//
// Por que não pode ficar dentro de "products": aquele nó tem leitura pública,
// porque a vitrine precisa dos produtos sem login. E a permissão do Firebase
// é por nó, não por campo — não há como liberar o preço e esconder o custo no
// mesmo lugar.
//
// Na prática, com o custo em "products", qualquer pessoa abria
// https://<seu-banco>.firebaseio.com/products.json no navegador e via a sua
// margem inteira. Sem login, sem ferramenta.

// Escuta os custos em tempo real. Só a conta admin consegue ler — para
// qualquer outra, o Firebase recusa e devolvemos um objeto vazio, sem
// derrubar a tela.
export function subscribeProductCosts(callback) {
  const costsRef = ref(db, "productCosts");

  return onValue(
    costsRef,
    (snapshot) => callback(snapshot.val() || {}),
    (error) => {
      // Permissão negada é o caso normal quando não é admin.
      if (error.code !== "PERMISSION_DENIED") {
        console.error("Erro ao carregar custos:", error);
      }
      callback({});
    }
  );
}

// Grava o custo de um produto. Valor vazio remove o registro, em vez de
// gravar zero — custo zero é um dado válido (brinde) e confundir os dois
// inflaria o lucro nas métricas.
export function saveProductCost(productId, cost) {
  const node = ref(db, `productCosts/${productId}`);
  if (cost === null || cost === undefined || cost === "") return remove(node);
  return set(node, Math.max(0, Number(cost)));
}

// Chamado junto da exclusão do produto: sem isso o custo ficaria órfão.
export function deleteProductCost(productId) {
  return remove(ref(db, `productCosts/${productId}`));
}
