import { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";

// Lê os contadores da loja para o painel admin. A leitura é restrita ao
// admin nas regras do Firebase, então isto só funciona logado como admin.
export function useStats() {
  const [stats, setStats] = useState({ productViews: {}, addToCart: {}, emptySearches: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const statsRef = ref(db, "stats");
    const unsubscribe = onValue(
      statsRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        setStats({
          productViews: data.productViews || {},
          addToCart: data.addToCart || {},
          emptySearches: data.emptySearches || {},
        });
        setLoading(false);
      },
      (error) => {
        console.error("Erro ao carregar estatísticas:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { stats, loading };
}
