import { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";

// Escuta em tempo real o histórico de pedidos do usuário logado.
//
// O estado guarda de qual `uid` são os pedidos. Assim "carregando" é
// derivado ("o dado que tenho não é deste usuário") em vez de ser um estado
// separado que precisaria ser zerado dentro do efeito.
export function useOrders(uid) {
  const [state, setState] = useState({ uid: null, orders: [] });

  useEffect(() => {
    if (!uid) return undefined;

    const ordersRef = ref(db, `orders/${uid}`);
    const unsubscribe = onValue(
      ordersRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        const list = Object.entries(data).map(([id, value]) => ({ id, ...value }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setState({ uid, orders: list });
      },
      (error) => {
        console.error("Erro ao carregar pedidos:", error);
        setState({ uid, orders: [] });
      }
    );

    return () => unsubscribe();
  }, [uid]);

  const ready = state.uid === uid;

  return {
    orders: ready ? state.orders : [],
    loading: !!uid && !ready,
  };
}
