import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { ToastProvider } from "./context/ToastContext";
import { WishlistProvider } from "./context/WishlistContext";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AdminGate from "./components/AdminGate";
import ErrorBoundary from "./components/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop";
import TrustBar from "./components/TrustBar";
import BackToTop from "./components/BackToTop";
import CookieConsent from "./components/CookieConsent";
import InstallPwaPrompt from "./components/InstallPwaPrompt";
import PageLoader from "./components/PageLoader";
import SplashScreen from "./components/SplashScreen";
import Home from "./pages/Home";

// Rotas secundárias carregadas sob demanda (code-splitting), para deixar
// o carregamento inicial da loja (Home) mais rápido.
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminOrderDetail = lazy(() => import("./pages/AdminOrderDetail"));
const AdminOrdersPage = lazy(() => import("./pages/AdminOrdersPage"));
const Faq = lazy(() => import("./pages/Faq"));
const BeautyTips = lazy(() => import("./pages/BeautyTips"));
const Favorites = lazy(() => import("./pages/Favorites"));
const About = lazy(() => import("./pages/About"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const Terms = lazy(() => import("./pages/Terms"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Profile = lazy(() => import("./pages/Profile"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const NotFound = lazy(() => import("./pages/NotFound"));

export default function App() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Se o navegador restaurar a página do cache (bfcache) ao clicar em
    // "voltar" (ex: depois de sair da conta), força um recarregamento para
    // que o estado de login seja checado de novo e a rota protegida reaja.
    function handlePageShow(event) {
      if (event.persisted) {
        window.location.reload();
      }
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  return (
    // Boundary externo: última rede de segurança, pega até erros nos contextos.
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <ScrollToTop />
              {/* Fora do app-shell: cobre a tela inteira enquanto o catálogo
                  carrega, e se remove sozinho depois. */}
              <SplashScreen />
              <div className="app-shell">
                <Navbar />
                <TrustBar />
                <main className="app-main">
                  {/* Boundary interno: um erro numa página não derruba o site
                      inteiro — a navegação continua visível. O resetKey faz a
                      tela de erro sair quando o cliente troca de página. */}
                  <ErrorBoundary resetKey={pathname}>
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route
                          path="/produto/:id"
                          element={<ProductDetail />}
                        />
                        <Route path="/carrinho" element={<Cart />} />
                        <Route path="/favoritos" element={<Favorites />} />
                        <Route path="/sobre" element={<About />} />
                        <Route path="/faq" element={<Faq />} />
                        <Route path="/dicas-de-beleza" element={<BeautyTips />} />
                        <Route
                          path="/politica-de-privacidade"
                          element={<PrivacyPolicy />}
                        />
                        <Route path="/termos-de-uso" element={<Terms />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/cadastro" element={<Signup />} />
                        <Route
                          path="/esqueci-senha"
                          element={<ForgotPassword />}
                        />
                        <Route path="/perfil" element={<Profile />} />
                        <Route path="/meus-pedidos" element={<MyOrders />} />
                        <Route
                          path="/admin"
                          element={
                            <AdminGate>
                              <Admin />
                            </AdminGate>
                          }
                        />
                        <Route
                          path="/admin/pedidos"
                          element={
                            <AdminGate>
                              <AdminOrdersPage />
                            </AdminGate>
                          }
                        />
                        <Route
                          path="/admin/pedido/:uid/:orderId"
                          element={
                            <AdminGate>
                              <AdminOrderDetail />
                            </AdminGate>
                          }
                        />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </ErrorBoundary>
                </main>
                <Footer />
                <BackToTop />
                <CookieConsent />
                <InstallPwaPrompt />
              </div>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
