import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { ADMIN_EMAILS } from "../config";

const REMEMBER_EMAIL_KEY = "silmake_remembered_email";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  function signup(email, password, name) {
    return createUserWithEmailAndPassword(auth, email, password).then(async (cred) => {
      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }
      return cred;
    });
  }

  // "remember" = true mantém a sessão conectada mesmo depois de fechar o navegador.
  // "remember" = false desconecta automaticamente ao fechar a aba/navegador.
  async function login(email, password, remember = true) {
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);

    if (remember) {
      localStorage.setItem(REMEMBER_EMAIL_KEY, email);
    } else {
      localStorage.removeItem(REMEMBER_EMAIL_KEY);
    }

    return signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle(remember = true) {
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
    return signInWithPopup(auth, googleProvider);
  }

  function getRememberedEmail() {
    return localStorage.getItem(REMEMBER_EMAIL_KEY) || "";
  }

  function logout() {
    localStorage.removeItem(REMEMBER_EMAIL_KEY);
    return signOut(auth);
  }

  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  function updateUserProfile(data) {
    return updateProfile(auth.currentUser, data).then(() => {
      // Força a atualização do estado local, já que o Firebase não emite
      // onAuthStateChanged para simples mudanças de perfil.
      setCurrentUser({ ...auth.currentUser });
    });
  }

  const isAdmin = !!currentUser && ADMIN_EMAILS.includes(currentUser.email);

  const value = {
    currentUser,
    loading,
    isAdmin,
    signup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
    getRememberedEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
