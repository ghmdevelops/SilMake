// Início do pagamento pelo Mercado Pago.
//
// O navegador não envia o valor: manda apenas o identificador do pedido. A
// função no servidor lê o total direto do banco. Se o valor viesse daqui,
// bastaria editar a requisição para pagar R$ 0,01 num pedido de R$ 200.
const CREATE_URL = "/api/mp-create-preference";

// Registro do pedido que está sendo pago no Mercado Pago.
//
// Fica em localStorage, e não em sessionStorage, porque precisa sobreviver ao
// fechamento da aba: quem paga e fecha o navegador só volta depois, e é nessa
// volta que o carrinho tem de ser limpo.
const PENDING_KEY = "silbeauty_compra_pendente";

// Depois disso o registro é descartado. Sem prazo, um pedido abandonado
// deixaria lixo no navegador da cliente para sempre.
const VALIDADE_MS = 7 * 24 * 60 * 60 * 1000;

export function savePendingPurchase({ uid, orderId, purchase }) {
  try {
    localStorage.setItem(
      PENDING_KEY,
      JSON.stringify({ uid, orderId, purchase, savedAt: Date.now() })
    );
  } catch {
    // Navegador em modo restrito. Perder o registro é aceitável; quebrar o
    // pagamento não seria.
  }
}

// Lê sem apagar. Usado na verificação que roda a cada carregamento do site.
export function peekPendingPurchase() {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;

    const dados = JSON.parse(raw);
    if (!dados?.orderId || Date.now() - (dados.savedAt || 0) > VALIDADE_MS) {
      localStorage.removeItem(PENDING_KEY);
      return null;
    }
    return dados;
  } catch {
    return null;
  }
}

export function clearPendingPurchase() {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    // sem consequência
  }
}

// Lê e apaga num só passo. O apagar é o que evita contar a mesma venda duas
// vezes se a cliente recarregar a página de retorno.
export function takePendingPurchase() {
  const dados = peekPendingPurchase();
  if (dados) clearPendingPurchase();
  return dados;
}

// Devolve { checkoutUrl } ou { error }. Nunca lança: uma falha aqui não pode
// perder o pedido, que já está salvo no Firebase.
export async function startPayment({ uid, orderId }) {
  try {
    const res = await fetch(CREATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, orderId }),
    });

    // 404 = rodando sem as funções do Netlify.
    if (res.status === 404) return { error: "sem_funcao" };

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.checkoutUrl) {
      return { error: data.error || "falhou", message: data.message };
    }

    return { checkoutUrl: data.checkoutUrl };
  } catch (err) {
    console.error("Falha ao iniciar o pagamento:", err);
    return { error: "rede" };
  }
}
