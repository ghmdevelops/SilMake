import { useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import { useUserProfile } from "../hooks/useUserProfile";
import UserAvatar from "./UserAvatar";
import CartDrawer from "./CartDrawer";
import FavoritesDrawer from "./FavoritesDrawer";
import {
  Search,
  Star,
  ShoppingCart,
  User,
  UserPlus,
  Store,
  HelpCircle,
  Package,
  Wrench,
  LogIn,
  LogOut,
  X,
} from "./icons";
import "./Navbar.css";

export default function Navbar() {
  const { totalItems } = useCart();
  const { totalItems: totalFavorites } = useWishlist();
  const { currentUser, isAdmin, logout } = useAuth();
  const { profile } = useUserProfile(currentUser?.uid);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Fecha os painéis ao navegar (inclusive pelo botão "voltar" do navegador),
  // para nenhum deles ficar aberto sobre uma página nova.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setCartOpen(false);
    setFavoritesOpen(false);
    setUserMenuOpen(false);
    setSearchOpen(false);
  }

  function handleSearch(e) {
    e.preventDefault();
    const term = searchTerm.trim();
    if (!term) return;
    // A vitrine lê o termo da URL, então a busca funciona como link também.
    navigate(`/?busca=${encodeURIComponent(term)}`);
    setSearchOpen(false);
    setSearchTerm("");
  }

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
        </nav>

        {/* Sempre visíveis, mesmo no celular */}
        <div className="navbar-actions">
          <button
            className="navbar-icon-btn"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Buscar produtos"
            aria-expanded={searchOpen}
          >
            <Search size={20} />
          </button>

          <button
            className="navbar-icon-btn"
            onClick={() => setFavoritesOpen(true)}
            aria-label="Meus favoritos"
          >
            <Star size={20} />
            {totalFavorites > 0 && <span className="cart-badge">{totalFavorites}</span>}
          </button>

          <button
            className="navbar-icon-btn"
            onClick={() => setCartOpen(true)}
            aria-label="Meu carrinho"
          >
            <ShoppingCart size={20} />
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </button>

          <div className="user-menu">
            <button
              className="user-avatar-btn"
              onClick={() => setUserMenuOpen((v) => !v)}
              aria-label="Menu da conta"
            >
              {currentUser ? (
                <UserAvatar user={currentUser} profile={profile} />
              ) : (
                <span className="user-avatar-guest"><User size={18} /></span>
              )}
            </button>

            {userMenuOpen && (
              <div className="user-dropdown">
                {/* Só aparecem no celular (no desktop já estão na barra) */}
                <div className="dropdown-nav-links">
                  <NavLink to="/" end onClick={() => setUserMenuOpen(false)}>
                    <Store size={16} /> Loja
                  </NavLink>
                  <NavLink to="/sobre" onClick={() => setUserMenuOpen(false)}>
                    <HelpCircle size={16} /> Sobre
                  </NavLink>
                  <NavLink to="/faq" onClick={() => setUserMenuOpen(false)}>
                    <HelpCircle size={16} /> FAQ
                  </NavLink>
                  <div className="dropdown-divider" />
                </div>

                {currentUser ? (
                  <>
                    <Link to="/perfil" onClick={() => setUserMenuOpen(false)}>
                      <User size={16} /> Meu perfil
                    </Link>
                    <Link to="/meus-pedidos" onClick={() => setUserMenuOpen(false)}>
                      <Package size={16} /> Meus pedidos
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setUserMenuOpen(false)}>
                        <Wrench size={16} /> Painel Admin
                      </Link>
                    )}
                    <button onClick={handleLogout}><LogOut size={16} /> Sair</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setUserMenuOpen(false)}>
                      <LogIn size={16} /> Entrar
                    </Link>
                    <Link to="/cadastro" onClick={() => setUserMenuOpen(false)}>
                      <UserPlus size={16} /> Criar conta
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Busca acessível de qualquer página: antes só existia na vitrine, e
          quem estava num produto tinha que voltar para procurar outra coisa. */}
      {searchOpen && (
        <form className="navbar-search" onSubmit={handleSearch}>
          <input
            className="input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar produto, categoria..."
            aria-label="Buscar produtos"
            autoFocus
          />
          <button type="submit" className="btn btn-primary">
            Buscar
          </button>
          <button
            type="button"
            className="navbar-search-close"
            onClick={() => setSearchOpen(false)}
            aria-label="Fechar busca"
          >
            <X size={18} />
          </button>
        </form>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <FavoritesDrawer open={favoritesOpen} onClose={() => setFavoritesOpen(false)} />
    </header>
  );
}
