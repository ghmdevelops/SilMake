import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useOrder } from "../hooks/useOrder";
import { updateOrderPipelineStatus, updateOrderTracking } from "../api/orders";
import { useToast } from "../context/ToastContext";
import { useSeo } from "../hooks/useSeo";
import { getOrderStatus, ORDER_STATUS_LABELS, ORDER_STATUSES, PAYMENT_DEADLINE_DAYS } from "../utils/orderStatus";
import { syncStockForStatusChange } from "../utils/stockSync";
import { getExpectedTotal, hasTotalMismatch } from "../utils/orderTotals";
import "./AdminOrders.css";
import "./AdminOrderDetail.css";

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

export default function AdminOrderDetail() {
  const { uid, orderId } = useParams();
  const { order, loading, error } = useOrder(uid, orderId);
  const { showToast } = useToast();

  useSeo({
    title: order?.orderNumber ? `Pedido #${order.orderNumber}` : "Pedido",
    description: "Detalhes do pedido no painel administrativo da SilBeauty.",
  });

  const [tracking, setTracking] = useState(null);
  const [trackingUrl, setTrackingUrl] = useState(null);
  const [savingTracking, setSavingTracking] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  if (loading) {
    return (
      <div className="order-detail-page">
        <p className="admin-status">Carregando pedido...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-detail-page">
        <p className="admin-orders-error">
          Não foi possível carregar este pedido. Ele pode ter sido removido, ou as regras do
          Firebase não permitem a leitura.
        </p>
        <Link to="/admin" className="btn btn-ghost">
          ← Voltar para o painel
        </Link>
      </div>
    );
  }

  const status = getOrderStatus(order);
  const trackingValue = tracking ?? order.trackingCode ?? "";
  const trackingUrlValue = trackingUrl ?? order.trackingUrl ?? "";

  async function handleSaveTracking() {
    setSavingTracking(true);
    try {
      await updateOrderTracking(order.uid, order.id, trackingValue.trim(), trackingUrlValue.trim());
      showToast("Rastreio salvo! Já aparece para o cliente.", { type: "success" });
    } catch (err) {
      console.error(err);
      showToast(`Erro ao salvar${err.code ? ` (${err.code})` : ""}.`, { type: "error", duration: 6000 });
    } finally {
      setSavingTracking(false);
    }
  }

  async function handleStatusChange(e) {
    const newStatus = e.target.value;
    const previousStatus = getOrderStatus(order);
    setUpdatingStatus(true);
    try {
      await updateOrderPipelineStatus(order.uid, order.id, newStatus);

      // Confirmar pagamento dá baixa; encerrar devolve as unidades.
      const { failed } = await syncStockForStatusChange(order, previousStatus, newStatus);

      if (failed.length > 0) {
        showToast(
          `Status alterado, mas faltou estoque para: ${failed.join(", ")}. Confira antes de enviar.`,
          { type: "error", duration: 8000 }
        );
      } else {
        showToast(
          newStatus === "closed"
            ? "Pedido encerrado e estoque devolvido"
            : `Pedido atualizado para "${ORDER_STATUS_LABELS[newStatus]}"`,
          { type: "success" }
        );
      }
    } catch (err) {
      console.error(err);
      showToast(`Erro ao atualizar${err.code ? ` (${err.code})` : ""}.`, { type: "error", duration: 6000 });
    } finally {
      setUpdatingStatus(false);
    }
  }

  return (
    <div className="order-detail-page">
      <div className="order-detail-topbar">
        <Link to="/admin" className="order-detail-back">
          ← Voltar para o painel
        </Link>
        <button
          className="btn btn-ghost"
          onClick={() => window.print()}
          title="Imprime uma lista de separação com itens e endereço"
        >
          🖨 Imprimir para separar
        </button>
      </div>

      <div className={`order-detail-card status-${status}`}>
        {/* Aparece somente na impressão */}
        <div className="print-only">
          <strong>SilBeauty — Lista de separação</strong>
          <div>
            Pedido {order.orderNumber ? `#${order.orderNumber}` : ""} ·{" "}
            {formatDate(order.createdAt)}
          </div>
        </div>

        <div className="order-detail-header">
          <div>
            <h1>
              {order.orderNumber && <span className="order-row-number">#{order.orderNumber}</span>}
              {order.customerName || order.customerEmail || "Cliente"}
            </h1>
            {order.customerEmail && <p className="order-row-email">{order.customerEmail}</p>}
          </div>
          <span className={`status-badge status-${status}`}>{ORDER_STATUS_LABELS[status]}</span>
        </div>

        <p className="order-row-date">Feito em {formatDate(order.createdAt)}</p>

        {status === "overdue" && (
          <p className="order-row-overdue-notice">
            ⚠️ Pagamento pendente há mais de {PAYMENT_DEADLINE_DAYS} dias.
          </p>
        )}

        <h3 className="order-detail-section-title">Itens do pedido</h3>
        <ul className="order-row-items">
          {order.items?.map((item, i) => (
            <li key={i}>
              {item.name} (x{item.quantity}) — {formatPrice(item.price * item.quantity)}
            </li>
          ))}
        </ul>

        <h3 className="order-detail-section-title">Endereço de entrega</h3>
        <p className="order-row-address">📍 {formatAddress(order.address)}</p>

        {/* Controles de gestão — ocultados na impressão */}
        <div className="order-detail-controls">
          <h3 className="order-detail-section-title">Código de rastreio</h3>
          <input
            className="input order-detail-tracking-code"
            value={trackingValue}
            onChange={(e) => setTracking(e.target.value)}
            placeholder="Ex: BR123456789BR"
          />

          <h3 className="order-detail-section-title">Link de rastreio (opcional)</h3>
          <div className="order-row-tracking-input">
            <input
              className="input"
              value={trackingUrlValue}
              onChange={(e) => setTrackingUrl(e.target.value)}
              placeholder="https://rastreamento.correios.com.br/..."
            />
            <button
              className="btn btn-ghost"
              disabled={savingTracking}
              onClick={handleSaveTracking}
            >
              {savingTracking ? "Salvando..." : "Salvar"}
            </button>
          </div>

          <h3 className="order-detail-section-title">Status</h3>
          <select
            className="input order-row-status-select"
            value={order.status || (order.paid ? "paid" : order.closed ? "closed" : "pending")}
            disabled={updatingStatus}
            onChange={handleStatusChange}
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        {order.shippingFee !== undefined && (
          <div className="order-detail-shipping">
            <span>
              Frete
              {order.shippingService ? ` · ${order.shippingService}` : ""}
              {order.shippingDays ? ` (${order.shippingDays} dia(s))` : ""}
            </span>
            <span>{order.shippingFee > 0 ? formatPrice(order.shippingFee) : "Grátis"}</span>
          </div>
        )}

        {hasTotalMismatch(order) && (
          <p className="order-row-total-alert">
            ⚠️ Valor divergente: os itens somam {formatPrice(getExpectedTotal(order))}, mas o
            pedido foi registrado com {formatPrice(order.total)}. Confira antes de enviar.
          </p>
        )}

        <div className="order-detail-total">
          <span>Total</span>
          <strong>{formatPrice(order.total)}</strong>
        </div>
      </div>
    </div>
  );
}
