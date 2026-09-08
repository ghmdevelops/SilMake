import { useState } from "react";
import { useProducts } from "../hooks/useProducts";
import { createProduct, updateProduct, deleteProduct, fileToBase64 } from "../api/products";
import { useToast } from "../context/ToastContext";
import "./Admin.css";

const emptyForm = {
  name: "",
  price: "",
  category: "",
  description: "",
  image: "",
};

function formatPrice(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function Admin() {
  const { products, loading } = useProducts();
  const { showToast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [imageMode, setImageMode] = useState("url"); // "url" | "upload"
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function loadImageFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    try {
      const base64 = await fileToBase64(file);
      setForm((prev) => ({ ...prev, image: base64 }));
    } catch {
      setError("Não foi possível carregar a imagem selecionada.");
    }
  }

  function handleImageFile(e) {
    loadImageFile(e.target.files?.[0]);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    loadImageFile(e.dataTransfer.files?.[0]);
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setImageMode("url");
  }

  function handleEdit(product) {
    setForm({
      name: product.name || "",
      price: product.price || "",
      category: product.category || "",
      description: product.description || "",
      image: product.image || "",
    });
    setEditingId(product.id);
    setImageMode(product.image?.startsWith("data:") ? "upload" : "url");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id, name) {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    await deleteProduct(id);
    if (editingId === id) resetForm();
    showToast(`${name} foi excluído`, { type: "info" });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.price) {
      setError("Preencha ao menos o nome e o preço do produto.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        category: form.category.trim(),
        description: form.description.trim(),
        image: form.image.trim(),
      };

      if (editingId) {
        await updateProduct(editingId, payload);
        showToast("Produto atualizado com sucesso", { type: "success" });
      } else {
        await createProduct(payload);
        showToast("Produto adicionado com sucesso", { type: "success" });
      }
      resetForm();
    } catch (err) {
      console.error(err);
      setError("Erro ao salvar o produto. Verifique as regras do Firebase.");
      showToast("Erro ao salvar o produto", { type: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin">
      <h1>Painel administrativo</h1>
      <p className="admin-subtitle">Cadastre, edite ou remova produtos da sua loja.</p>

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form-grid">
          <label>
            Nome do produto *
            <input
              className="input"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ex: Vela aromática"
            />
          </label>

          <label>
            Preço (R$) *
            <input
              className="input"
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              placeholder="Ex: 49.90"
            />
          </label>

          <label>
            Categoria
            <input
              className="input"
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="Ex: Decoração"
            />
          </label>
        </div>

        <label>
          Descrição
          <textarea
            className="input"
            name="description"
            rows={3}
            value={form.description}
            onChange={handleChange}
            placeholder="Detalhes do produto..."
          />
        </label>

        <div className="image-field">
          <span className="image-field-label">Imagem do produto</span>
          <div className="image-mode-toggle">
            <button
              type="button"
              className={imageMode === "url" ? "active" : ""}
              onClick={() => setImageMode("url")}
            >
              Link (URL)
            </button>
            <button
              type="button"
              className={imageMode === "upload" ? "active" : ""}
              onClick={() => setImageMode("upload")}
            >
              Upload de arquivo
            </button>
          </div>

          {imageMode === "url" ? (
            <input
              className="input"
              name="image"
              value={form.image.startsWith("data:") ? "" : form.image}
              onChange={handleChange}
              placeholder="https://exemplo.com/imagem.jpg"
            />
          ) : (
            <label
              className={`dropzone ${dragActive ? "active" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              <input
                className="dropzone-input"
                type="file"
                accept="image/*"
                onChange={handleImageFile}
              />
              <span className="dropzone-icon">⬆</span>
              <span>Arraste uma imagem aqui ou clique para escolher</span>
            </label>
          )}

          {form.image && (
            <div className="image-preview">
              <img src={form.image} alt="Pré-visualização" />
            </div>
          )}
        </div>

        {error && <p className="admin-error">{error}</p>}

        <div className="admin-form-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Salvando..." : editingId ? "Salvar alterações" : "Adicionar produto"}
          </button>
          {editingId && (
            <button type="button" className="btn btn-ghost" onClick={resetForm}>
              Cancelar edição
            </button>
          )}
        </div>
      </form>

      <hr className="admin-divider" />

      <h2>Produtos cadastrados</h2>

      {loading && <p className="admin-status">Carregando...</p>}
      {!loading && products.length === 0 && (
        <p className="admin-status">Nenhum produto cadastrado ainda.</p>
      )}

      <div className="admin-list">
        {products.map((product) => (
          <div className="admin-list-item" key={product.id}>
            <div className="admin-list-image">
              {product.image ? (
                <img src={product.image} alt={product.name} />
              ) : (
                <div className="admin-list-placeholder" />
              )}
            </div>
            <div className="admin-list-info">
              <strong>{product.name}</strong>
              <span>{formatPrice(product.price)}</span>
              {product.category && <span className="admin-list-category">{product.category}</span>}
            </div>
            <div className="admin-list-actions">
              <button className="btn btn-ghost" onClick={() => handleEdit(product)}>
                Editar
              </button>
              <button className="btn btn-danger" onClick={() => handleDelete(product.id, product.name)}>
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
