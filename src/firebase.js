// Configuração do Firebase - SilMake
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCeDjRmViI_-R76L10o00iBOc48vLyAGTY",
  authDomain: "flow-fcfb6.firebaseapp.com",
  databaseURL: "https://flow-fcfb6-default-rtdb.firebaseio.com",
  projectId: "flow-fcfb6",
  storageBucket: "flow-fcfb6.firebasestorage.app",
  messagingSenderId: "512465754743",
  appId: "1:512465754743:web:a27675e7df014989140472",
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
