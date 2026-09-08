import { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";

// Usado no painel admin para listar os pedidos de TODOS os clientes.
// Requer que as regras do Firebase deem permissão de leitura de "orders"
// para a conta admin (veja o README).
export function useAllOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ordersRef = ref(db, "orders");
    const unsubscribe = onValue(
      ordersRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        const list = [];
        Object.entries(data).forEach(([uid, userOrders]) => {
          Object.entries(userOrders || {}).forEach(([orderId, order]) => {
            list.push({ id: orderId, uid, ...order });
          });
        });
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setOrders(list);
        setLoading(false);
      },
      (err) => {
        console.error("Erro ao carregar pedidos:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { orders, loading, error };
}
