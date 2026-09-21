// Avatares prontos para o cliente escolher no perfil. São emojis com um fundo
// colorido — não consomem banda, funcionam offline (PWA) e não ocupam espaço
// no banco: salvamos apenas o id em `users/{uid}/avatarId`.
export const AVATARS = [
  { id: "lipstick", emoji: "💄", color: "#fbd5e3", label: "Batom" },
  { id: "nails", emoji: "💅", color: "#f8cdd8", label: "Unhas" },
  { id: "blossom", emoji: "🌸", color: "#f4d9f2", label: "Flor de cerejeira" },
  { id: "tulip", emoji: "🌷", color: "#fcd9d2", label: "Tulipa" },
  { id: "butterfly", emoji: "🦋", color: "#d6e4fb", label: "Borboleta" },
  { id: "sparkles", emoji: "✨", color: "#fbeecb", label: "Brilho" },
  { id: "crown", emoji: "👑", color: "#fae4c0", label: "Coroa" },
  { id: "bubbles", emoji: "🫧", color: "#d4f0ef", label: "Bolhas" },
  { id: "strawberry", emoji: "🍓", color: "#fbd2d2", label: "Morango" },
  { id: "moon", emoji: "🌙", color: "#dfdcf8", label: "Lua" },
  { id: "shell", emoji: "🐚", color: "#fbe3d4", label: "Concha" },
  { id: "mirror", emoji: "🪞", color: "#dfeae6", label: "Espelho" },
];

// Ids especiais, que não são emoji:
// "photo"   → foto enviada pelo próprio cliente (salva em users/{uid}/avatarPhoto)
// "google"  → usa a foto da conta Google do cliente
// "initial" → usa a primeira letra do nome sobre o gradiente da marca
export const PHOTO_AVATAR_ID = "photo";
export const GOOGLE_AVATAR_ID = "google";
export const INITIAL_AVATAR_ID = "initial";

export function getAvatar(avatarId) {
  return AVATARS.find((a) => a.id === avatarId) || null;
}
