import { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";

// Escuta em tempo real a lista de produtos no Realtime Database
export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const productsRef = ref(db, "products");
    const unsubscribe = onValue(
      productsRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        const list = Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
        }));
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setProducts(list);
        setLoading(false);
      },
      (error) => {
        console.error("Erro ao carregar produtos:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { products, loading };
}
