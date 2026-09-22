// Início do pagamento pelo Mercado Pago.
//
// O navegador não envia o valor: manda apenas o identificador do pedido. A
// função no servidor lê o total direto do banco. Se o valor viesse daqui,
// bastaria editar a requisição para pagar R$ 0,01 num pedido de R$ 200.
const CREATE_URL = "/api/mp-create-preference";

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
