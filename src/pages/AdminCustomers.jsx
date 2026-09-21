import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAllOrders } from "../hooks/useAllOrders";
import { useSeo } from "../hooks/useSeo";
import { getOrderStatus } from "../utils/orderStatus";
import "./AdminCustomers.css";

// Pedidos nesses status contam como compra concretizada no total gasto.
const SOLD_STATUSES = ["paid", "shipped", "completed"];

function formatPrice(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(timestamp) {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleDateString("pt-BR");
}

export default function AdminCustomers() {
  useSeo({ title: "Clientes (Admin)", description: "Clientes da loja SilBeauty." });

  const { orders, loading, error } = useAllOrders();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("spent");

  // Monta a lista de clientes agrupando os pedidos por conta (uid).
  const customers = useMemo(() => {
    const map = new Map();

    orders.forEach((order) => {
      // Pedidos lançados à mão não pertencem a uma conta (todos ficam sob o
      // mesmo uid "manual"), então agrupamos pelo contato informado — senão
      // todas as vendas de WhatsApp virariam um único cliente.
      const key = order.manual
        ? `manual:${(order.customerEmail || order.customerName || "").toLowerCase()}`
        : order.uid;
      if (!key) return;

      const current = map.get(key) || {
        uid: key,
        manual: !!order.manual,
        name: order.customerName || "",
        email: order.customerEmail || "",
        orderCount: 0,
        soldCount: 0,
        totalSpent: 0,
        lastOrderAt: 0,
        address: null,
      };

      // Mantém o nome/e-mail/endereço do pedido mais recente.
      if ((order.createdAt || 0) >= current.lastOrderAt) {
        current.name = order.customerName || current.name;
        current.email = order.customerEmail || current.email;
        current.address = order.address || current.address;
        current.lastOrderAt = order.createdAt || current.lastOrderAt;
      }

      current.orderCount += 1;
      if (SOLD_STATUSES.includes(getOrderStatus(order))) {
        current.soldCount += 1;
        current.totalSpent += Number(order.total || 0);
      }

      map.set(key, current);
    });

    return [...map.values()];
  }, [orders]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = term
      ? customers.filter(
          (c) =>
            c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term)
        )
      : customers;

    const sorted = [...list];
    if (sortBy === "spent") sorted.sort((a, b) => b.totalSpent - a.totalSpent);
    if (sortBy === "orders") sorted.sort((a, b) => b.orderCount - a.orderCount);
    if (sortBy === "recent") sorted.sort((a, b) => b.lastOrderAt - a.lastOrderAt);
    if (sortBy === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [customers, search, sortBy]);

  if (error) {
    return (
      <div className="admin-orders-error">
        <p>
          Não foi possível carregar os clientes. Confirme se as regras do Firebase permitem que a
          conta admin leia o nó <code>orders</code> (veja o README).
        </p>
      </div>
    );
  }

  return (
    <div className="admin-customers">
      <p className="admin-customers-hint">
        Esta lista é montada a partir dos pedidos: aparecem aqui os clientes que já compraram pelo
        menos uma vez.
      </p>

      <div className="admin-customers-toolbar">
        <label>
          Buscar cliente
          <input
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nome ou e-mail"
          />
        </label>

        <label>
          Ordenar por
          <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="spent">Quem gastou mais</option>
            <option value="orders">Quem comprou mais vezes</option>
            <option value="recent">Compra mais recente</option>
            <option value="name">Nome (A-Z)</option>
          </select>
        </label>
      </div>

      {loading && <p className="admin-status">Carregando clientes...</p>}

      {!loading && filtered.length === 0 && (
        <p className="admin-status">
          {customers.length === 0
            ? "Nenhum cliente fez pedidos ainda."
            : "Nenhum cliente encontrado com esse termo."}
        </p>
      )}

      {filtered.length > 0 && (
        <div className="customers-table">
          <div className="customers-row customers-head">
            <span>Cliente</span>
            <span>Pedidos</span>
            <span>Total gasto</span>
            <span>Última compra</span>
          </div>

          {filtered.map((customer) => (
            <div className="customers-row" key={customer.uid}>
              <div className="customer-identity">
                <strong>
                  {customer.name || "Cliente sem nome"}
                  {customer.manual && (
                    <span className="customer-manual-badge">venda manual</span>
                  )}
                </strong>
                <span>{customer.email || "—"}</span>
                {customer.address?.city && (
                  <small>
                    {customer.address.city}
                    {customer.address.state ? ` - ${customer.address.state}` : ""}
                  </small>
                )}
              </div>

              <div className="customer-cell">
                <strong>{customer.orderCount}</strong>
                <small>{customer.soldCount} pago(s)</small>
              </div>

              <div className="customer-cell">
                <strong className="customer-spent">{formatPrice(customer.totalSpent)}</strong>
                {customer.soldCount > 1 && (
                  <small>
                    média {formatPrice(customer.totalSpent / customer.soldCount)}
                  </small>
                )}
              </div>

              <div className="customer-cell">
                <strong>{formatDate(customer.lastOrderAt)}</strong>
                <Link to="/admin/pedidos" className="customer-link">
                  ver pedidos ↗
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
