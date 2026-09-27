import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { fetchOrderStatus } from "../api/orders";
import { peekPendingPurchase, clearPendingPurchase, syncOrderPayment } from "../api/payment";
import { trackEvent } from "../utils/analytics";

// Limpa o carrinho quando um pagamento iniciado antes já foi confirmado.
//
// O caso que isto resolve: a cliente paga no Mercado Pago e fecha a aba sem
// voltar para a loja. O pedido é confirmado normalmente pelo webhook, mas o
// carrinho dela continuaria cheio — e na próxima visita ela veria os itens que
// já comprou, com risco de comprar de novo.
//
// Roda uma vez por carregamento, e só quando existe um pagamento registrado.
// Sem registro, nenhuma consulta é feita.
export function usePaidOrderCleanup() {
  const { currentUser } = useAuth();
  const { clearCart } = useCart();

  useEffect(() => {
    if (!currentUser) return;

    const pendente = peekPendingPurchase();
    if (!pendente) return;

    // Registro de outra conta (alguém trocou de login no mesmo navegador):
    // descartar é mais seguro que limpar o carrinho de quem está agora.
    if (pendente.uid && pendente.uid !== currentUser.uid) {
      clearPendingPurchase();
      return;
    }

    let cancelado = false;

    async function verificar() {
      let status = await fetchOrderStatus(currentUser.uid, pendente.orderId);

      // Ainda pendente no banco não significa não pago: o aviso do Mercado
      // Pago pode não ter chegado. Antes de desistir, perguntamos direto na
      // fonte — é o que evita um pedido pago ficar pendente para sempre.
      if (status === "pending") {
        const conferencia = await syncOrderPayment({
          uid: currentUser.uid,
          orderId: pendente.orderId,
        });
        if (conferencia?.resultado === "pago") status = "paid";
      }

      return status;
    }

    verificar().then((status) => {
      if (cancelado) return;

      // Continua pendente de verdade: pode não ter sido pago, ou o Pix ainda
      // não compensou. Mantemos o registro e o carrinho como estão.
      if (!status || status === "pending") return;

      // O evento de compra só é enviado aqui se ainda não tiver sido. Quem
      // volta pela tela de retorno já disparou e apagou o registro, então
      // chegar até aqui significa que ninguém contou esta venda.
      if (pendente.purchase) trackEvent("purchase", pendente.purchase);

      clearCart();
      clearPendingPurchase();
    });

    return () => {
      cancelado = true;
    };
  }, [currentUser, clearCart]);
}
