import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const { totalItems } = useCart();
  const { totalItems: totalFavorites } = useWishlist();
  const { currentUser, isAdmin, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  async function handleLogout() {
    setUserMenuOpen(false);
    await logout();
    // "replace" evita que o botão "voltar" do navegador retorne para uma
    // página que exigia login (ex: /perfil) depois de sair da conta.
    navigate("/", { replace: true });
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          Sil<span>Beauty</span>
        </Link>

        {/* Só aparece em telas maiores; no celular esses links ficam dentro do menu do avatar */}
        <nav className="navbar-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            Loja
          </NavLink>
          <NavLink to="/sobre" className={({ isActive }) => (isActive ? "active" : "")}>
            Sobre
          </NavLink>
          <NavLink to="/faq" className={({ isActive }) => (isActive ? "active" : "")}>
            FAQ
          </NavLink>
          <NavLink
            to="/favoritos"
            className={({ isActive }) => "cart-link " + (isActive ? "active" : "")}
          >
            ♡ Favoritos
            {totalFavorites > 0 && <span className="cart-badge">{totalFavorites}</span>}
          </NavLink>
        </nav>

        {/* Sempre visíveis, mesmo no celular */}
        <div className="navbar-actions">
          <Link to="/carrinho" className="navbar-cart-btn" aria-label="Carrinho">
            🛒
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </Link>

          <div className="user-menu">
            <button
              className="user-avatar-btn"
              onClick={() => setUserMenuOpen((v) => !v)}
              aria-label="Menu da conta"
            >
              {currentUser ? (
                currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="" />
                ) : (
                  <span>{(currentUser.displayName || currentUser.email || "?").charAt(0).toUpperCase()}</span>
                )
              ) : (
                <span className="user-avatar-guest">👤</span>
              )}
            </button>

            {userMenuOpen && (
              <div className="user-dropdown">
                {/* Só aparecem no celular (no desktop já estão na barra) */}
                <div className="dropdown-nav-links">
                  <NavLink to="/" end onClick={() => setUserMenuOpen(false)}>
                    🏠 Loja
                  </NavLink>
                  <NavLink to="/sobre" onClick={() => setUserMenuOpen(false)}>
                    ℹ️ Sobre
                  </NavLink>
                  <NavLink to="/faq" onClick={() => setUserMenuOpen(false)}>
                    ❓ FAQ
                  </NavLink>
                  <NavLink to="/favoritos" onClick={() => setUserMenuOpen(false)}>
                    ♡ Favoritos
                    {totalFavorites > 0 && <span className="cart-badge">{totalFavorites}</span>}
                  </NavLink>
                  <div className="dropdown-divider" />
                </div>

                {currentUser ? (
                  <>
                    <Link to="/perfil" onClick={() => setUserMenuOpen(false)}>
                      👤 Meu perfil
                    </Link>
                    <Link to="/meus-pedidos" onClick={() => setUserMenuOpen(false)}>
                      📦 Meus pedidos
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setUserMenuOpen(false)}>
                        🛠️ Painel Admin
                      </Link>
                    )}
                    <button onClick={handleLogout}>🚪 Sair</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setUserMenuOpen(false)}>
                      🔑 Entrar
                    </Link>
                    <Link to="/cadastro" onClick={() => setUserMenuOpen(false)}>
                      ✨ Criar conta
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
