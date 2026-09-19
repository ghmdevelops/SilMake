import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { useUserProfile } from "../hooks/useUserProfile";
import { useProducts } from "../hooks/useProducts";
import { useShippingSettings } from "../hooks/useShippingSettings";
import { resolveShipping, missingForFreeShipping } from "../api/settings";
import { trackEvent } from "../utils/analytics";
import { fetchShippingQuote } from "../api/shippingQuote";
import { formatCep, onlyDigits } from "../api/cep";
import { useSeo } from "../hooks/useSeo";
import { createOrder } from "../api/orders";
import { decrementProductStock } from "../api/products";
import { hasStockControl } from "../utils/stock";
import { sendTelegramNotification } from "../utils/telegram";
import "./Cart.css";

function formatPrice(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDateTime(timestamp) {
  return new Date(timestamp).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAddress(address) {
  if (!address) return "";
  const { street, number, complement, neighborhood, city, state, zipCode } = address;
  if (!street) return "";
  const line1 = [street, number].filter(Boolean).join(", ");
  const line2 = [neighborhood, city, state].filter(Boolean).join(" - ");
  return [line1, complement, line2, zipCode].filter(Boolean).join("\n");
}

export default function Cart() {
  useSeo({ title: "Carrinho", description: "Revise os produtos do seu carrinho na SilBeauty." });

  const { items, removeFromCart, updateQuantity, clearCart, syncWithCatalog, totalPrice } =
    useCart();
  const { showToast } = useToast();
  const { currentUser } = useAuth();
  const { profile } = useUserProfile(currentUser?.uid);
  const { products, loading: productsLoading } = useProducts();
  const { shipping } = useShippingSettings();
  const navigate = useNavigate();

  const [cep, setCep] = useState("");
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [quoteUnavailable, setQuoteUnavailable] = useState(false);

  // Assim que o catálogo carrega, alinha os preços do carrinho com os atuais.
  // Evita o cliente finalizar com um preço antigo guardado no navegador.
  useEffect(() => {
    if (productsLoading) return;

    const { priceChanges, unavailable } = syncWithCatalog(products);

    if (priceChanges.length > 0) {
      const detail = priceChanges
        .map((c) => `${c.name}: ${formatPrice(c.from)} → ${formatPrice(c.to)}`)
        .join(" · ");
      showToast(`Preço atualizado — ${detail}`, { type: "info", duration: 7000 });
    }

    if (unavailable.length > 0) {
      showToast(`${unavailable.join(", ")} não está mais disponível na loja.`, {
        type: "error",
        duration: 7000,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, productsLoading]);

  // O CEP começa com o do endereço salvo, quando existe.
  useEffect(() => {
    if (profile?.address?.zipCode) setCep(formatCep(profile.address.zipCode));
  }, [profile?.address?.zipCode]);

  const {
    fee: shippingFee,
    pending: shippingPending,
    isPickup,
    toBeArranged,
  } = resolveShipping({
    subtotal: totalPrice,
    shipping,
    selectedOption,
    destinationCep: cep,
    quoteUnavailable,
  });

  const missingForFree = missingForFreeShipping(totalPrice, shipping);
  const reachedFreeShipping = missingForFree === 0 && Number(shipping.freeAbove) > 0;
  const orderTotal = totalPrice + shippingFee;

  // Cota sozinho quando já sabemos o CEP (do perfil ou digitado antes), para o
  // cliente não precisar clicar em nada para ver o valor.
  const autoQuoteKey = `${shipping.originCep || ""}|${onlyDigits(cep)}|${items.length}`;
  useEffect(() => {
    if (!shipping.originCep) return;
    if (onlyDigits(cep).length !== 8) return;
    if (items.length === 0 || reachedFreeShipping) return;

    runQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoQuoteKey, reachedFreeShipping]);

  // Botão "Calcular": valida o CEP antes de cotar.
  function handleQuote(e) {
    e?.preventDefault();
    if (onlyDigits(cep).length !== 8) {
      setQuoteError("Digite os 8 números do CEP.");
      return;
    }
    runQuote();
  }

  // Consulta as opções reais de frete para o CEP informado.
  async function runQuote() {
    setQuoteError("");
    setSelectedOption(null);
    setQuoteUnavailable(false);
    setQuoting(true);
    try {
      const result = await fetchShippingQuote({
        originCep: shipping.originCep,
        destinationCep: cep,
        items: items.map((item) => {
          // As medidas ficam no catálogo, não no carrinho.
          const product = products.find((p) => p.id === item.id) || {};
          return { ...product, ...item };
        }),
      });

      if (result.unavailable) {
        setOptions([]);
        // Libera o checkout com o frete de reserva: travar o cliente por um
        // problema nosso seria perder a venda.
        setQuoteUnavailable(true);
        setQuoteError(
          result.reason === "sem_cep_origem"
            ? "A loja ainda não configurou o CEP de origem."
            : Number(shipping.fee) > 0
              ? "Não conseguimos cotar agora — aplicamos o frete padrão da loja."
              : "Não conseguimos cotar agora. O valor do frete será combinado com você."
        );
        return;
      }

      setOptions(result.options);
      setSelectedOption(result.options[0]); // a mais barata vem primeiro
    } finally {
      setQuoting(false);
    }
  }

  // Estoque atual (do banco) de um produto que está no carrinho.
  function getAvailableStock(itemId) {
    const product = products.find((p) => p.id === itemId);
    if (!product || !hasStockControl(product)) return Infinity;
    return product.stock;
  }

  function handleIncreaseQuantity(item) {
    const available = getAvailableStock(item.id);
    if (item.quantity + 1 > available) {
      showToast(
        available === 0
          ? "Este produto ficou sem estoque."
          : `Só temos ${available} unidade${available > 1 ? "s" : ""} deste produto em estoque.`,
        { type: "info" }
      );
      return;
    }
    updateQuantity(item.id, item.quantity + 1);
  }

  async function handleCheckout() {
    // Boa prática: exige login antes de finalizar, para vincular o pedido à
    // conta do cliente e permitir o histórico de compras no perfil.
    if (!currentUser) {
      showToast("Entre na sua conta para finalizar a compra", { type: "info" });
      navigate("/login", { state: { from: "/carrinho" } });
      return;
    }

    // Última conferência contra o catálogo antes de fechar o pedido: produto
    // que saiu do ar, preço que mudou e estoque que acabou.
    const missing = items.filter((item) => !products.some((p) => p.id === item.id));
    if (missing.length > 0) {
      showToast(
        `${missing.map((i) => i.name).join(", ")} não está mais disponível. Remova do carrinho para continuar.`,
        { type: "error", duration: 6000 }
      );
      return;
    }

    const outdated = items.filter((item) => {
      const product = products.find((p) => p.id === item.id);
      return Number(item.price) !== Number(product.price || 0);
    });
    if (outdated.length > 0) {
      syncWithCatalog(products);
      showToast("Os preços do carrinho foram atualizados. Confira o total antes de finalizar.", {
        type: "info",
        duration: 6000,
      });
      return;
    }

    // Sem frete calculado o pedido sairia com valor zerado e você cobraria a
    // diferença depois — melhor barrar aqui.
    if (shippingPending) {
      showToast("Calcule o frete antes de finalizar (informe seu CEP acima).", {
        type: "info",
        duration: 5000,
      });
      return;
    }

    const unavailable = items.filter((item) => item.quantity > getAvailableStock(item.id));
    if (unavailable.length > 0) {
      const names = unavailable.map((i) => i.name).join(", ");
      showToast(`Estoque insuficiente para: ${names}. Ajuste as quantidades do carrinho.`, {
        type: "error",
        duration: 6000,
      });
      return;
    }

    const address = formatAddress(profile?.address);
    if (!address) {
      showToast("Adicione um endereço de entrega no seu perfil antes de finalizar", {
        type: "info",
        duration: 4500,
      });
      navigate("/perfil");
      return;
    }

    const now = Date.now();
    const lines = items.map(
      (item) =>
        `• ${item.name} (x${item.quantity}) — ${formatPrice(item.price * item.quantity)}`
    );

    let orderNumber = "";
    try {
      orderNumber = await createOrder(currentUser.uid, {
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        subtotal: totalPrice,
        shippingFee,
        // Guardamos qual serviço foi cotado, para você saber o que comprar na
        // etiqueta depois (e o cliente ver no histórico).
        shippingService: selectedOption
          ? `${selectedOption.company} ${selectedOption.name}`.trim()
          : isPickup
            ? "Retirada no local"
            : toBeArranged
              ? "A COMBINAR — frete não cotado"
              : "",
        shippingDays: selectedOption?.days || 0,
        total: orderTotal,
        address: profile.address,
        customerName: currentUser.displayName || "",
        customerEmail: currentUser.email || "",
        createdAt: now,
      });
    } catch (err) {
      // Se o pedido não foi salvo, nada mais pode seguir: não damos baixa no
      // estoque, não avisamos o admin e não limpamos o carrinho — senão o
      // cliente veria "sucesso" por um pedido que não existe.
      console.error("Erro ao salvar o pedido:", err);
      showToast(
        `Não conseguimos registrar seu pedido${err.code ? ` (${err.code})` : ""}. Tente novamente em instantes — seu carrinho está salvo.`,
        { type: "error", duration: 7000 }
      );
      return;
    }

    // Dá baixa no estoque de cada item (produtos sem controle são ignorados).
    await Promise.all(
      items.map(async (item) => {
        try {
          await decrementProductStock(item.id, item.quantity);
        } catch (err) {
          console.error(`Erro ao dar baixa no estoque de ${item.name}:`, err);
        }
      })
    );

    const message = [
      `🛍️ Novo pedido${orderNumber ? ` #${orderNumber}` : ""} na SilBeauty!`,
      "",
      ...lines,
      "",
      `Subtotal: ${formatPrice(totalPrice)}`,
      `Frete: ${shippingFee > 0 ? formatPrice(shippingFee) : "Grátis"}`,
      `Total: ${formatPrice(orderTotal)}`,
      "",
      "Endereço de entrega:",
      address,
      "",
      `Cliente: ${currentUser.displayName || currentUser.email}`,
      `E-mail: ${currentUser.email}`,
      `Data do pedido: ${formatDateTime(now)}`,
    ].join("\n");

    // Envia o aviso direto pro seu Telegram, sem abrir nada nem redirecionar
    // o cliente para lugar nenhum.
    try {
      await sendTelegramNotification(message);
    } catch (err) {
      console.error("Erro ao enviar notificação do pedido:", err);
    }

    showToast(
      orderNumber
        ? `Pedido #${orderNumber} enviado com sucesso! Em breve entraremos em contato.`
        : "Pedido enviado com sucesso! Em breve entraremos em contato.",
      { type: "success", duration: 4500 }
    );

    // Evento de compra no padrão do GA4, para os relatórios de e-commerce
    // funcionarem sem configuração extra.
    trackEvent("purchase", {
      transaction_id: orderNumber,
      value: orderTotal,
      shipping: shippingFee,
      currency: "BRL",
      items: items.map((item) => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    });

    clearCart();

    // Leva o cliente direto para o histórico, onde ele acompanha o status
    // e o rastreio do pedido que acabou de fazer.
    navigate("/meus-pedidos");
  }

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <span className="cart-empty-icon">🛒</span>
        <p>Seu carrinho está vazio.</p>
        <Link to="/" className="btn btn-primary">
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Seu carrinho</h1>

      <div className="cart-list">
        {items.map((item) => (
          <div className="cart-item" key={item.id}>
            <div className="cart-item-image">
              {item.image ? (
                <img src={item.image} alt={item.name} />
              ) : (
                <div className="cart-item-placeholder" />
              )}
            </div>

            <div className="cart-item-info">
              <Link to={`/produto/${item.id}`} className="cart-item-name">
                {item.name}
              </Link>
              <p className="cart-item-price">{formatPrice(item.price)}</p>
            </div>

            <div className="cart-item-actions">
              <div className="quantity-picker">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => handleIncreaseQuantity(item)}>+</button>
              </div>

              <p className="cart-item-subtotal">
                {formatPrice(item.price * item.quantity)}
              </p>

              <button className="cart-item-remove" onClick={() => removeFromCart(item.id)}>
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <button className="btn btn-ghost" onClick={clearCart}>
          Esvaziar carrinho
        </button>

        <div className="cart-totals">
          {/* Cotação real: o cliente informa o CEP e escolhe a transportadora */}
          {!reachedFreeShipping && (
            <form className="cart-quote" onSubmit={handleQuote}>
              <label htmlFor="cart-cep">Calcular frete</label>
              <div className="cart-quote-row">
                <input
                  id="cart-cep"
                  className="input"
                  value={cep}
                  onChange={(e) => setCep(formatCep(e.target.value))}
                  placeholder="00000-000"
                  inputMode="numeric"
                  maxLength={9}
                />
                <button type="submit" className="btn btn-ghost" disabled={quoting}>
                  {quoting ? "Cotando..." : "Calcular"}
                </button>
              </div>

              {quoteError && <span className="cart-quote-error">{quoteError}</span>}

              {options.length > 0 && (
                <div className="cart-quote-options">
                  {options.map((option) => (
                    <label
                      key={option.id}
                      className={`cart-quote-option ${
                        selectedOption?.id === option.id ? "selected" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping-option"
                        checked={selectedOption?.id === option.id}
                        onChange={() => setSelectedOption(option)}
                      />
                      <span className="cart-quote-option-info">
                        <strong>
                          {option.company} {option.name}
                        </strong>
                        {option.days > 0 && (
                          <small>
                            até {option.days} dia{option.days > 1 ? "s" : ""} útil
                            {option.days > 1 ? "eis" : ""}
                          </small>
                        )}
                      </span>
                      <span className="cart-quote-option-price">{formatPrice(option.price)}</span>
                    </label>
                  ))}
                </div>
              )}
            </form>
          )}

          <div className="cart-total-line">
            <span>Subtotal</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>

          <div className="cart-total-line">
            <span>Frete</span>
            {shippingPending ? (
              <span className="cart-shipping-pending">
                {quoting ? "calculando..." : "informe o CEP"}
              </span>
            ) : toBeArranged ? (
              <span className="cart-shipping-pending">a combinar</span>
            ) : shippingFee > 0 ? (
              <span>{formatPrice(shippingFee)}</span>
            ) : (
              <span className="cart-free-shipping">
                {isPickup ? "Grátis (retirada)" : "Grátis"}
              </span>
            )}
          </div>

          {missingForFree > 0 && (
            <p className="cart-shipping-hint">
              Faltam <strong>{formatPrice(missingForFree)}</strong> para ganhar frete grátis
            </p>
          )}

          {shipping.note && <p className="cart-shipping-note">{shipping.note}</p>}

          <div className="cart-total">
            <span>
              Total
              {shippingPending ? " (sem frete)" : ""}
              {toBeArranged ? " + frete" : ""}
            </span>
            <strong>{formatPrice(orderTotal)}</strong>
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleCheckout}>
          Finalizar compra
        </button>
      </div>
    </div>
  );
}
