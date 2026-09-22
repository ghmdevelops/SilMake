import { useState } from "react";
import { Link } from "react-router-dom";
import { useAllOrders } from "../hooks/useAllOrders";
import { updateOrderPipelineStatus, updateOrderTracking } from "../api/orders";
import { useToast } from "../context/ToastContext";
import { getOrderStatus, ORDER_STATUS_LABELS, ORDER_STATUSES, PAYMENT_DEADLINE_DAYS } from "../utils/orderStatus";
import { exportOrdersToCsv } from "../utils/exportCsv";
import { syncStockForStatusChange } from "../utils/stockSync";
import { getExpectedTotal, hasTotalMismatch } from "../utils/orderTotals";
import { paymentMethodLabel } from "../utils/payment";
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

function orderKey(order) {
  return `${order.uid}-${order.id}`;
}

// "Novos" reúne os pedidos que ainda não receberam nenhuma decisão do admin
// (pendentes, incluindo os atrasados). As demais abas são as etapas definidas
// manualmente. Quando o admin muda o status de um pedido, ele "sai" da aba
// Novos e passa a aparecer na aba correspondente ao novo status.
const TABS = [
  { key: "novos", label: "Novos", match: (s) => s === "pending" || s === "overdue" },
  { key: "paid", label: "Pagos", match: (s) => s === "paid" },
  { key: "shipped", label: "Enviados", match: (s) => s === "shipped" },
  { key: "completed", label: "Finalizados", match: (s) => s === "completed" },
  { key: "closed", label: "Encerrados", match: (s) => s === "closed" },
];

// Para qual aba o pedido deve "pular" depois que o admin define um novo status.
const TAB_FOR_STATUS = { pending: "novos", overdue: "novos" };

