import { decrementProductStock, incrementProductStock } from "../api/products";

// O estoque é baixado no momento em que o cliente finaliza o pedido.
// Se o admin encerra o pedido (cliente não pagou), essas unidades precisam
// voltar para o estoque. E se ele reabrir o pedido depois, precisam sair de
// novo. Esta função cuida das duas situações.
export async function syncStockForStatusChange(order, previousStatus, newStatus) {
  const wasClosed = previousStatus === "closed";
  const willBeClosed = newStatus === "closed";

  if (wasClosed === willBeClosed) return; // nada muda no estoque

  const items = order.items || [];

  await Promise.all(
    items.map(async (item) => {
      try {
        if (willBeClosed) {
          // Pedido encerrado: devolve as unidades ao estoque.
          await incrementProductStock(item.id, Number(item.quantity || 0));
        } else {
          // Pedido reaberto: retira as unidades do estoque novamente.
          await decrementProductStock(item.id, Number(item.quantity || 0));
        }
      } catch (err) {
        console.error(`Erro ao ajustar estoque de ${item.name}:`, err);
      }
    })
  );
}
