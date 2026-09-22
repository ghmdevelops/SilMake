// Configuração do Firebase - SilBeauty
import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
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

// Chave do reCAPTCHA Enterprise usada pelo App Check. É pública por natureza,
// como o resto da configuração acima: ela identifica o site, não autoriza
// nada sozinha. O segredo fica do lado do Google.
const APP_CHECK_SITE_KEY = "6LdMTcgtAAAAAKWjlD3vQ2Q7TOdUX7VeFSAQQM6-";

export const app = initializeApp(firebaseConfig);

// App Check: prova ao Firebase que a requisição veio do SEU site, e não de um
// script rodando fora dele.
//
// As credenciais acima ficam visíveis no JavaScript — isso é normal e
// esperado. Sem App Check, porém, qualquer pessoa pode copiá-las e conversar
// direto com o banco, sem passar pela loja. As regras continuam valendo
// (ninguém lê pedido alheio), mas o que é público fica exposto a raspagem e
// a escrita automatizada. O App Check fecha essa porta.
//
// Precisa vir ANTES de getDatabase/getAuth: serviços iniciados antes dele
// fariam as primeiras chamadas sem o token.
//
// O SDK cuida de carregar o reCAPTCHA e renovar o token sozinho. Não é
// preciso script no HTML nem chamar grecaptcha manualmente.
if (typeof window !== "undefined") {
  // Em desenvolvimento o localhost não passa no reCAPTCHA. Com este
  // sinalizador, o SDK imprime um token de depuração no console do navegador
  // na primeira execução — cadastre-o uma vez em
  // Firebase Console → App Check → seu app → Gerenciar tokens de depuração.
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-undef
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(APP_CHECK_SITE_KEY),
      // Renova o token antes de expirar, para o cliente não esbarrar num
      // erro no meio da navegação.
      isTokenAutoRefreshEnabled: true,
    });
  } catch (err) {
    // Uma falha aqui (rede, bloqueador de anúncios, chave errada) não pode
    // derrubar a loja. Enquanto a verificação estiver em modo "não aplicada"
    // no console, o site funciona normalmente mesmo sem o token.
    console.error("Não foi possível iniciar o App Check:", err);
  }
}

export const db = getDatabase(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