export default function AdminOrders() {
  const { orders, loading, error } = useAllOrders();
  const { showToast } = useToast();
  const [tab, setTab] = useState("novos");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [trackingDrafts, setTrackingDrafts] = useState({});
  const [savingTrackingId, setSavingTrackingId] = useState(null);
  const [pinnedKey, setPinnedKey] = useState(null);

  const totalPending = orders.filter((o) => getOrderStatus(o) === "pending").length;
  const totalOverdue = orders.filter((o) => getOrderStatus(o) === "overdue").length;
  const totalRevenue = orders
    .filter((o) => ["paid", "shipped", "completed"].includes(getOrderStatus(o)))
    .reduce((sum, o) => sum + Number(o.total || 0), 0);

  const activeTab = TABS.find((t) => t.key === tab) || TABS[0];

  const filtered = orders.filter((o) => {
    if (!activeTab.match(getOrderStatus(o))) return false;

    if (search.trim()) {
      const term = search.trim().toLowerCase();
      const haystack = [o.orderNumber, o.customerName, o.customerEmail]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }

    if (dateFrom) {
      const from = new Date(`${dateFrom}T00:00:00`).getTime();
      if ((o.createdAt || 0) < from) return false;
    }

    if (dateTo) {
      const to = new Date(`${dateTo}T23:59:59`).getTime();
      if ((o.createdAt || 0) > to) return false;
    }

    return true;
  });

  const pinnedOrder = orders.find((o) => orderKey(o) === pinnedKey) || null;

  async function handleStatusChange(order, status) {
    const previousStatus = getOrderStatus(order);
    setUpdatingId(order.id);
    try {
      await updateOrderPipelineStatus(order.uid, order.id, status);

      // Confirmar pagamento dá baixa; encerrar devolve as unidades.
      const { failed } = await syncStockForStatusChange(order, previousStatus, status);

      if (failed.length > 0) {
        // Acontece quando dois clientes pediram a última unidade antes de
        // você confirmar qualquer um dos dois. O pedido mudou de status
        // mesmo assim — quem decide o que fazer é você.
        showToast(
          `Status alterado, mas faltou estoque para: ${failed.join(", ")}. Confira antes de enviar.`,
          { type: "error", duration: 8000 }
        );
      } else {
        showToast(
          status === "closed"
            ? "Pedido encerrado e estoque devolvido"
            : `Pedido atualizado para "${ORDER_STATUS_LABELS[status]}"`,
          { type: "success" }
        );
      }
      // Leva o admin junto para a aba onde o pedido foi parar.
      setTab(TAB_FOR_STATUS[status] || status);
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
    const key = orderKey(order);
    return trackingDrafts[key]?.code ?? order.trackingCode ?? "";
  }

  function getTrackingUrlValue(order) {
    const key = orderKey(order);
    return trackingDrafts[key]?.url ?? order.trackingUrl ?? "";
  }

  function handleTrackingChange(order, field, value) {
    const key = orderKey(order);
    setTrackingDrafts((prev) => ({
      ...prev,
      [key]: {
        code: prev[key]?.code ?? order.trackingCode ?? "",
        url: prev[key]?.url ?? order.trackingUrl ?? "",
        [field]: value,
      },
    }));
  }

  async function handleSaveTracking(order) {
    const key = orderKey(order);
    const code = getTrackingValue(order).trim();
    const url = getTrackingUrlValue(order).trim();
    setSavingTrackingId(key);
    try {
      await updateOrderTracking(order.uid, order.id, code, url);
      showToast(
        code || url ? "Rastreio salvo! Já aparece para o cliente." : "Rastreio removido",
        { type: "success" }
      );
    } catch (err) {
      console.error(err);
      showToast(
        `Erro ao salvar o rastreio${err.code ? ` (${err.code})` : ""}. Verifique as regras do Firebase.`,
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

  function renderOrderDetails(order, { compact = false } = {}) {
    const key = orderKey(order);
    const status = getOrderStatus(order);

    return (
      <>
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
            ⚠️ Pagamento pendente há mais de {PAYMENT_DEADLINE_DAYS} dias. Você pode encerrar este
            pedido se o cliente não respondeu.
          </p>
        )}

        <div className="order-row-tracking">
          <label>
            Código de rastreio
            <input
              className="input"
              value={getTrackingValue(order)}
              onChange={(e) => handleTrackingChange(order, "code", e.target.value)}
              placeholder="Ex: BR123456789BR"
            />
          </label>

          <label>
            Link de rastreio (opcional)
            <div className="order-row-tracking-input">
              <input
                className="input"
                value={getTrackingUrlValue(order)}
                onChange={(e) => handleTrackingChange(order, "url", e.target.value)}
                placeholder="https://rastreamento.correios.com.br/..."
              />
              <button
                className="btn btn-ghost"
                disabled={savingTrackingId === key}
                onClick={() => handleSaveTracking(order)}
              >
                {savingTrackingId === key ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </label>
        </div>

        {order.manual && (
          <p className="order-row-manual-note">
            🧾 Venda lançada manualmente (fechada fora do site)
          </p>
        )}

        {hasTotalMismatch(order) && (
          <p className="order-row-total-alert">
            ⚠️ Valor divergente: os itens somam {formatPrice(getExpectedTotal(order))}, mas o
            pedido foi registrado com {formatPrice(order.total)}. Confira antes de enviar.
          </p>
        )}

        {/* Confirmado pelo Mercado Pago, não por você. Saber o meio ajuda no
            estorno e na conciliação; a data é a que vale para o prazo de
            envio, não a da criação do pedido. */}
        {order.paidAt && (
          <p className="order-row-payment">
            💳 Pago com <strong>{paymentMethodLabel(order.paymentMethod)}</strong> em{" "}
            {formatDate(order.paidAt)}
            {order.paymentId ? ` · id ${order.paymentId}` : ""}
          </p>
        )}

        {order.paymentAlert && (
          <p className="order-row-total-alert">
            ⚠️ Pagamento com valor divergente: {order.paymentAlert}. Confira no Mercado Pago
            antes de enviar.
          </p>
        )}

        {order.stockAlert && (
          <p className="order-row-total-alert">
            ⚠️ Estoque insuficiente na confirmação: {order.stockAlert}. Confira o que você
            tem antes de prometer o envio.
          </p>
        )}

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

            {!compact && (
              <button className="btn btn-ghost" onClick={() => setPinnedKey(null)}>
                Fechar
              </button>
            )}
          </div>
        </div>
      </>
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

      <div className="orders-status-tabs">
        {TABS.map((t) => {
          const count = orders.filter((o) => t.match(getOrderStatus(o))).length;
          return (
            <button
              key={t.key}
              className={`orders-status-tab ${tab === t.key ? "active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              <span className="orders-status-tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="orders-search-bar">
        <input
          type="text"
          className="input orders-search-input"
          placeholder="Buscar por cliente, e-mail ou número do pedido..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="orders-date-range">
          <label>
            De
            <input
              type="date"
              className="input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </label>
          <label>
            Até
            <input
              type="date"
              className="input"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </label>
          {(search || dateFrom || dateTo) && (
            <button
              className="btn btn-ghost"
              onClick={() => {
                setSearch("");
                setDateFrom("");
                setDateTo("");
              }}
            >
              Limpar filtros
            </button>
          )}

          <button
            className="btn btn-ghost"
            onClick={() => exportOrdersToCsv(filtered)}
            disabled={filtered.length === 0}
            title="Baixa uma planilha com os pedidos que estão sendo exibidos"
          >
            ⬇ CSV
          </button>
        </div>
      </div>

      {loading && <p className="admin-status">Carregando pedidos...</p>}
      {!loading && filtered.length === 0 && (
        <p className="admin-status">Nenhum pedido encontrado com esses filtros.</p>
      )}

      <div className={`admin-orders-layout ${pinnedOrder ? "with-panel" : ""}`}>
        <div className="orders-table">
          {filtered.map((order) => {
            const key = orderKey(order);
            const status = getOrderStatus(order);
            const isPinned = pinnedKey === key;
            return (
              <div className={`order-row status-${status} ${isPinned ? "is-pinned" : ""}`} key={key}>
                <div className="order-row-header">
                  <div>
                    <strong>
                      {order.orderNumber && <span className="order-row-number">#{order.orderNumber}</span>}
                      {order.customerName || order.customerEmail || "Cliente"}
                    </strong>
                    {order.customerEmail && <span className="order-row-email">{order.customerEmail}</span>}
                  </div>
                  <div className="order-row-header-right">
                    <span className="order-row-date">{formatDate(order.createdAt)}</span>
                    <button
                      className={`btn btn-ghost pin-btn ${isPinned ? "active" : ""}`}
                      onClick={() => setPinnedKey(isPinned ? null : key)}
                      title="Acompanhar este pedido num painel ao lado"
                    >
                      {isPinned ? "📌 Acompanhando" : "📌 Acompanhar"}
                    </button>
                    <Link
                      to={`/admin/pedido/${order.uid}/${order.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost"
                      title="Abrir este pedido numa aba nova"
                    >
                      Abrir em aba ↗
                    </Link>
                  </div>
                </div>

                {renderOrderDetails(order, { compact: true })}
              </div>
            );
          })}
        </div>

        {pinnedOrder && (
          <aside className="order-panel">
            <div className="order-panel-header">
              <div>
                <strong>
                  {pinnedOrder.orderNumber && <span className="order-row-number">#{pinnedOrder.orderNumber}</span>}
                  {pinnedOrder.customerName || pinnedOrder.customerEmail || "Cliente"}
                </strong>
                {pinnedOrder.customerEmail && (
                  <span className="order-row-email">{pinnedOrder.customerEmail}</span>
                )}
              </div>
              <button className="order-panel-close" onClick={() => setPinnedKey(null)} aria-label="Fechar painel">
                ✕
              </button>
            </div>
            <span className="order-row-date">{formatDate(pinnedOrder.createdAt)}</span>
            {renderOrderDetails(pinnedOrder)}
          </aside>
        )}
      </div>
    </div>
  );
}
