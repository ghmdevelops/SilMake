import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { fetchOrderStatus } from "../api/orders";
import { peekPendingPurchase, clearPendingPurchase } from "../api/payment";
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

    fetchOrderStatus(currentUser.uid, pendente.orderId).then((status) => {
      if (cancelado) return;

      // Ainda pendente: o pagamento pode não ter sido feito, ou o Pix ainda
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
