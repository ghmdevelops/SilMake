import { useLocation } from "react-router-dom";
import { useShippingSettings } from "../hooks/useShippingSettings";
import { Truck, MessageCircle, Lock } from "./icons";
import "./TrustBar.css";

function formatPrice(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Faixa fina abaixo do menu, com as informações que o cliente procura antes
// de decidir comprar. O texto do frete vem das configurações do admin.
export default function TrustBar() {
  const { shipping } = useShippingSettings();
  const { pathname } = useLocation();

  // No painel administrativo essa faixa só ocuparia espaço.
  if (pathname.startsWith("/admin")) return null;

  const fee = Number(shipping.fee) || 0;
  const freeAbove = Number(shipping.freeAbove) || 0;

  let shippingText;
  if (fee <= 0) shippingText = "Frete grátis em todos os pedidos";
  else if (freeAbove > 0) shippingText = `Frete grátis acima de ${formatPrice(freeAbove)}`;
  else shippingText = `Frete de ${formatPrice(fee)}`;

  return (
    <div className="trust-bar">
      <div className="trust-bar-inner">
        <span className="trust-item">
          <Truck size={16} /> {shippingText}
        </span>
        <span className="trust-item">
          <MessageCircle size={16} /> {shipping.note || "Acompanhe seu pedido pelo site"}
        </span>
        <span className="trust-item">
          <Lock size={16} /> Pagamento confirmado antes do envio
        </span>
      </div>
    </div>
  );
}
