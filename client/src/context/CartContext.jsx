import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "silbeauty_cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function addToCart(product, quantity = 1) {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
  }

  function removeFromCart(id) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function updateQuantity(id, quantity) {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  }

  function clearCart() {
    setItems([]);
  }

  // O carrinho vive no localStorage, então pode guardar por semanas o preço
  // que o produto tinha quando foi adicionado. Esta função confronta os itens
  // com o catálogo atual: corrige preço/nome/imagem e marca como indisponível
  // o que não existe mais. Retorna o resumo do que mudou, para avisar o cliente.
  function syncWithCatalog(products) {
    const priceChanges = [];
    const unavailable = [];
    let changed = false;

    const next = items.map((item) => {
      const product = products.find((p) => p.id === item.id);

      if (!product) {
        unavailable.push(item.name);
        if (!item.unavailable) changed = true;
        return { ...item, unavailable: true };
      }

      const currentPrice = Number(product.price || 0);
      if (Number(item.price) !== currentPrice) {
        priceChanges.push({ name: product.name, from: Number(item.price), to: currentPrice });
        changed = true;
      }
      if (item.name !== product.name || item.image !== product.image || item.unavailable) {
        changed = true;
      }

      return {
        ...item,
        name: product.name,
        image: product.image,
        price: currentPrice,
        unavailable: false,
      };
    });

    if (changed) setItems(next);
    return { priceChanges, unavailable };
  }

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.quantity * Number(item.price || 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        syncWithCatalog,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de CartProvider");
  return ctx;
}
