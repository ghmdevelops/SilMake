import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useSeo } from "../hooks/useSeo";
import { translateAuthError } from "../utils/authErrors";
import "./Auth.css";

export default function Login() {
  useSeo({ title: "Entrar", description: "Entre na sua conta SilBeauty." });

  const { login, loginWithGoogle, getRememberedEmail } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || "/";

  const [email, setEmail] = useState(() => getRememberedEmail());
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password, remember);
      showToast("Login realizado com sucesso!", { type: "success" });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(translateAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle(remember);
      showToast("Login realizado com sucesso!", { type: "success" });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(translateAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Entrar</h1>
        <p className="auth-subtitle">Acesse sua conta na SilBeauty.</p>

        <button className="google-btn" type="button" onClick={handleGoogle} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.3 2.7l5.7-5.7C33.7 6.5 29.1 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.1 0 18.5-7.3 19.4-17 .1-.7.1-1.3.1-2 0-1.4-.2-2.7-.5-4z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c2.8 0 5.3 1 7.3 2.7l5.7-5.7C33.7 6.5 29.1 4.5 24 4.5c-7.7 0-14.3 4.4-17.7 10.2z" />
            <path fill="#4CAF50" d="M24 43.5c5 0 9.6-1.9 13-5l-6-5.1c-2 1.4-4.4 2.1-7 2.1-5.3 0-9.7-3.6-11.3-8.4l-6.6 5.1C9.5 39 16.2 43.5 24 43.5z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6 5.1c3.5-3.2 5.5-8 5.5-13.8 0-1.4-.2-2.7-.5-4z" />
          </svg>
          Entrar com Google
        </button>

        <div className="auth-divider">ou entre com e-mail</div>

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

          <label>
            Senha
            <input
              className="input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
            />
          </label>

          <div className="auth-row">
            <label className="auth-checkbox">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Manter conectado
            </label>
            <Link to="/esqueci-senha" className="auth-forgot-link">
              Esqueci minha senha
            </Link>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="auth-footer">
          Ainda não tem conta? <Link to="/cadastro">Criar conta</Link>
        </p>
      </div>
    </div>
  );
}
