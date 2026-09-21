import { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";

// Escuta em tempo real os dados extras do perfil do usuário (sobrenome,
// endereço, avatar) que o Firebase Authentication não guarda.
//
// Assim como nos hooks de pedidos, o estado registra de qual `uid` é o dado,
// e "carregando" passa a ser derivado disso.
export function useUserProfile(uid) {
  const [state, setState] = useState({ uid: null, profile: null });

  useEffect(() => {
    if (!uid) return undefined;

    const profileRef = ref(db, `users/${uid}`);
    const unsubscribe = onValue(
      profileRef,
      (snapshot) => {
        setState({ uid, profile: snapshot.val() || {} });
      },
      (error) => {
        console.error("Erro ao carregar perfil:", error);
        setState({ uid, profile: {} });
      }
    );

    return () => unsubscribe();
  }, [uid]);

  const ready = state.uid === uid;

  return {
    profile: ready ? state.profile : null,
    loading: !!uid && !ready,
  };
}
