import { useSeo } from "../hooks/useSeo";
import AdminOrders from "./AdminOrders";
import "./Admin.css";

// Página independente que mostra só os pedidos, pensada para ser aberta numa
// aba separada do navegador e ficar acompanhando os pedidos sem precisar
// voltar pro painel principal de produtos.
export default function AdminOrdersPage() {
  useSeo({ title: "Pedidos (Admin)", description: "Acompanhe todos os pedidos da loja." });

  return (
    <div className="admin">
      <h1>Pedidos</h1>
      <p className="admin-subtitle">Acompanhe aqui todos os pedidos da loja, numa aba separada.</p>
      <AdminOrders />
    </div>
  );
}
