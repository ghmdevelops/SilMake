import { getOrderStatus, ORDER_STATUS_LABELS } from "./orderStatus";

// Escapa um valor para CSV: envolve em aspas e duplica aspas internas.
function escapeCsv(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

// Excel em português espera vírgula como separador decimal.
function formatMoney(value) {
  return Number(value || 0).toFixed(2).replace(".", ",");
}

function formatDate(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleString("pt-BR");
}

function formatAddress(address) {
  if (!address || !address.street) return "";
  const { street, number, complement, neighborhood, city, state, zipCode } = address;
  return [street, number, complement, neighborhood, city, state, zipCode]
    .filter(Boolean)
    .join(", ");
}

// Dispara o download de um CSV já montado.
// Usa ";" como separador e BOM, que é o que o Excel em português espera.
function downloadCsv(rows, filename) {
  const csv = rows.map((row) => row.map(escapeCsv).join(";")).join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

// Backup do catálogo em planilha. A imagem sai como URL apenas quando é um
// link externo — fotos enviadas por upload ficam em base64 e não caberiam.
export function exportProductsToCsv(products) {
  const headers = [
    "Nome",
    "Preco (R$)",
    "Preco antigo (R$)",
    "Categoria",
    "Estoque",
    "Situacao",
    "Descricao",
    "Imagem",
  ];

  const rows = products.map((p) => [
    p.name || "",
    formatMoney(p.price),
    p.oldPrice ? formatMoney(p.oldPrice) : "",
    p.category || "",
    typeof p.stock === "number" ? p.stock : "sem controle",
    p.hidden ? "Pausado" : p.promotion ? "Promocao" : "Ativo",
    p.description || "",
    p.image?.startsWith("data:") ? "(imagem enviada por upload)" : p.image || "",
  ]);

  downloadCsv([headers, ...rows], `catalogo-silbeauty-${today()}.csv`);
}

// Gera e baixa um arquivo CSV com os pedidos recebidos.
// Usa ";" como separador, que é o padrão que o Excel em português reconhece.
export function exportOrdersToCsv(orders, filename) {
  const headers = [
    "Numero do pedido",
    "Data",
    "Status",
    "Cliente",
    "E-mail",
    "Itens",
    "Subtotal (R$)",
    "Frete (R$)",
    "Total (R$)",
    "Endereco",
    "Codigo de rastreio",
    "Link de rastreio",
  ];

  const rows = orders.map((order) => {
    const items = (order.items || [])
      .map((i) => `${i.name} (x${i.quantity})`)
      .join(" | ");

    return [
      order.orderNumber || "",
      formatDate(order.createdAt),
      ORDER_STATUS_LABELS[getOrderStatus(order)] || "",
      order.customerName || "",
      order.customerEmail || "",
      items,
      formatMoney(order.subtotal ?? order.total),
      formatMoney(order.shippingFee),
      formatMoney(order.total),
      formatAddress(order.address),
      order.trackingCode || "",
      order.trackingUrl || "",
    ];
  });

  downloadCsv([headers, ...rows], filename || `pedidos-silbeauty-${today()}.csv`);
}
