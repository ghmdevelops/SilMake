import { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";
import { DEFAULT_SHIPPING } from "../api/settings";

// Escuta em tempo real as configurações de frete definidas pelo admin.
// Se nada estiver configurado, usa o padrão (frete grátis).
export function useShippingSettings() {
  const [shipping, setShipping] = useState(DEFAULT_SHIPPING);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const shippingRef = ref(db, "settings/shipping");
    const unsubscribe = onValue(
      shippingRef,
      (snapshot) => {
        setShipping({ ...DEFAULT_SHIPPING, ...(snapshot.val() || {}) });
        setLoading(false);
      },
      (error) => {
        console.error("Erro ao carregar configurações de frete:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { shipping, loading };
}
