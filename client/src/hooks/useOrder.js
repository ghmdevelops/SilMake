import { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";

// Escuta em tempo real um único pedido específico — usado na página de
// detalhes do pedido que abre em uma aba separada no admin.
//
// O estado guarda de QUAL pedido ele é (`key`). Com isso, "carregando" é
// derivado — é simplesmente "o dado que tenho não é do pedido que estou
// pedindo agora". Isso evita mexer no estado dentro do efeito, que causaria
// uma renderização extra a cada troca de pedido.
export function useOrder(uid, orderId) {
  const key = uid && orderId ? `${uid}/${orderId}` : null;
  const [state, setState] = useState({ key: null, order: null, error: null });

  useEffect(() => {
    if (!key) return undefined;

    const orderRef = ref(db, `orders/${key}`);
    const unsubscribe = onValue(
      orderRef,
      (snapshot) => {
        const data = snapshot.val();
        setState({ key, order: data ? { id: orderId, uid, ...data } : null, error: null });
      },
      (err) => {
        console.error("Erro ao carregar pedido:", err);
        setState({ key, order: null, error: err });
      }
    );

    return () => unsubscribe();
  }, [key, uid, orderId]);

  const ready = state.key === key;

  return {
    order: ready ? state.order : null,
    loading: !!key && !ready,
    error: ready ? state.error : null,
  };
}
