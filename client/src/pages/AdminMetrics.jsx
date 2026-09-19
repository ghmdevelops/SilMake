import { useMemo, useState } from "react";
import { useAllOrders } from "../hooks/useAllOrders";
import { useProducts } from "../hooks/useProducts";
import { useStats } from "../hooks/useStats";
import { useSeo } from "../hooks/useSeo";
import { getOrderStatus, ORDER_STATUS_LABELS } from "../utils/orderStatus";
import { isOutOfStock, isLowStock, hasStockControl } from "../utils/stock";
import { exportOrdersToCsv } from "../utils/exportCsv";
import "./AdminMetrics.css";

// Pedidos nesses status contam como venda concretizada.
const SOLD_STATUSES = ["paid", "shipped", "completed"];

const PERIODS = [
  { key: "7", label: "Últimos 7 dias" },
  { key: "30", label: "Últimos 30 dias" },
  { key: "90", label: "Últimos 90 dias" },
  { key: "all", label: "Todo o período" },
];

function formatPrice(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function AdminMetrics() {
  useSeo({ title: "Métricas (Admin)", description: "Resumo de vendas da loja." });

  const { orders, loading, error } = useAllOrders();
  // Inclui os pausados: o estoque deles continua sendo seu, e você precisa
  // saber se está acabando mesmo com o produto fora da vitrine.
  const { products } = useProducts({ includeHidden: true });
  const { stats } = useStats();
  const [period, setPeriod] = useState("30");

  // Momento de referência capturado uma única vez, para que o recorte do
  // período e o gráfico usem exatamente a mesma base de tempo.
  const [referenceTime] = useState(() => Date.now());

  const periodOrders = useMemo(() => {
    if (period === "all") return orders;
    const days = Number(period);
    const cutoff = referenceTime - days * 24 * 60 * 60 * 1000;
    return orders.filter((o) => (o.createdAt || 0) >= cutoff);
  }, [orders, period, referenceTime]);

  // Memoizado porque vários cálculos abaixo dependem dele. Sem isto, a lista
  // era recriada em cada render e os useMemo seguintes recalculavam sempre —
  // a memoização deles não servia para nada.
  const soldOrders = useMemo(
    () => periodOrders.filter((o) => SOLD_STATUSES.includes(getOrderStatus(o))),
    [periodOrders]
  );

  const revenue = soldOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const averageTicket = soldOrders.length > 0 ? revenue / soldOrders.length : 0;
  const itemsSold = soldOrders.reduce(
    (sum, o) => sum + (o.items || []).reduce((s, i) => s + Number(i.quantity || 0), 0),
    0
  );

  // Contagem por status no período
  const statusCounts = useMemo(() => {
    const counts = {};
    periodOrders.forEach((o) => {
      const status = getOrderStatus(o);
      counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [periodOrders]);

  // Produtos mais vendidos no período (só pedidos concretizados).
  // Agrupa pelo id do produto, não pelo nome: se você renomear um produto,
  // as vendas antigas continuam somando no mesmo item em vez de virar duas
  // linhas separadas.
  const bestSellers = useMemo(() => {
    const map = new Map();
    soldOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const key = item.id || item.name;
        const current = map.get(key) || { name: item.name, quantity: 0, revenue: 0 };
        current.name = item.name; // mantém o nome mais recente
        current.quantity += Number(item.quantity || 0);
        current.revenue += Number(item.price || 0) * Number(item.quantity || 0);
        map.set(key, current);
      });
    });
    return [...map.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [soldOrders]);

  // Faturamento por dia, para o gráfico de barras.
  const salesByDay = useMemo(() => {
    const days = period === "all" ? 30 : Number(period);
    const buckets = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(referenceTime);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);
      buckets.push({ date, revenue: 0, orders: 0 });
    }

    const firstDay = buckets[0]?.date.getTime() || 0;

    soldOrders.forEach((order) => {
      const created = order.createdAt || 0;
      if (created < firstDay) return;
      const index = Math.floor((created - firstDay) / (24 * 60 * 60 * 1000));
      if (index < 0 || index >= buckets.length) return;
      buckets[index].revenue += Number(order.total || 0);
      buckets[index].orders += 1;
    });

    return buckets;
  }, [soldOrders, period, referenceTime]);

  const maxDayRevenue = Math.max(...salesByDay.map((d) => d.revenue), 0);

  // Funil por produto: quem foi visto, quem foi para o carrinho e quem
  // realmente vendeu. A taxa expõe o produto que atrai mas não converte —
  // normalmente é preço, foto ou descrição.
  const funnel = useMemo(() => {
    // IMPORTANTE: os contadores de visita são acumulados desde sempre (não
    // têm data). Por isso as vendas aqui também são de todo o período — se
    // usássemos as vendas do filtro de 7 dias contra visitas de meses, a taxa
    // sairia artificialmente baixa e levaria você a conclusões erradas.
    const soldById = new Map();
    orders
      .filter((order) => SOLD_STATUSES.includes(getOrderStatus(order)))
      .forEach((order) => {
        (order.items || []).forEach((item) => {
          const key = item.id || item.name;
          soldById.set(key, (soldById.get(key) || 0) + Number(item.quantity || 0));
        });
      });

    return products
      .map((product) => {
        const views = Number(stats.productViews?.[product.id]) || 0;
        const adds = Number(stats.addToCart?.[product.id]) || 0;
        const sold = soldById.get(product.id) || 0;
        return {
          id: product.id,
          name: product.name,
          views,
          adds,
          sold,
          rate: views > 0 ? (sold / views) * 100 : 0,
        };
      })
      .filter((row) => row.views > 0 || row.adds > 0)
      .sort((a, b) => b.views - a.views)
      .slice(0, 6);
  }, [products, orders, stats.productViews, stats.addToCart]);

  const emptySearches = useMemo(
    () =>
      Object.entries(stats.emptySearches || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6),
    [stats.emptySearches]
  );

  // Alertas de estoque (independente do período)
  const outOfStockProducts = products.filter(isOutOfStock);
  const lowStockProducts = products.filter(isLowStock);

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
    <div className="admin-metrics">
      <div className="metrics-toolbar">
        <label className="metrics-period">
          Período
          <select className="input" value={period} onChange={(e) => setPeriod(e.target.value)}>
            {PERIODS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <button
          className="btn btn-ghost"
          onClick={() => exportOrdersToCsv(periodOrders)}
          disabled={periodOrders.length === 0}
        >
          ⬇ Exportar pedidos (CSV)
        </button>
      </div>

      {loading && <p className="admin-status">Carregando métricas...</p>}

      <div className="metrics-cards">
        <div className="metric-card highlight">
          <span>Faturamento</span>
          <strong>{formatPrice(revenue)}</strong>
          <small>{soldOrders.length} pedido(s) pago(s) ou enviado(s)</small>
        </div>
        <div className="metric-card">
          <span>Ticket médio</span>
          <strong>{formatPrice(averageTicket)}</strong>
          <small>por pedido concretizado</small>
        </div>
        <div className="metric-card">
          <span>Itens vendidos</span>
          <strong>{itemsSold}</strong>
          <small>unidades no período</small>
        </div>
        <div className="metric-card">
          <span>Total de pedidos</span>
          <strong>{periodOrders.length}</strong>
          <small>incluindo pendentes e encerrados</small>
        </div>
      </div>

      <section className="metrics-panel metrics-chart-panel">
        <h3>
          Faturamento por dia
          {period === "all" && <small> (últimos 30 dias)</small>}
        </h3>

        {maxDayRevenue === 0 ? (
          <p className="admin-status">Nenhuma venda concretizada no período.</p>
        ) : (
          <div className="metrics-chart" role="img" aria-label="Gráfico de faturamento por dia">
            {salesByDay.map((day, index) => {
              const height = maxDayRevenue > 0 ? (day.revenue / maxDayRevenue) * 100 : 0;
              const label = day.date.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
              });
              // Com muitos dias, mostra o rótulo intercalado para não embolar.
              const labelStep = salesByDay.length > 45 ? 7 : salesByDay.length > 15 ? 3 : 1;
              const showLabel = index % labelStep === 0;
              return (
                <div
                  className="metrics-bar-wrap"
                  key={day.date.getTime()}
                  title={`${label}: ${formatPrice(day.revenue)} (${day.orders} pedido(s))`}
                >
                  <div
                    className={`metrics-bar ${day.revenue > 0 ? "has-value" : ""}`}
                    style={{ height: `${Math.max(height, day.revenue > 0 ? 4 : 1)}%` }}
                  />
                  <span className="metrics-bar-label">{showLabel ? label : ""}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="metrics-grid">
        <section className="metrics-panel">
          <h3>
            Interesse x venda
            <small> (acumulado, não segue o filtro de período)</small>
          </h3>
          {funnel.length === 0 ? (
            <p className="admin-status">
              Ainda sem visitas registradas. Os números aparecem conforme os clientes navegam.
            </p>
          ) : (
            <ul className="metrics-list metrics-funnel">
              {funnel.map((row) => (
                <li key={row.id}>
                  <span className="funnel-name">{row.name}</span>
                  <span className="funnel-numbers">
                    <span title="Visitas na página do produto">👁 {row.views}</span>
                    <span title="Vezes que foi adicionado ao carrinho">🛒 {row.adds}</span>
                    <span title="Unidades vendidas">✅ {row.sold}</span>
                    <strong
                      className={row.rate >= 5 ? "funnel-good" : row.rate > 0 ? "" : "funnel-bad"}
                      title="Quantas visitas viraram venda"
                    >
                      {row.rate.toFixed(1)}%
                    </strong>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="metrics-panel">
          <h3>
            Procuraram e não acharam
            <small> (oportunidades)</small>
          </h3>
          {emptySearches.length === 0 ? (
            <p className="admin-status">
              Nenhuma busca sem resultado registrada — ou seu catálogo está cobrindo o que pedem.
            </p>
          ) : (
            <ul className="metrics-list">
              {emptySearches.map(([term, count]) => (
                <li key={term}>
                  <span>“{term}”</span>
                  <strong>
                    {count}x
                  </strong>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="metrics-grid">
        <section className="metrics-panel">
          <h3>Pedidos por status</h3>
          {periodOrders.length === 0 ? (
            <p className="admin-status">Nenhum pedido no período.</p>
          ) : (
            <ul className="metrics-list">
              {Object.entries(statusCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([status, count]) => (
                  <li key={status}>
                    <span>{ORDER_STATUS_LABELS[status] || status}</span>
                    <strong>{count}</strong>
                  </li>
                ))}
            </ul>
          )}
        </section>

        <section className="metrics-panel">
          <h3>Mais vendidos</h3>
          {bestSellers.length === 0 ? (
            <p className="admin-status">Nenhuma venda concretizada no período.</p>
          ) : (
            <ul className="metrics-list">
              {bestSellers.map((item) => (
                <li key={item.name}>
                  <span>{item.name}</span>
                  <strong>
                    {item.quantity} un · {formatPrice(item.revenue)}
                  </strong>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="metrics-panel">
          <h3>Alertas de estoque</h3>
          {outOfStockProducts.length === 0 && lowStockProducts.length === 0 ? (
            <p className="admin-status">
              {products.some(hasStockControl)
                ? "Nenhum produto com estoque baixo ou esgotado."
                : "Nenhum produto com controle de estoque cadastrado."}
            </p>
          ) : (
            <ul className="metrics-list">
              {outOfStockProducts.map((p) => (
                <li key={p.id}>
                  <span>{p.name}</span>
                  <strong className="metric-alert out">Esgotado</strong>
                </li>
              ))}
              {lowStockProducts.map((p) => (
                <li key={p.id}>
                  <span>{p.name}</span>
                  <strong className="metric-alert low">{p.stock} restante(s)</strong>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
