import { useEffect, useState } from "react";
import { Navigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useCart } from "../context/CartContext";
import { useOrders } from "../hooks/useOrders";
import { useSeo } from "../hooks/useSeo";
import { startPayment, takePendingPurchase } from "../api/payment";
import { trackEvent } from "../utils/analytics";
import { paymentMethodLabel } from "../utils/payment";
import { getOrderStatus, ORDER_STATUS_LABELS } from "../utils/orderStatus";
import "../components/ProductSkeleton.css";
import "./MyOrders.css";

const FILTERS = [
  { key: "todos", label: "Todos" },
  { key: "pending", label: "Pendente" },
  { key: "overdue", label: "Atrasado" },
  { key: "paid", label: "Pago" },
  { key: "shipped", label: "Enviado" },
  { key: "completed", label: "Finalizado" },
  { key: "closed", label: "Encerrado" },
];

function formatPrice(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatAddress(address) {
  if (!address || !address.street) return "";
  const { street, number, complement, neighborhood, city, state, zipCode } = address;
  const line1 = [street, number].filter(Boolean).join(", ");
  const line2 = [neighborhood, city, state].filter(Boolean).join(" - ");
  return [line1, complement, line2, zipCode].filter(Boolean).join(" • ");
}

export default function MyOrders() {
  useSeo({ title: "Meus Pedidos", description: "Acompanhe o histórico e o status dos seus pedidos na SilBeauty." });

  const { currentUser, loading: authLoading } = useAuth();
  const { orders, loading: ordersLoading } = useOrders(currentUser?.uid);
  const [filter, setFilter] = useState("todos");
  const [search, setSearch] = useState("");

  // Retorno do checkout do Mercado Pago. É só um aviso: quem confirma o
  // pagamento é o webhook, não esta volta — o cliente pode fechar a aba antes
  // de voltar, e este endereço pode ser digitado por qualquer pessoa.
  const [searchParams] = useSearchParams();
  const pagamento = searchParams.get("pagamento");

  const [payingId, setPayingId] = useState("");
  const { showToast } = useToast();
  const { clearCart } = useCart();

  // Volta do checkout com pagamento aprovado. Dois efeitos:
  //
  // 1. O evento de compra do GA4 é disparado AQUI, não no carrinho — lá ele
  //    contaria como venda todo pedido abandonado no meio do pagamento.
  // 2. O carrinho é limpo só agora. Quem desiste no checkout volta e
  //    encontra tudo no lugar, em vez de precisar montar de novo.
  //
  // takePendingPurchase apaga o registro ao ler, então recarregar a página
  // não conta a mesma venda duas vezes.
  useEffect(() => {
    if (pagamento !== "sucesso") return;
    const pendente = takePendingPurchase();
    if (!pendente) return;
    if (pendente.purchase) trackEvent("purchase", pendente.purchase);
    clearCart();
  }, [pagamento, clearCart]);

  async function handlePayAgain(orderId) {
    setPayingId(orderId);
    const resultado = await startPayment({ uid: currentUser.uid, orderId });

    if (resultado.checkoutUrl) {
      // assign em vez de atribuir em location.href: mesma navegação, e não
      // parece mutação de variável externa para o compilador do React.
      window.location.assign(resultado.checkoutUrl);
      return;
    }

    setPayingId("");
    showToast(
      resultado.error === "order_not_payable"
        ? "Este pedido já foi pago."
        : "Não foi possível abrir o pagamento agora. Tente novamente em instantes.",
      { type: resultado.error === "order_not_payable" ? "info" : "error" }
    );
  }

  if (!authLoading && !currentUser) {
    return <Navigate to="/login" state={{ from: "/meus-pedidos" }} replace />;
  }

  if (!currentUser) return null;

  const filtered = orders.filter((o) => {
    if (filter !== "todos" && getOrderStatus(o) !== filter) return false;
    if (search.trim() && !(o.orderNumber || "").includes(search.trim())) return false;
    return true;
  });

  return (
    <div className="my-orders-page">
      <div className="my-orders-header">
        <h1>Meus pedidos</h1>
        <Link to="/perfil" className="btn btn-ghost">
          ← Voltar ao perfil
        </Link>
      </div>

      {pagamento && (
        <div className={`payment-return payment-${pagamento}`} role="status">
          {pagamento === "sucesso" && (
            <>
              <strong>Pagamento recebido!</strong> A confirmação pode levar alguns
              instantes para aparecer no pedido abaixo.
            </>
          )}
          {pagamento === "pendente" && (
            <>
              <strong>Pagamento em análise.</strong> Se você escolheu boleto ou Pix,
              o pedido é confirmado assim que a compensação acontecer.
            </>
          )}
          {pagamento === "falhou" && (
            <>
              <strong>O pagamento não foi concluído.</strong> Seu pedido está salvo —
              entre em contato que a gente resolve junto.
            </>
          )}
        </div>
      )}

      {orders.length > 0 && (
        <div className="my-orders-filters-row">
          <label className="my-orders-filter">
            Buscar pelo número do pedido
            <input
              type="text"
              className="input"
              placeholder="Ex: 202609081234"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          <label className="my-orders-filter">
            Filtrar por status
            <select className="input" value={filter} onChange={(e) => setFilter(e.target.value)}>
              {FILTERS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {ordersLoading && (
        <div className="orders-skeleton">
          {Array.from({ length: 3 }).map((_, i) => (
            <div className="order-card-skeleton" key={i}>
              <div className="skeleton-line shimmer" style={{ width: "45%" }} />
              <div className="skeleton-line shimmer" style={{ width: "70%" }} />
              <div className="skeleton-line shimmer" style={{ width: "30%" }} />
            </div>
          ))}
        </div>
      )}

      {!ordersLoading && orders.length === 0 && (
        <div className="profile-empty">
          <p>Você ainda não fez nenhum pedido.</p>
          <Link to="/" className="btn btn-primary">
            Ver produtos
          </Link>
        </div>
      )}

      {!ordersLoading && orders.length > 0 && filtered.length === 0 && (
        <p className="profile-status">Nenhum pedido encontrado com esse filtro.</p>
      )}

      <div className="orders-list">
        {filtered.map((order) => {
          const status = getOrderStatus(order);
          return (
            <div className="order-card" key={order.id}>
              <div className="order-card-header">
                <div>
                  <span className="order-customer">
                    {order.orderNumber && <span className="order-number">#{order.orderNumber}</span>}
                    {order.customerName || currentUser.displayName || currentUser.email}
                  </span>
                  <span className="order-date">{formatDate(order.createdAt)}</span>
                </div>
                <span className={`order-status status-${status}`}>{ORDER_STATUS_LABELS[status]}</span>
              </div>

              {status === "overdue" && (
                <p className="order-overdue-notice">
                  ⚠️ Ainda não identificamos o pagamento deste pedido. Fale com a gente pelo WhatsApp.
                </p>
              )}
              {status === "closed" && (
                <p className="order-closed-notice">Este pedido foi encerrado por falta de pagamento.</p>
              )}

              <ul className="order-items">
                {order.items?.map((item, i) => (
                  <li key={i}>
                    {item.name} (x{item.quantity}) — {formatPrice(item.price * item.quantity)}
                  </li>
                ))}
              </ul>

              {formatAddress(order.address) && (
                <p className="order-address">📍 {formatAddress(order.address)}</p>
              )}

              {(order.trackingCode || order.trackingUrl) && (
                <div className="order-tracking">
                  <div className="order-tracking-info">
                    <span>📦 Código de rastreio</span>
                    <strong>{order.trackingCode || "—"}</strong>
                  </div>
                  {order.trackingUrl && (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost order-tracking-link"
                    >
                      Rastrear ↗
                    </a>
                  )}
                </div>
              )}

              {order.shippingFee !== undefined && (
                <div className="order-shipping-line">
                  <span>Frete{order.shippingService ? ` · ${order.shippingService}` : ""}</span>
                  <span>{order.shippingFee > 0 ? formatPrice(order.shippingFee) : "Grátis"}</span>
                </div>
              )}

              {order.paidAt && (
                <div className="order-payment-line">
                  <span>Pago com {paymentMethodLabel(order.paymentMethod)}</span>
                  <span>{formatDate(order.paidAt)}</span>
                </div>
              )}

              <div className="order-total">
                <span>Total</span>
                <strong>{formatPrice(order.total)}</strong>
              </div>

              {/* Retomar o pagamento de um pedido pendente. É o caso mais
                  comum do checkout: a pessoa desiste no meio, ou escolhe Pix
                  e paga depois. Sem este botão ela teria que montar o
                  carrinho de novo — e provavelmente não voltaria. */}
              {getOrderStatus(order) === "pending" && !order.manual && (
                <button
                  type="button"
                  className="btn btn-primary order-pay-btn"
                  onClick={() => handlePayAgain(order.id)}
                  disabled={payingId === order.id}
                >
                  {payingId === order.id ? "Abrindo pagamento..." : "Pagar agora"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
