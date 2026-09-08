import { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";

// Escuta em tempo real o histórico de pedidos do usuário logado.
export function useOrders(uid) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const ordersRef = ref(db, `orders/${uid}`);
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([id, value]) => ({ id, ...value }));
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setOrders(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  return { orders, loading };
}
