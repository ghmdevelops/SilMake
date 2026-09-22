import { decrementProductStock, incrementProductStock } from "../api/products";
import { holdsStock } from "./orderStatus";

// Mantém o estoque coerente com o status do pedido.
//
// A baixa acontece quando VOCÊ confirma o pagamento (status "pago"), não
// quando o cliente finaliza a compra. Antes era no checkout, o que obrigava
// a regra do Firebase a liberar escrita no estoque para qualquer pessoa
// logada — bastava criar uma conta para zerar o estoque da loja.
//
// A tabela de decisão é simples: só importa se o status anterior e o novo
// seguram estoque ou não.
//
//   pendente  → pago       : dá baixa
//   pago      → enviado    : nada muda (os dois seguram)
//   pago      → encerrado  : devolve
//   encerrado → pago       : dá baixa de novo
//
// Devolve o que não conseguiu processar, para a tela poder avisar. Um erro
// aqui não pode derrubar a mudança de status: o pedido já mudou, e travar a
// tela deixaria você sem saber o que aconteceu.
export async function syncStockForStatusChange(order, previousStatus, newStatus) {
  const wasHeld = holdsStock(previousStatus);
  const willHold = holdsStock(newStatus);

  if (wasHeld === willHold) return { changed: false, failed: [] };

  const items = order.items || [];
  const failed = [];

  await Promise.all(
    items.map(async (item) => {
      const quantity = Number(item.quantity || 0);
      if (!item.id || quantity <= 0) return;

      try {
        if (willHold) {
          // Passou a segurar estoque: retira as unidades.
          const { committed, reason } = await decrementProductStock(item.id, quantity);
          // "sem-controle" é normal e silencioso. Já "insuficiente" precisa
          // aparecer: agora que a baixa é adiada, dois clientes podem ter
          // pedido a última unidade antes de você confirmar qualquer um.
          if (!committed && reason === "insuficiente") failed.push(item.name || item.id);
        } else {
          await incrementProductStock(item.id, quantity);
        }
      } catch (err) {
        console.error(`Erro ao ajustar estoque de ${item.name}:`, err);
        failed.push(item.name || item.id);
      }
    })
  );

  return { changed: true, failed };
}
