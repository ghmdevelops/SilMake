import { useState } from "react";
import { useAllOrders } from "../hooks/useAllOrders";
import { updateOrderPipelineStatus, updateOrderTracking } from "../api/orders";
import { useToast } from "../context/ToastContext";
import { getOrderStatus, ORDER_STATUS_LABELS, ORDER_STATUSES, PAYMENT_DEADLINE_DAYS } from "../utils/orderStatus";
import "./AdminOrders.css";

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
  if (!address || !address.street) return "Endereço não informado";
  const { street, number, complement, neighborhood, city, state, zipCode } = address;
  const line1 = [street, number].filter(Boolean).join(", ");
  const line2 = [neighborhood, city, state].filter(Boolean).join(" - ");
  return [line1, complement, line2, zipCode].filter(Boolean).join(" • ");
}

export default function AdminOrders() {
  const { orders, loading, error } = useAllOrders();
  const { showToast } = useToast();
  const [filter, setFilter] = useState("todos");
  const [updatingId, setUpdatingId] = useState(null);
  const [trackingDrafts, setTrackingDrafts] = useState({});
  const [savingTrackingId, setSavingTrackingId] = useState(null);

  const totalPending = orders.filter((o) => getOrderStatus(o) === "pending").length;
  const totalOverdue = orders.filter((o) => getOrderStatus(o) === "overdue").length;
  const totalRevenue = orders
    .filter((o) => ["paid", "shipped", "completed"].includes(getOrderStatus(o)))
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  const filtered = orders.filter((o) => {
    const status = getOrderStatus(o);
    if (filter === "todos") return true;
    return status === filter;
  });

  async function handleStatusChange(order, status) {
    setUpdatingId(order.id);
    try {
      await updateOrderPipelineStatus(order.uid, order.id, status);
      showToast(`Pedido atualizado para "${ORDER_STATUS_LABELS[status]}"`, { type: "success" });
    } catch (err) {
      console.error(err);
      showToast(
        `Erro ao atualizar o pedido${err.code ? ` (${err.code})` : ""}. Verifique as regras do Firebase.`,
        { type: "error", duration: 6000 }
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function getTrackingValue(order) {
    const key = `${order.uid}-${order.id}`;
    return trackingDrafts[key] ?? order.trackingCode ?? "";
  }

  function handleTrackingChange(order, value) {
    const key = `${order.uid}-${order.id}`;
    setTrackingDrafts((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSaveTracking(order) {
    const key = `${order.uid}-${order.id}`;
    const code = (trackingDrafts[key] ?? "").trim();
    setSavingTrackingId(key);
    try {
      await updateOrderTracking(order.uid, order.id, code);
      showToast(
        code ? "Código de rastreio salvo! Já aparece para o cliente." : "Código de rastreio removido",
        { type: "success" }
      );
    } catch (err) {
      console.error(err);
      showToast(
        `Erro ao salvar o código de rastreio${err.code ? ` (${err.code})` : ""}. Verifique as regras do Firebase.`,
        { type: "error", duration: 6000 }
      );
    } finally {
      setSavingTrackingId(null);
    }
  }

  if (error) {
    return (
      <div className="admin-orders-error">
        <p>
          Não foi possível carregar os pedidos. Confirme se as regras do Firebase permitem que a
          conta admin leia o nó <code>orders</code> (veja o README).
        </p>
      </div>
    );
  }

  return (
    <div className="admin-orders">
      <div className="admin-orders-summary">
        <div className="summary-card">
          <span>Pedidos pendentes</span>
          <strong>{totalPending}</strong>
        </div>
        <div className="summary-card">
          <span>Atrasados (+{PAYMENT_DEADLINE_DAYS} dias)</span>
          <strong>{totalOverdue}</strong>
        </div>
        <div className="summary-card">
          <span>Total recebido</span>
          <strong>{formatPrice(totalRevenue)}</strong>
        </div>
        <div className="summary-card">
          <span>Total de pedidos</span>
          <strong>{orders.length}</strong>
        </div>
      </div>

      <div className="admin-orders-filters">
        {[
          { key: "todos", label: "Todos" },
          { key: "pending", label: "Pendentes" },
          { key: "overdue", label: "Atrasados" },
          { key: "paid", label: "Pagos" },
          { key: "shipped", label: "Enviados" },
          { key: "completed", label: "Finalizados" },
          { key: "closed", label: "Encerrados" },
        ].map((opt) => (
          <button
            key={opt.key}
            className={`chip ${filter === opt.key ? "active" : ""}`}
            onClick={() => setFilter(opt.key)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading && <p className="admin-status">Carregando pedidos...</p>}
      {!loading && filtered.length === 0 && (
        <p className="admin-status">Nenhum pedido encontrado.</p>
      )}

      <div className="orders-table">
        {filtered.map((order) => {
          const trackingKey = `${order.uid}-${order.id}`;
          const status = getOrderStatus(order);
          return (
            <div className={`order-row status-${status}`} key={trackingKey}>
              <div className="order-row-header">
                <div>
                  <strong>
                    {order.orderNumber && <span className="order-row-number">#{order.orderNumber}</span>}
                    {order.customerName || order.customerEmail || "Cliente"}
                  </strong>
                  {order.customerEmail && <span className="order-row-email">{order.customerEmail}</span>}
                </div>
                <span className="order-row-date">{formatDate(order.createdAt)}</span>
              </div>

              <ul className="order-row-items">
                {order.items?.map((item, i) => (
                  <li key={i}>
                    {item.name} (x{item.quantity}) — {formatPrice(item.price * item.quantity)}
                  </li>
                ))}
              </ul>

              <p className="order-row-address">📍 {formatAddress(order.address)}</p>

              {status === "overdue" && (
                <p className="order-row-overdue-notice">
                  ⚠️ Pagamento pendente há mais de {PAYMENT_DEADLINE_DAYS} dias. Você pode encerrar
                  este pedido se o cliente não respondeu.
                </p>
              )}

              <div className="order-row-tracking">
                <label>
                  Código de rastreio
                  <div className="order-row-tracking-input">
                    <input
                      className="input"
                      value={getTrackingValue(order)}
                      onChange={(e) => handleTrackingChange(order, e.target.value)}
                      placeholder="Ex: BR123456789BR"
                    />
                    <button
                      className="btn btn-ghost"
                      disabled={savingTrackingId === trackingKey}
                      onClick={() => handleSaveTracking(order)}
                    >
                      {savingTrackingId === trackingKey ? "Salvando..." : "Salvar"}
                    </button>
                  </div>
                </label>
              </div>

              <div className="order-row-footer">
                <span className="order-row-total">
                  Total: <strong>{formatPrice(order.total)}</strong>
                </span>

                <div className="order-row-actions">
                  <span className={`status-badge status-${status}`}>{ORDER_STATUS_LABELS[status]}</span>

                  <select
                    className="input order-row-status-select"
                    value={order.status || (order.paid ? "paid" : order.closed ? "closed" : "pending")}
                    disabled={updatingId === order.id}
                    onChange={(e) => handleStatusChange(order, e.target.value)}
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {ORDER_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
