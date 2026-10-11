
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Package,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  stock: "",
  category_id: "",
  image_url: "",
  is_active: true,
};

function makeSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function AdminDashboard({ onBack }) {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [adminAllowed, setAdminAllowed] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        setError("Banza winjire muri konti yawe.");
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

      if (profileError) throw profileError;

      if (profile?.role !== "admin") {
        setError("Ntabwo wemerewe gufungura Admin Dashboard.");
        setLoading(false);
        return;
      }

      setAdminAllowed(true);
      await loadProducts();
    } catch (err) {
      setError(err.message || "Ntibyashobotse kugenzura admin.");
      setLoading(false);
    }
  }

  async function loadProducts() {
    setLoading(true);
    setError("");

    const { data, error: fetchError } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setProducts(data || []);
    }

    setLoading(false);
  }

  function updateField(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function startAdd() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
    setMessage("");
  }

  function startEdit(product) {
    setEditingId(product.id);
    setForm({
      name: product.name || "",
      description: product.description || "",
      price: String(product.price ?? ""),
      stock: String(product.stock ?? ""),
      category_id: product.category_id
        ? String(product.category_id)
        : "",
      image_url: product.image_url || "",
      is_active: product.is_active,
    });

    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveProduct(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const price = Number(form.price);
    const stock = Number(form.stock);

    if (!form.name.trim()) {
      setError("Andika izina rya product.");
      setSaving(false);
      return;
    }

    if (form.price === "" || !Number.isFinite(price) || price < 0) {
      setError("Shyiramo igiciro cyemewe.");
      setSaving(false);
      return;
    }

    if (
      form.stock === "" ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setError("Stock igomba kuba umubare wuzuye utari munsi ya zero.");
      setSaving(false);
      return;
    }

    const payload = {
      name: form.name.trim(),
      slug: makeSlug(form.name),
      description: form.description.trim() || null,
      price,
      stock,
      category_id: form.category_id
        ? Number(form.category_id)
        : null,
      image_url: form.image_url.trim() || null,
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    };

    try {
      const result =
        editingId !== null
          ? await supabase
              .from("products")
              .update(payload)
              .eq("id", editingId)
              .select()
          : await supabase
              .from("products")
              .insert(payload)
              .select();

      if (result.error) throw result.error;

      if (!result.data || result.data.length === 0) {
        throw new Error(
          "Nta product yahinduwe. Reba uburenganzira bwa admin."
        );
      }

      setMessage(
        editingId !== null
          ? "Product yahinduwe neza!"
          : "Product nshya yongewemo neza!"
      );

      setForm({ ...emptyForm });
      setEditingId(null);
      await loadProducts();
    } catch (err) {
      setError(err.message || "Habaye ikibazo mu kubika product.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(product) {
    if (!window.confirm(`Uremeza ko ushaka gusiba "${product.name}"?`)) {
      return;
    }

    setError("");
    setMessage("");

    const { data, error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id)
      .select("id");

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    if (!data || data.length === 0) {
      setError("Product ntiyasibwe. Reba uburenganzira bwa admin.");
      return;
    }

    setProducts((current) =>
      current.filter((item) => item.id !== product.id)
    );

    setMessage("Product yasibwe neza.");
  }

  async function toggleActive(product) {
    setError("");
    setMessage("");

    const { data, error: updateError } = await supabase
      .from("products")
      .update({
        is_active: !product.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", product.id)
      .select();

    if (updateError) {
      setError(updateError.message);
      return;
    }

    if (!data || data.length === 0) {
      setError("Ntibyashobotse guhindura uko product igaragara.");
      return;
    }

    setProducts((current) =>
      current.map((item) =>
        item.id === product.id ? data[0] : item
      )
    );

    setMessage(
      product.is_active
        ? "Product yahishwe mu iduka."
        : "Product yongeye kugaragara mu iduka."
    );
  }

  const filteredProducts = products.filter((product) =>
    (product.name || "")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (loading && !adminAllowed) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <p>Turimo kugenzura uburenganzira bwa admin...</p>
      </div>
    );
  }

  if (!adminAllowed) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="w-full max-w-md rounded-2xl border bg-white p-6 text-center">
          <h2 className="text-xl font-bold">Admin Dashboard</h2>
          <p className="mt-3 text-red-600">{error}</p>
          <button
            onClick={onBack}
            className="mt-5 rounded-lg bg-black px-5 py-3 text-white"
          >
            <ArrowLeft size={18} className="mr-2 inline" />
            Subira ku iduka
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 text-gray-900 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">
              JandaStore
            </p>
            <h1 className="mt-1 text-3xl font-bold">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-gray-600">
              Genzura ibicuruzwa n'ububiko bw'iduka.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadProducts}
              className="rounded-lg border bg-white px-4 py-3 hover:bg-gray-100"
              title="Refresh products"
            >
              <RefreshCw size={18} />
            </button>

            <button
              onClick={onBack}
              className="rounded-lg border bg-white px-4 py-3 hover:bg-gray-100"
            >
              <ArrowLeft size={18} className="mr-2 inline" />
              Ku iduka
            </button>
          </div>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5">
            <Package className="mb-3 text-gray-500" />
            <p className="text-sm text-gray-500">Products zose</p>
            <p className="mt-1 text-3xl font-bold">{products.length}</p>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <Eye className="mb-3 text-green-600" />
            <p className="text-sm text-gray-500">Zigaragara mu iduka</p>
            <p className="mt-1 text-3xl font-bold">
              {products.filter((p) => p.is_active).length}
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <Package className="mb-3 text-orange-500" />
            <p className="text-sm text-gray-500">Stock yashize</p>
            <p className="mt-1 text-3xl font-bold">
              {products.filter((p) => p.stock === 0).length}
            </p>
          </div>
        </section>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {message}
          </div>
        )}

        <section className="mb-8 rounded-2xl border bg-white p-5 sm:p-7">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">
                {editingId !== null ? "Hindura product" : "Ongeramo product"}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Uzuza amakuru y'igicuruzwa.
              </p>
            </div>

            {editingId !== null && (
              <button
                onClick={startAdd}
                className="rounded-lg border p-2"
                title="Cancel edit"
              >
                <X size={20} />
              </button>
            )}
          </div>

          <form onSubmit={saveProduct} className="grid gap-5 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Izina rya product *
              <input
                name="name"
                value={form.name}
                onChange={updateField}
                required
                className="rounded-lg border px-3 py-3 font-normal"
                placeholder="Urugero: T-shirt"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Igiciro *
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={updateField}
                required
                className="rounded-lg border px-3 py-3 font-normal"
                placeholder="Urugero: 15000"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Stock *
              <input
                name="stock"
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={updateField}
                required
                className="rounded-lg border px-3 py-3 font-normal"
                placeholder="Umubare uhari"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium">
              Category ID (si ngombwa)
              <input
                name="category_id"
                type="number"
                min="1"
                value={form.category_id}
                onChange={updateField}
                className="rounded-lg border px-3 py-3 font-normal"
                placeholder="Urugero: 1"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium md:col-span-2">
              Image URL
              <input
                name="image_url"
                type="url"
                value={form.image_url}
                onChange={updateField}
                className="rounded-lg border px-3 py-3 font-normal"
                placeholder="https://example.com/product.jpg"
              />
            </label>

            {form.image_url && (
              <div className="md:col-span-2">
                <p className="mb-2 text-sm text-gray-500">Image preview</p>
                <img
                  src={form.image_url}
                  alt="Product preview"
                  className="h-40 w-40 rounded-xl border object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}

            <label className="grid gap-2 text-sm font-medium md:col-span-2">
              Ibisobanuro
              <textarea
                name="description"
                rows={4}
                value={form.description}
                onChange={updateField}
                className="rounded-lg border px-3 py-3 font-normal"
                placeholder="Andika ibisobanuro bya product..."
              />
            </label>

            <label className="flex items-center gap-3 text-sm md:col-span-2">
              <input
                name="is_active"
                type="checkbox"
                checked={form.is_active}
                onChange={updateField}
                className="h-4 w-4"
              />
              Product igaragare mu iduka
            </label>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-lg bg-black px-5 py-3 font-semibold text-white hover:bg-gray-800 disabled:opacity-50 md:col-span-2"
            >
              <Plus size={18} />
              {saving
                ? "Turimo kubika..."
                : editingId !== null
                ? "Bika impinduka"
                : "Ongeramo product"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border bg-white p-5 sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Products</h2>
              <p className="mt-1 text-sm text-gray-500">
                Guhindura, guhisha cyangwa gusiba ibicuruzwa.
              </p>
            </div>

            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Shakisha product..."
                className="w-full rounded-lg border py-2.5 pl-10 pr-3 sm:w-64"
              />
            </div>
          </div>

          {loading ? (
            <p className="py-8 text-center text-gray-500">
              Turimo kuzana products...
            </p>
          ) : filteredProducts.length === 0 ? (
            <p className="py-8 text-center text-gray-500">
              Nta products zabonetse.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-gray-500">
                    <th className="p-3">Product</th>
                    <th className="p-3">Igiciro</th>
                    <th className="p-3">Stock</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Ibikorwa</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b last:border-0">
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="h-12 w-12 rounded-lg border object-cover"
                            />
                          ) : (
                            <div className="grid h-12 w-12 place-items-center rounded-lg bg-gray-100">
                              <Package size={20} />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold">{product.name}</p>
                            <p className="text-xs text-gray-500">
                              ID: {product.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        {Number(product.price).toLocaleString()} RWF
                      </td>

                      <td className="p-3">{product.stock}</td>

                      <td className="p-3">
                        <span
                          className={
                            product.is_active
                              ? "rounded-full bg-green-100 px-2.5 py-1 text-xs text-green-700"
                              : "rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600"
                          }
                        >
                          {product.is_active ? "Active" : "Hidden"}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEdit(product)}
                            className="rounded-lg border p-2 hover:bg-gray-100"
                            title="Edit product"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            onClick={() => toggleActive(product)}
                            className="rounded-lg border p-2 hover:bg-gray-100"
                            title={product.is_active ? "Hide product" : "Show product"}
                          >
                            {product.is_active ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </button>

                          <button
                            onClick={() => deleteProduct(product)}
                            className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                            title="Delete product"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
