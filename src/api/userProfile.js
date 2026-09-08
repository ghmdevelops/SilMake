import { db } from "../firebase";
import { ref, update } from "firebase/database";

// Salva dados extras do perfil (ex: sobrenome) que o Firebase Auth não guarda por padrão.
export function saveUserProfile(uid, data) {
  const profileRef = ref(db, `users/${uid}`);
  return update(profileRef, data);
}
