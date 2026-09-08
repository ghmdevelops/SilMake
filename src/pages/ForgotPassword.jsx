import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSeo } from "../hooks/useSeo";
import { translateAuthError } from "../utils/authErrors";
import "./Auth.css";

export default function ForgotPassword() {
  useSeo({
    title: "Recuperar senha",
    description: "Recupere o acesso à sua conta SilMake.",
  });

  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(translateAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Recuperar senha</h1>
        <p className="auth-subtitle">
          Informe seu e-mail e enviaremos um link para redefinir sua senha.
        </p>

        {sent ? (
          <p className="auth-success">
            Se existir uma conta com esse e-mail, enviamos um link de recuperação. Confira sua
            caixa de entrada (e o spam).
          </p>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              E-mail
              <input
                className="input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
              />
            </label>

            {error && <p className="auth-error">{error}</p>}

            <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
              {loading ? "Enviando..." : "Enviar link de recuperação"}
            </button>
          </form>
        )}

        <p className="auth-footer">
          <Link to="/login">Voltar para o login</Link>
        </p>
      </div>
    </div>
  );
}
