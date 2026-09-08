import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AdminGate.css";

export default function AdminGate({ children }) {
  const { currentUser, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="admin-gate">
        <div className="admin-gate-box">
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="admin-gate">
        <div className="admin-gate-box">
          <h1>Área restrita</h1>
          <p>Você precisa entrar com a conta de administrador para acessar esta página.</p>
          <Link to="/login" state={{ from: "/admin" }} className="btn btn-primary">
            Fazer login
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-gate">
        <div className="admin-gate-box">
          <h1>Acesso negado</h1>
          <p>
            A conta <code>{currentUser.email}</code> não tem permissão para acessar o painel
            administrativo.
          </p>
          <Link to="/" className="btn btn-ghost">
            Voltar para a loja
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
