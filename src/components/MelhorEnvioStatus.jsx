import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./MelhorEnvioStatus.css";

const MESSAGES = {
  conectado: { type: "ok", text: "Conta do Melhor Envio conectada com sucesso!" },
  erro: { type: "error", text: "Não foi possível conectar a conta do Melhor Envio." },
};

const REASONS = {
  state_invalido: "a autorização não conferiu (tente de novo a partir daqui).",
  troca_falhou: "o Melhor Envio recusou as credenciais do aplicativo.",
  sem_codigo: "o Melhor Envio não devolveu o código de autorização.",
  access_denied: "a autorização foi negada.",
};

function formatDate(timestamp) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// Mostra se a loja está autorizada a cotar frete e permite (re)conectar.
export default function MelhorEnvioStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  // O callback do OAuth volta para /admin?melhorenvio=conectado|erro
  const result = searchParams.get("melhorenvio");
  const reason = searchParams.get("motivo");

  useEffect(() => {
    let active = true;

    fetch("/api/melhorenvio/status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active) setStatus(data);
      })
      .catch(() => {
        if (active) setStatus(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // Reconsulta depois de voltar do fluxo de autorização.
  }, [result]);

  function dismissMessage() {
    searchParams.delete("melhorenvio");
    searchParams.delete("motivo");
    setSearchParams(searchParams, { replace: true });
  }

  const message = MESSAGES[result];

  return (
    <div className="me-status">
      <div className="me-status-header">
        <h3>Cotação de frete — Melhor Envio</h3>
        {!loading && status?.environment && (
          <span className={`me-env me-env-${status.environment}`}>
            {status.environment === "production" ? "produção" : "sandbox (teste)"}
          </span>
        )}
      </div>

      {message && (
        <p className={`me-message me-message-${message.type}`}>
          {message.text} {reason && REASONS[reason] ? `Motivo: ${REASONS[reason]}` : ""}
          <button type="button" onClick={dismissMessage} aria-label="Fechar aviso">
            ✕
          </button>
        </p>
      )}

      {loading && <p className="me-hint">Verificando conexão...</p>}

      {!loading && !status && (
        <p className="me-hint">
          A verificação só funciona com o site publicado (ou rodando via Netlify). Localmente com{" "}
          <code>npm run dev</code> ela responde, mas o Melhor Envio precisa de um endereço público
          para devolver a autorização.
        </p>
      )}

      {!loading && status && !status.configured && (
        <p className="me-hint">
          Falta cadastrar <code>MELHOR_ENVIO_TOKEN</code> nas variáveis de ambiente do Netlify. Veja
          o README.
        </p>
      )}

      {/* Token fixo do painel: não há autorização para renovar nem prazo a
          acompanhar, então mostrar "válida até" e botão de reconectar só
          confundiria. */}
      {!loading && status?.mode === "token" && (
        <p className="me-state connected">
          ✅ Conectado por token fixo — sem prazo de renovação. Para trocar o token, atualize{" "}
          <code>MELHOR_ENVIO_TOKEN</code> no Netlify.
        </p>
      )}

      {!loading && status?.configured && status.mode !== "token" && (
        <>
          <p className={`me-state ${status.connected ? "connected" : ""}`}>
            {status.connected ? (
              <>
                ✅ Conectado — autorização válida até <strong>{formatDate(status.expiresAt)}</strong>
                . A renovação é automática.
              </>
            ) : (
              <>⚠️ Ainda não autorizado — a loja não consegue cotar frete.</>
            )}
          </p>

          <a className="btn btn-ghost" href="/api/melhorenvio/connect">
            {status.connected ? "Reconectar conta" : "Conectar conta do Melhor Envio"}
          </a>
        </>
      )}
    </div>
  );
}
