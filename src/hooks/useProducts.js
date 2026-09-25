import { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";
import { useAuth } from "../context/AuthContext";

// Escuta em tempo real a lista de produtos no Realtime Database.
//
// Produtos marcados como "oculto na loja" no admin são removidos por padrão,
// para que nenhuma tela da loja precise lembrar de filtrá-los.
//
// Duas exceções:
//   includeHidden: true  — o painel administrativo, que lista tudo.
//   conta admin logada   — os ocultos aparecem na vitrine normal, marcados
//                          como tal. Serve para pré-visualizar um produto
//                          antes de publicar, e para comprar um produto de
//                          teste sem que as clientes o vejam.
export function useProducts({ includeHidden = false } = {}) {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const mostrarOcultos = includeHidden || isAdmin;

  useEffect(() => {
    const productsRef = ref(db, "products");
    const unsubscribe = onValue(
      productsRef,
      (snapshot) => {
        const data = snapshot.val() || {};
        const list = Object.entries(data)
          .map(([id, value]) => ({ id, ...value }))
          .filter((product) => mostrarOcultos || !product.hidden);
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
  }, [mostrarOcultos]);

  return { products, loading };
}
