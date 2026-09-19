import { useMemo, useState } from "react";
import { useProducts } from "../hooks/useProducts";
import { createProduct, updateProduct, deleteProduct } from "../api/products";
import { fileToResizedDataUrl, dataUrlSizeKb } from "../utils/imageResize";
import { Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { isOutOfStock, isLowStock } from "../utils/stock";
import { normalizeCategory } from "../utils/category";
import { getDiscount } from "../utils/pricing";
import { exportProductsToCsv } from "../utils/exportCsv";
import { DEFAULT_PACKAGE, PACKAGE_PRESETS, hasPackageData } from "../utils/packaging";
import AdminOrders from "./AdminOrders";
import AdminMetrics from "./AdminMetrics";
import AdminCustomers from "./AdminCustomers";
import AdminManualOrder from "./AdminManualOrder";
import AdminSettings from "./AdminSettings";
import "./Admin.css";

const emptyForm = {
  name: "",
  price: "",
  oldPrice: "",
  category: "",
  description: "",
  image: "",
  promotion: false,
  hidden: false,
  stock: "",
  // Usados na cotação de frete (Melhor Envio). Já nascem com a embalagem
  // padrão de cosméticos, para você só ajustar quando o produto for diferente.
  weight: String(DEFAULT_PACKAGE.weight),
  length: String(DEFAULT_PACKAGE.length),
  width: String(DEFAULT_PACKAGE.width),
  height: String(DEFAULT_PACKAGE.height),
};

function formatPrice(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function Admin() {
  const [tab, setTab] = useState("produtos"); // "produtos" | "pedidos"
  const { products, loading } = useProducts({ includeHidden: true });
  const { showToast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [imageMode, setImageMode] = useState("url"); // "url" | "upload"
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [optimizingImage, setOptimizingImage] = useState(false);
  const [imageInfo, setImageInfo] = useState(null);
  const [productSearch, setProductSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");

  // Categorias já cadastradas, usadas na sugestão do formulário e no filtro.
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [products]);

  // Prévia do desconto enquanto o admin digita o preço antigo.
  const discountPreview = getDiscount({ price: form.price, oldPrice: form.oldPrice })?.percent;

  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase();

    return products.filter((product) => {
      if (categoryFilter && product.category !== categoryFilter) return false;

      if (stockFilter === "promotion" && !product.promotion) return false;
      if (stockFilter === "out" && !isOutOfStock(product)) return false;
      if (stockFilter === "low" && !isLowStock(product)) return false;

      if (!term) return true;
      return [product.name, product.category, product.description]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(term));
    });
  }, [products, productSearch, categoryFilter, stockFilter]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleDisplayChange(e) {
    const value = e.target.value;
    setForm((prev) => ({
      ...prev,
      promotion: value === "promotion",
      hidden: value === "hidden",
    }));
  }

  // Preenche os quatro campos de embalagem de uma vez.
  function applyPreset(preset) {
    setForm((prev) => ({
      ...prev,
      weight: String(preset.weight),
      length: String(preset.length),
      width: String(preset.width),
      height: String(preset.height),
    }));
  }

  // Destaca o atalho que corresponde ao que está preenchido agora.
  function isPresetActive(preset) {
    return (
      Number(String(form.weight).replace(",", ".")) === preset.weight &&
      Number(form.length) === preset.length &&
      Number(form.width) === preset.width &&
      Number(form.height) === preset.height
    );
  }

  // Duplicar acelera o cadastro de variações (ex: vários tons do mesmo batom):
  // copia tudo para o formulário como um produto NOVO, sem entrar em edição.
  function handleDuplicate(product) {
    setForm({
      name: `${product.name} (cópia)`,
      price: product.price || "",
      oldPrice: product.oldPrice || "",
      category: product.category || "",
      description: product.description || "",
      image: product.image || "",
      promotion: false, // a cópia não herda o destaque da promoção
      hidden: true, // nasce oculta, para você revisar antes de publicar
      stock: product.stock ?? "",
      weight: String(product.weight ?? DEFAULT_PACKAGE.weight),
      length: String(product.length ?? DEFAULT_PACKAGE.length),
      width: String(product.width ?? DEFAULT_PACKAGE.width),
      height: String(product.height ?? DEFAULT_PACKAGE.height),
    });
    setEditingId(null);
    setImageMode(product.image?.startsWith("data:") ? "upload" : "url");
    setImageInfo(null);
    showToast("Cópia carregada no formulário — ajuste e clique em Adicionar", { type: "info" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // A foto é reduzida e comprimida no navegador antes de ir para o banco.
  // Sem isso, uma foto de celular (vários MB) seria salva inteira em base64,
  // deixando o Realtime Database pesado e a vitrine lenta.
  async function loadImageFile(file) {
    if (!file || !file.type.startsWith("image/")) return;

    setOptimizingImage(true);
    setError("");
    try {
      const originalKb = Math.round(file.size / 1024);
      const dataUrl = await fileToResizedDataUrl(file);
      const finalKb = dataUrlSizeKb(dataUrl);

      setForm((prev) => ({ ...prev, image: dataUrl }));
      setImageInfo({ originalKb, finalKb });
    } catch (err) {
      console.error(err);
      setError(err.message || "Não foi possível carregar a imagem selecionada.");
    } finally {
      setOptimizingImage(false);
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
    setImageInfo(null);
  }

  function handleEdit(product) {
    setForm({
      name: product.name || "",
      price: product.price || "",
      oldPrice: product.oldPrice || "",
      category: product.category || "",
      description: product.description || "",
      image: product.image || "",
      promotion: !!product.promotion,
      hidden: !!product.hidden,
      stock: product.stock ?? "",
      // Produtos antigos (cadastrados antes da cotação) não têm medidas:
      // mostramos a embalagem padrão para você confirmar ou corrigir.
      weight: String(product.weight ?? DEFAULT_PACKAGE.weight),
      length: String(product.length ?? DEFAULT_PACKAGE.length),
      width: String(product.width ?? DEFAULT_PACKAGE.width),
      height: String(product.height ?? DEFAULT_PACKAGE.height),
    });
    setEditingId(product.id);
    setImageMode(product.image?.startsWith("data:") ? "upload" : "url");
    setImageInfo(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Pausar/publicar direto da lista, sem abrir o formulário.
  async function handleToggleHidden(product) {
    try {
      await updateProduct(product.id, { hidden: !product.hidden });
      showToast(
        product.hidden
          ? `${product.name} voltou para a vitrine`
          : `${product.name} foi pausado e não aparece mais na loja`,
        { type: "success" }
      );
      if (editingId === product.id) setForm((prev) => ({ ...prev, hidden: !product.hidden }));
    } catch (err) {
      console.error(err);
      showToast("Erro ao alterar a exibição do produto", { type: "error" });
    }
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
        // Só guarda o preço antigo se ele for maior que o preço de venda —
        // senão não há desconto para mostrar. null remove o campo.
        oldPrice:
          Number(form.oldPrice) > Number(form.price) ? Number(form.oldPrice) : null,
        category: normalizeCategory(form.category, categories),
        description: form.description.trim(),
        image: form.image.trim(),
        promotion: !!form.promotion,
        hidden: !!form.hidden,
        // Vazio cai na embalagem padrão de cosméticos na hora da cotação.
        weight: form.weight === "" ? null : Number(String(form.weight).replace(",", ".")),
        length: form.length === "" ? null : Number(form.length),
        width: form.width === "" ? null : Number(form.width),
        height: form.height === "" ? null : Number(form.height),
        stock: form.stock === "" ? null : Math.max(0, Number(form.stock)),
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
      <p className="admin-subtitle">Gerencie produtos e acompanhe os pedidos da sua loja.</p>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${tab === "produtos" ? "active" : ""}`}
          onClick={() => setTab("produtos")}
        >
          Produtos
        </button>
        <button
          className={`admin-tab ${tab === "pedidos" ? "active" : ""}`}
          onClick={() => setTab("pedidos")}
        >
          Pedidos
        </button>
        <button
          className={`admin-tab ${tab === "lancar" ? "active" : ""}`}
          onClick={() => setTab("lancar")}
        >
          Lançar venda
        </button>
        <button
          className={`admin-tab ${tab === "metricas" ? "active" : ""}`}
          onClick={() => setTab("metricas")}
        >
          Métricas
        </button>
        <button
          className={`admin-tab ${tab === "clientes" ? "active" : ""}`}
          onClick={() => setTab("clientes")}
        >
          Clientes
        </button>
        <button
          className={`admin-tab ${tab === "config" ? "active" : ""}`}
          onClick={() => setTab("config")}
        >
          Frete
        </button>

        {tab === "pedidos" && (
          <Link
            to="/admin/pedidos"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost admin-open-tab-btn"
          >
            Abrir pedidos em nova aba ↗
          </Link>
        )}
      </div>

      {tab === "pedidos" ? (
        <AdminOrders />
      ) : tab === "lancar" ? (
        <AdminManualOrder />
      ) : tab === "metricas" ? (
        <AdminMetrics />
      ) : tab === "clientes" ? (
        <AdminCustomers />
      ) : tab === "config" ? (
        <AdminSettings />
      ) : (
        <>
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
            Preço antigo (R$)
            <input
              className="input"
              name="oldPrice"
              type="number"
              min="0"
              step="0.01"
              value={form.oldPrice}
              onChange={handleChange}
              placeholder="Opcional — para mostrar desconto"
            />
            <small>
              {discountPreview
                ? `Aparecerá riscado com selo de -${discountPreview}% na loja.`
                : "Preencha com um valor maior que o preço para exibir desconto."}
            </small>
          </label>

          <label>
            Estoque (unidades)
            <input
              className="input"
              name="stock"
              type="number"
              min="0"
              step="1"
              value={form.stock}
              onChange={handleChange}
              placeholder="Deixe em branco = sem controle"
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
              list="admin-categories"
              autoComplete="off"
            />
            <datalist id="admin-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <small>Escolha uma categoria existente ou digite uma nova.</small>
          </label>

          <label>
            Exibição na loja
            <select
              className="input"
              value={form.hidden ? "hidden" : form.promotion ? "promotion" : "normal"}
              onChange={handleDisplayChange}
            >
              <option value="normal">Vitrine normal</option>
              <option value="promotion">🔥 Promoção da semana</option>
              <option value="hidden">🚫 Oculto na loja (pausado)</option>
            </select>
          </label>
        </div>

        <h3 className="admin-form-section">Embalagem (para cotar o frete)</h3>
        <p className="admin-form-section-hint">
          Peso e tamanho da caixa já vêm preenchidos com a embalagem padrão da loja. Use os
          atalhos abaixo ou ajuste à mão quando o produto for diferente.
        </p>

        <div className="admin-preset-row">
          {PACKAGE_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              className={`admin-preset-btn ${isPresetActive(preset) ? "active" : ""}`}
              onClick={() => applyPreset(preset)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="admin-shipping-grid">
          <label>
            Peso (kg)
            <input
              className="input"
              name="weight"
              value={form.weight}
              onChange={handleChange}
              placeholder="0,3"
              inputMode="decimal"
            />
          </label>
          <label>
            Comprimento (cm)
            <input
              className="input"
              name="length"
              type="number"
              min="0"
              value={form.length}
              onChange={handleChange}
              placeholder="16"
            />
          </label>
          <label>
            Largura (cm)
            <input
              className="input"
              name="width"
              type="number"
              min="0"
              value={form.width}
              onChange={handleChange}
              placeholder="11"
            />
          </label>
          <label>
            Altura (cm)
            <input
              className="input"
              name="height"
              type="number"
              min="0"
              value={form.height}
              onChange={handleChange}
              placeholder="2"
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
              <span>
                {optimizingImage
                  ? "Otimizando imagem..."
                  : "Arraste uma imagem aqui ou clique para escolher"}
              </span>
            </label>
          )}

          {imageInfo && (
            <p className="image-optimized-note">
              ✓ Imagem otimizada: {imageInfo.originalKb} KB → <strong>{imageInfo.finalKb} KB</strong>{" "}
              (redimensionada para no máximo 800px)
            </p>
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

      <div className="admin-list-header">
        <h2>Produtos cadastrados</h2>
        <span className="admin-list-count">
          {filteredProducts.length} de {products.length}
        </span>
        <button
          className="btn btn-ghost admin-export-btn"
          onClick={() => exportProductsToCsv(filteredProducts)}
          disabled={filteredProducts.length === 0}
          title="Baixa uma planilha de backup com os produtos exibidos"
        >
          ⬇ Exportar catálogo
        </button>
      </div>

      <div className="admin-list-filters">
        <label>
          Buscar produto
          <input
            className="input"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Nome, categoria ou descrição"
          />
        </label>

        <label>
          Categoria
          <select
            className="input"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label>
          Situação
          <select
            className="input"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="promotion">Em promoção</option>
            <option value="low">Estoque baixo</option>
            <option value="out">Esgotados</option>
          </select>
        </label>
      </div>

      {loading && <p className="admin-status">Carregando...</p>}
      {!loading && products.length === 0 && (
        <p className="admin-status">Nenhum produto cadastrado ainda.</p>
      )}
      {!loading && products.length > 0 && filteredProducts.length === 0 && (
        <p className="admin-status">Nenhum produto encontrado com esses filtros.</p>
      )}

      <div className="admin-list">
        {filteredProducts.map((product) => (
          <div className="admin-list-item" key={product.id}>
            <div className="admin-list-image">
              {product.image ? (
                <img src={product.image} alt={product.name} />
              ) : (
                <div className="admin-list-placeholder" />
              )}
            </div>
            <div className="admin-list-info">
              <strong>
                {product.name}
                {product.hidden && <span className="admin-list-hidden-badge">🚫 Pausado</span>}
                {!hasPackageData(product) && (
                  <span className="admin-list-nopack-badge" title="Sem peso/dimensões: a cotação de frete usa o mínimo padrão">
                    📦 sem medidas
                  </span>
                )}
                {product.promotion && <span className="admin-list-promo-badge">🔥 Promoção</span>}
                {product.stock === 0 && <span className="admin-list-stock-badge out">Esgotado</span>}
              </strong>
              <span>
                {getDiscount(product) && (
                  <s className="admin-list-old-price">{formatPrice(product.oldPrice)}</s>
                )}
                {formatPrice(product.price)}
                {getDiscount(product) && (
                  <span className="admin-list-discount">-{getDiscount(product).percent}%</span>
                )}
              </span>
              {product.category && <span className="admin-list-category">{product.category}</span>}
              {typeof product.stock === "number" && (
                <span className="admin-list-stock">
                  {product.stock > 0 ? `${product.stock} em estoque` : "Sem estoque"}
                </span>
              )}
            </div>
            <div className="admin-list-actions">
              <button
                className="btn btn-ghost"
                onClick={() => handleToggleHidden(product)}
                title={product.hidden ? "Voltar a exibir na loja" : "Pausar sem excluir"}
              >
                {product.hidden ? "Publicar" : "Pausar"}
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => handleDuplicate(product)}
                title="Criar um novo produto a partir deste"
              >
                Duplicar
              </button>
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
        </>
      )}
    </div>
  );
}
