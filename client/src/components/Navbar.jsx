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
  const [menuOpen, setMenuOpen] = useState(false);
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
        <Link to="/" className="navbar-brand" onClick={() => setMenuOpen(false)}>
          Sil<span>Make</span>
        </Link>

        <nav className={`navbar-links ${menuOpen ? "open" : ""}`}>
          <NavLink to="/" end onClick={() => setMenuOpen(false)} className={({ isActive }) => (isActive ? "active" : "")}>
            Loja
          </NavLink>
          <NavLink to="/sobre" onClick={() => setMenuOpen(false)} className={({ isActive }) => (isActive ? "active" : "")}>
            Sobre
          </NavLink>
          <NavLink to="/faq" onClick={() => setMenuOpen(false)} className={({ isActive }) => (isActive ? "active" : "")}>
            FAQ
          </NavLink>
          <NavLink
            to="/favoritos"
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) => "cart-link " + (isActive ? "active" : "")}
          >
            ♡ Favoritos
            {totalFavorites > 0 && <span className="cart-badge">{totalFavorites}</span>}
          </NavLink>
          <NavLink
            to="/carrinho"
            onClick={() => setMenuOpen(false)}
            className={({ isActive }) => "cart-link " + (isActive ? "active" : "")}
          >
            🛒 Carrinho
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </NavLink>

          {!currentUser && (
            <NavLink to="/login" onClick={() => setMenuOpen(false)} className={({ isActive }) => (isActive ? "active" : "")}>
              Entrar
            </NavLink>
          )}

          {currentUser && (
            <div className="user-menu-mobile">
              <Link to="/perfil" onClick={() => setMenuOpen(false)}>
                Meu perfil
              </Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setMenuOpen(false)}>
                  Painel Admin
                </Link>
              )}
              <button onClick={handleLogout}>Sair</button>
            </div>
          )}
        </nav>

        {currentUser && (
          <div className="user-menu">
            <button
              className="user-avatar-btn"
              onClick={() => setUserMenuOpen((v) => !v)}
              aria-label="Menu do usuário"
            >
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="" />
              ) : (
                <span>{(currentUser.displayName || currentUser.email || "?").charAt(0).toUpperCase()}</span>
              )}
            </button>

            {userMenuOpen && (
              <div className="user-dropdown">
                <Link to="/perfil" onClick={() => setUserMenuOpen(false)}>
                  Meu perfil
                </Link>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setUserMenuOpen(false)}>
                    Painel Admin
                  </Link>
                )}
                <button onClick={handleLogout}>Sair</button>
              </div>
            )}
          </div>
        )}

        <button
          className={`navbar-toggle ${menuOpen ? "open" : ""}`}
          aria-label="Abrir menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
