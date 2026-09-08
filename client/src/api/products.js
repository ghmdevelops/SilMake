import { db } from "../firebase";
import { ref, push, set, update, remove } from "firebase/database";

// Cria um novo produto no Realtime Database
export function createProduct(product) {
  const productsRef = ref(db, "products");
  const newRef = push(productsRef);
  return set(newRef, {
    ...product,
    createdAt: Date.now(),
  });
}

// Atualiza um produto existente
export function updateProduct(id, product) {
  const productRef = ref(db, `products/${id}`);
  return update(productRef, product);
}

// Remove um produto
export function deleteProduct(id) {
  const productRef = ref(db, `products/${id}`);
  return remove(productRef);
}

// Converte um arquivo de imagem em base64 (data URL)
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
