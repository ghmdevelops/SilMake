import { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";

// Escuta em tempo real um único pedido específico — usado na página de
// detalhes do pedido que abre em uma aba separada no admin.
export function useOrder(uid, orderId) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!uid || !orderId) {
      setOrder(null);
      setLoading(false);
      return;
    }

    const orderRef = ref(db, `orders/${uid}/${orderId}`);
    const unsubscribe = onValue(
      orderRef,
      (snapshot) => {
        const data = snapshot.val();
        setOrder(data ? { id: orderId, uid, ...data } : null);
        setLoading(false);
      },
      (err) => {
        console.error("Erro ao carregar pedido:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid, orderId]);

  return { order, loading, error };
}
