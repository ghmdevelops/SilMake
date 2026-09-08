import { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";

// Escuta em tempo real os dados extras do perfil do usuário (ex: sobrenome).
export function useUserProfile(uid) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const profileRef = ref(db, `users/${uid}`);
    const unsubscribe = onValue(profileRef, (snapshot) => {
      setProfile(snapshot.val() || {});
      setLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  return { profile, loading };
}
