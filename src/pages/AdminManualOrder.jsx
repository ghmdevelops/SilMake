import { useState } from "react";
import { useProducts } from "../hooks/useProducts";
import { useShippingSettings } from "../hooks/useShippingSettings";
import { useToast } from "../context/ToastContext";
import { createManualOrder } from "../api/orders";
import { decrementProductStock } from "../api/products";
import { calculateShipping } from "../api/settings";
import { fetchAddressByCep, formatCep, onlyDigits } from "../api/cep";
import { ORDER_STATUS_LABELS } from "../utils/orderStatus";
import { hasStockControl } from "../utils/stock";
import "./AdminManualOrder.css";

function formatPrice(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Um pedido lançado à mão normalmente já foi pago na conversa, então "Pago"
// é o padrão — mas dá para escolher outra etapa.
const STATUS_OPTIONS = ["paid", "pending", "shipped", "completed"];

export default function AdminManualOrder() {
  const { products } = useProducts({ includeHidden: true });
  const { shipping } = useShippingSettings();
  const { showToast } = useToast();

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [cep, setCep] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [addressText, setAddressText] = useState("");
  const [status, setStatus] = useState("paid");
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [customShipping, setCustomShipping] = useState("");
  const [saving, setSaving] = useState(false);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const { fee: suggestedShipping } = calculateShipping(subtotal, shipping);
  const shippingFee =
    customShipping === "" ? suggestedShipping : Number(customShipping.replace(",", ".")) || 0;
  const total = subtotal + shippingFee;

  // Mesmo comportamento do perfil do cliente: ao completar o CEP, o endereço
  // é preenchido sozinho e a região passa a valer para o frete.
  async function handleCepChange(e) {
    const masked = formatCep(e.target.value);
    setCep(masked);

    if (onlyDigits(masked).length !== 8) return;

    setCepLoading(true);
    try {
      const found = await fetchAddressByCep(masked);
      if (!found) {
        showToast("CEP não encontrado. Escreva o endereço manualmente.", { type: "info" });
        return;
      }

      // Deixa o número/complemento para você completar na conversa.
      setAddressText(
        [found.street, found.neighborhood, `${found.city} - ${found.state}`]
          .filter(Boolean)
          .join(", ")
      );
      showToast("Endereço preenchido pelo CEP!", { type: "success" });
    } catch (err) {
      console.error("Erro ao consultar o CEP:", err);
      showToast("Não conseguimos consultar o CEP agora.", { type: "info" });
    } finally {
      setCepLoading(false);
    }
  }

  function handleAddItem() {
    const product = products.find((p) => p.id === selectedId);
    if (!product) {
      showToast("Escolha um produto para adicionar", { type: "info" });
      return;
    }

    const qty = Math.max(1, Number(quantity) || 1);

    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [
        ...prev,
        { id: product.id, name: product.name, price: Number(product.price || 0), quantity: qty },
      ];
    });

    setSelectedId("");
    setQuantity(1);
  }

  function handleRemoveItem(id) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function resetForm() {
    setCustomerName("");
    setCustomerEmail("");
    setCep("");
    setAddressText("");
    setStatus("paid");
    setItems([]);
    setSelectedId("");
    setQuantity(1);
    setCustomShipping("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!customerName.trim()) {
      showToast("Informe o nome do cliente", { type: "info" });
      return;
    }
    if (items.length === 0) {
      showToast("Adicione ao menos um produto ao pedido", { type: "info" });
      return;
    }

    // Confere o estoque antes de lançar, igual ao checkout da loja.
    const insufficient = items.filter((item) => {
      const product = products.find((p) => p.id === item.id);
      return product && hasStockControl(product) && product.stock < item.quantity;
    });
    if (insufficient.length > 0) {
      showToast(
        `Estoque insuficiente para: ${insufficient.map((i) => i.name).join(", ")}`,
        { type: "error", duration: 6000 }
      );
      return;
    }

    setSaving(true);
    try {
      const orderNumber = await createManualOrder({
        items,
        subtotal,
        shippingFee,
        total,
        status,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        // O endereço aqui é texto livre: numa venda por conversa raramente se
        // tem o endereço estruturado campo por campo. Só o CEP fica separado,
        // para aparecer certo na etiqueta e na planilha.
        address: { street: addressText.trim(), zipCode: cep },
      });

      // Mesma baixa de estoque do pedido feito pelo cliente.
      await Promise.all(
        items.map(async (item) => {
          try {
            await decrementProductStock(item.id, item.quantity);
          } catch (err) {
            console.error(`Erro ao dar baixa no estoque de ${item.name}:`, err);
          }
        })
      );

      showToast(`Pedido #${orderNumber} lançado com sucesso!`, { type: "success", duration: 5000 });
      resetForm();
    } catch (err) {
      console.error(err);
      showToast(
        `Erro ao lançar o pedido${err.code ? ` (${err.code})` : ""}. Verifique as regras do Firebase.`,
        { type: "error", duration: 6000 }
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="manual-order" onSubmit={handleSubmit}>
      <p className="manual-order-hint">
        Use isto para registrar vendas fechadas fora do site (WhatsApp, Instagram, presencial).
        O pedido entra nas métricas e dá baixa no estoque, como qualquer outro.
      </p>

      <div className="manual-order-grid">
        <label>
          Nome do cliente *
          <input
            className="input"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Ex: Maria Silva"
          />
        </label>
        <label>
          E-mail ou telefone
          <input
            className="input"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="Opcional"
          />
        </label>
      </div>

      <div className="manual-order-grid">
        <label>
          CEP de entrega
          <input
            className="input"
            value={cep}
            onChange={handleCepChange}
            placeholder="00000-000"
            inputMode="numeric"
            maxLength={9}
          />
          <small>{cepLoading ? "Buscando endereço..." : "Preenche o endereço sozinho"}</small>
        </label>
      </div>

      <label>
        Endereço de entrega
        <textarea
          className="input"
          rows={2}
          value={addressText}
          onChange={(e) => setAddressText(e.target.value)}
          placeholder="Rua, número, bairro, cidade - UF (ou 'Retirada em mãos')"
        />
        <small>Complete o número e o complemento.</small>
      </label>

      <h3 className="manual-order-section">Produtos</h3>

      <div className="manual-order-add">
        <select
          className="input"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="">Escolha um produto...</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {formatPrice(p.price)}
              {hasStockControl(p) ? ` (${p.stock} em estoque)` : ""}
            </option>
          ))}
        </select>
        <input
          className="input manual-order-qty"
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          aria-label="Quantidade"
        />
        <button type="button" className="btn btn-ghost" onClick={handleAddItem}>
          + Adicionar
        </button>
      </div>

      {items.length === 0 ? (
        <p className="admin-status">Nenhum produto adicionado ainda.</p>
      ) : (
        <ul className="manual-order-items">
          {items.map((item) => (
            <li key={item.id}>
              <span>
                {item.name} <strong>x{item.quantity}</strong>
              </span>
              <span className="manual-order-item-total">
                {formatPrice(item.price * item.quantity)}
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  aria-label={`Remover ${item.name}`}
                >
                  ✕
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="manual-order-grid">
        <label>
          Frete (R$)
          <input
            className="input"
            value={customShipping}
            onChange={(e) => setCustomShipping(e.target.value)}
            placeholder={`Sugerido: ${formatPrice(suggestedShipping)}`}
            inputMode="decimal"
          />
          <small>Vazio usa o frete configurado. Digite 0 para frete grátis.</small>
        </label>
        <label>
          Situação do pedido
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="manual-order-summary">
        <div className="manual-order-line">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="manual-order-line">
          <span>Frete</span>
          <span>{shippingFee > 0 ? formatPrice(shippingFee) : "Grátis"}</span>
        </div>
        <div className="manual-order-total">
          <span>Total</span>
          <strong>{formatPrice(total)}</strong>
        </div>
      </div>

      <button className="btn btn-primary" type="submit" disabled={saving}>
        {saving ? "Lançando..." : "Lançar pedido"}
      </button>
    </form>
  );
}
