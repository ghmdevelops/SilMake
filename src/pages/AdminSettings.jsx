import { useState } from "react";
import { useShippingSettings } from "../hooks/useShippingSettings";
import { saveShippingSettings } from "../api/settings";
import { useToast } from "../context/ToastContext";
import { formatCep } from "../api/cep";
import MelhorEnvioStatus from "../components/MelhorEnvioStatus";
import "./AdminSettings.css";

function formatPrice(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function AdminSettings() {
  const { shipping, loading } = useShippingSettings();
  const { showToast } = useToast();

  const [form, setForm] = useState({ fee: "", freeAbove: "", note: "", originCep: "" });
  const [saving, setSaving] = useState(false);

  // Preenche o formulário quando as configurações chegam do Firebase — e
  // sempre que você salva (o `updatedAt` muda), para os campos refletirem o
  // que está gravado de fato.
  //
  // Feito na renderização (padrão "ajustar estado quando a origem muda") em
  // vez de num efeito: assim não há uma renderização extra com o formulário
  // vazio antes de preencher.
  const [syncedAt, setSyncedAt] = useState(null);
  const settingsStamp = loading ? null : shipping.updatedAt || "vazio";

  if (settingsStamp !== null && settingsStamp !== syncedAt) {
    setSyncedAt(settingsStamp);
    setForm({
      fee: shipping.fee ? String(shipping.fee) : "",
      freeAbove: shipping.freeAbove ? String(shipping.freeAbove) : "",
      note: shipping.note || "",
      originCep: formatCep(shipping.originCep || ""),
    });
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await saveShippingSettings({
        fee: form.fee,
        freeAbove: form.freeAbove,
        note: form.note.trim(),
        originCep: form.originCep,
      });
      showToast("Configurações de frete salvas!", { type: "success" });
    } catch (err) {
      console.error(err);
      showToast(
        `Erro ao salvar${err.code ? ` (${err.code})` : ""}. Confirme as regras do Firebase para o nó "settings".`,
        { type: "error", duration: 6000 }
      );
    } finally {
      setSaving(false);
    }
  }

  const fee = Number(form.fee.replace(",", ".")) || 0;
  const freeAbove = Number(form.freeAbove.replace(",", ".")) || 0;

  return (
    <div className="admin-settings">
      <MelhorEnvioStatus />

      <form className="admin-settings-form" onSubmit={handleSubmit}>
        <h2>Frete</h2>
        <p className="admin-settings-hint">
          Quando a cotação do Melhor Envio está ativa, o cliente informa o CEP no carrinho e
          escolhe entre as opções reais (PAC, SEDEX, Jadlog...). O valor abaixo é a reserva usada
          se a cotação não estiver disponível.
        </p>

        <label>
          CEP de origem (de onde você envia)
          <input
            className="input"
            name="originCep"
            value={form.originCep}
            onChange={(e) => setForm((prev) => ({ ...prev, originCep: formatCep(e.target.value) }))}
            placeholder="00000-000"
            inputMode="numeric"
            maxLength={9}
          />
          <small>Obrigatório para a cotação real funcionar.</small>
        </label>

        <div className="admin-settings-grid">
          <label>
            Frete padrão / reserva (R$)
            <input
              className="input"
              name="fee"
              value={form.fee}
              onChange={handleChange}
              placeholder="Ex: 15,00"
              inputMode="decimal"
            />
            <small>Vazio ou 0 = frete grátis em todos os pedidos.</small>
          </label>

          <label>
            Frete grátis acima de (R$)
            <input
              className="input"
              name="freeAbove"
              value={form.freeAbove}
              onChange={handleChange}
              placeholder="Ex: 150,00"
              inputMode="decimal"
            />
            <small>Esse é o valor divulgado na loja para o cliente.</small>
          </label>
        </div>

        <label>
          Observação exibida no carrinho (opcional)
          <input
            className="input"
            name="note"
            value={form.note}
            onChange={handleChange}
            placeholder="Ex: Enviamos em até 2 dias úteis após a confirmação"
          />
        </label>

        <div className="admin-settings-preview">
          <strong>Como o cliente vai ver:</strong>

          {fee <= 0 ? (
            <span>Frete grátis em todos os pedidos.</span>
          ) : freeAbove > 0 ? (
            <span>
              Frete de {formatPrice(fee)} — e a loja anuncia{" "}
              <em>“Frete grátis acima de {formatPrice(freeAbove)}”</em> na faixa do topo, na página
              do produto e no carrinho.
            </span>
          ) : (
            <span>Frete de {formatPrice(fee)} em todos os pedidos.</span>
          )}

          {fee > 0 && freeAbove <= 0 && (
            <span className="admin-settings-warn">
              Sem um valor de frete grátis, o cliente não recebe nenhum incentivo para aumentar o
              pedido.
            </span>
          )}

          {fee <= 0 && freeAbove > 0 && (
            <span className="admin-settings-warn">
              ⚠️ Com o frete já grátis para todos, anunciar “grátis acima de{" "}
              {formatPrice(freeAbove)}” não faria sentido — então essa mensagem não aparece.
            </span>
          )}
        </div>

        <button className="btn btn-primary" disabled={saving || loading}>
          {saving ? "Salvando..." : "Salvar configurações"}
        </button>
      </form>
    </div>
  );
}
