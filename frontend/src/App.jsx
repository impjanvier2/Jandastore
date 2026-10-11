import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ShoppingBag,
  Plus,
  Minus,
  X,
  Package,
  Truck,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  ShoppingCart,
  UserRound,
  LogOut,
} from "lucide-react";

import Auth from "./components/Auth";
import { supabase } from "./lib/supabase";
import AdminDashboard from "./components/AdminDashboard";


const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const formatPrice = (price) =>
  new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency: "RWF",
    maximumFractionDigits: 0,
  }).format(Number(price) || 0);

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showAdmin, setShowAdmin] = useState(false);
  

  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("jandastore-cart") || "[]");
    } catch {
      return [];
    }
  });

  const [cartOpen, setCartOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Get products from the backend
  async function fetchProducts() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/products`);

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Could not load products");
      }

      setProducts(result.products || []);
    } catch (err) {
      setError(
        "Ntibishobotse kubona ibicuruzwa. Reba niba backend yawe iri gukora."
      );
      console.error("Products API error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  // Save cart in browser storage
  useEffect(() => {
    localStorage.setItem("jandastore-cart", JSON.stringify(cart));
  }, [cart]);

  // Restore login session and listen for login/logout
  useEffect(() => {
    let active = true;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!active) return;

      if (error) {
        console.error("Session error:", error.message);
      }

      setUser(data?.session?.user ?? null);
      setAuthLoading(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error.message);
      alert("Ntibyashobotse gusohoka. Ongera ugerageze.");
      return;
    }

    setUser(null);
    setAuthOpen(false);
  }

  // Search products
  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return products;

    return products.filter((product) =>
      [product.name, product.description, product.slug]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term))
    );
  }, [products, search]);

  const cartCount = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  // Add a product to cart
  function addToCart(product) {
    if (Number(product.stock) < 1) return;

    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: Math.min(
                  item.quantity + 1,
                  Number(product.stock)
                ),
              }
            : item
        );
      }

      return [
        ...current,
        {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          image_url: product.image_url,
          stock: Number(product.stock),
          quantity: 1,
        },
      ];
    });

    setCartOpen(true);
  }

  function changeQuantity(id, amount) {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: Math.min(
                  Number(item.stock),
                  Math.max(0, item.quantity + amount)
                ),
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(id) {
    setCart((current) => current.filter((item) => item.id !== id));
  }

  function handleCheckout() {
    if (!user) {
      setCartOpen(false);
      setAuthOpen(true);
      return;
    }
    if (showAdmin) {
  return (
    <AdminDashboard onBack={() => setShowAdmin(false)} />
  );
}

    alert(
      "Winjiye neza! Gukora checkout no kohereza order muri database tuzabikora mu ntambwe ikurikira."
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-slate-900">
      {/* Announcement */}
      <div className="bg-[#173d2b] px-4 py-2 text-center text-xs font-medium tracking-wide text-white sm:text-sm">
        Welcome to JandaStore — discover products you love.
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <a href="#" className="flex shrink-0 items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#173d2b] text-white">
              <ShoppingBag size={21} />
            </span>
            <span>
              <span className="block text-xl font-black tracking-tight">
                Janda<span className="text-[#31734c]">Store</span>
              </span>
              <span className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500 sm:block">
                Shop with confidence
              </span>
            </span>
          </a>

          <div className="hidden max-w-lg flex-1 md:block">
            <label className="flex items-center gap-3 rounded-full border border-stone-200 bg-stone-50 px-4 py-3 focus-within:border-[#31734c]">
              <Search size={18} className="text-stone-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </label>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {!authLoading &&
              (user ? (
                <>
                  <span className="hidden max-w-32 truncate text-sm font-semibold text-[#173d2b] lg:block">
                    {user.user_metadata?.full_name || user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    title="Logout"
                    className="flex items-center gap-2 rounded-full border border-stone-200 px-3 py-3 text-sm font-semibold hover:bg-stone-50"
                  >
                    <LogOut size={17} />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setAuthOpen(true)}
                  className="flex items-center gap-2 rounded-full border border-[#173d2b] px-3 py-3 text-sm font-semibold text-[#173d2b] hover:bg-green-50"
                >
                  <UserRound size={17} />
                  <span>Login</span>
                </button>
              ))}

              {user && (
  <button
    onClick={() => setShowAdmin(true)}
    className="rounded-lg border px-4 py-2"
  >
    Admin Dashboard
  </button>
)}

            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 rounded-full bg-[#173d2b] px-3 py-3 text-sm font-semibold text-white transition hover:bg-[#24583b] sm:px-4"
              aria-label="Open shopping cart"
            >
              <ShoppingCart size={18} />
              <span className="hidden sm:inline">My Cart</span>
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-[#173d2b]">
                {cartCount}
              </span>
            </button>
          </div>
        </div>

        <div className="px-4 pb-4 md:hidden">
          <label className="flex items-center gap-3 rounded-full border border-stone-200 bg-stone-50 px-4 py-3">
            <Search size={18} className="text-stone-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-transparent text-sm outline-none"
            />
          </label>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-8 lg:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#24583b]">
              <span className="h-2 w-2 rounded-full bg-green-600" />
              Your everyday marketplace
            </span>

            <h1 className="mt-6 max-w-2xl text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl lg:text-7xl">
              Find your next
              <span className="block text-[#31734c]">
                favorite thing.
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-stone-600 sm:text-lg">
              Explore useful products, discover something new, and enjoy a
              simple shopping experience with JandaStore.
            </p>

            <a
              href="#products"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#173d2b] px-6 py-3.5 text-sm font-bold text-white hover:bg-[#24583b]"
            >
              Explore products <ArrowRight size={18} />
            </a>

            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-stone-600">
              <span className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#31734c]" />
                Easy shopping
              </span>
              <span className="flex items-center gap-2">
                <Truck size={18} className="text-[#31734c]" />
                Order-ready
              </span>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] bg-[#e9eee5] p-6 sm:p-10">
            <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/60" />
            <div className="absolute -bottom-12 -left-10 h-48 w-48 rounded-full bg-[#cbdacb]" />
            <div className="relative flex min-h-64 flex-col justify-between sm:min-h-80">
              <div className="flex items-start justify-between">
                <span className="rounded-full bg-white/80 px-3 py-2 text-xs font-bold text-[#24583b]">
                  THE JANDA EDIT
                </span>
                <ShoppingBag size={27} className="text-[#24583b]" />
              </div>

              <div className="py-10 text-center">
                <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-[2rem] border border-white/70 bg-white/80 shadow-xl sm:h-44 sm:w-44">
                  <Package
                    size={90}
                    strokeWidth={1.1}
                    className="text-[#31734c]"
                  />
                </div>
                <p className="mt-5 text-sm font-semibold text-[#24583b]">
                  Simple finds. Everyday value.
                </p>
              </div>

              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs text-stone-600">
                    Made for your daily life
                  </p>
                  <p className="mt-1 text-xl font-black text-[#173d2b]">
                    Shop JandaStore
                  </p>
                </div>
                <span className="rounded-full bg-[#173d2b] px-3 py-2 text-xs font-bold text-white">
                  Discover
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="border-y border-stone-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:grid-cols-3 sm:px-6 lg:px-8">
            {[
              {
                icon: <Package size={21} />,
                title: "Products in one place",
                description: "Browse our collection",
              },
              {
                icon: <ShieldCheck size={21} />,
                title: "Simple experience",
                description: "Clear product information",
              },
              {
                icon: <ShoppingBag size={21} />,
                title: "Easy cart management",
                description: "Keep track of your picks",
              },
            ].map((benefit) => (
              <div key={benefit.title} className="flex items-center gap-3 p-2">
                <span className="rounded-xl bg-green-50 p-3 text-[#31734c]">
                  {benefit.icon}
                </span>
                <div>
                  <p className="text-sm font-bold">{benefit.title}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {benefit.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Products */}
        <section
          id="products"
          className="mx-auto max-w-7xl scroll-mt-32 px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
        >
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#31734c]">
                The collection
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                Shop our products
              </h2>
              <p className="mt-2 text-sm text-stone-500">
                {loading
                  ? "Loading products..."
                  : `${filteredProducts.length} product${filteredProducts.length === 1 ? "" : "s"} to explore`}
              </p>
            </div>

            <button
              onClick={fetchProducts}
              disabled={loading}
              className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold hover:border-[#31734c] disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          {error && (
            <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle size={19} />
                {error}
              </span>
              <button
                onClick={fetchProducts}
                className="self-start font-bold underline sm:self-auto"
              >
                Try again
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="animate-pulse overflow-hidden rounded-3xl border border-stone-200 bg-white"
                >
                  <div className="aspect-[4/3] bg-stone-200" />
                  <div className="space-y-3 p-5">
                    <div className="h-4 w-2/3 rounded bg-stone-200" />
                    <div className="h-4 w-1/3 rounded bg-stone-200" />
                    <div className="h-10 rounded-xl bg-stone-200" />
                  </div>
                </div>
              ))}
            </div>
          ) : !error && filteredProducts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-stone-300 bg-white px-5 py-16 text-center">
              <Package size={42} className="mx-auto text-stone-400" />
              <h3 className="mt-4 text-xl font-bold">
                {search
                  ? "No matching products"
                  : "Your store is getting ready"}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-stone-500">
                {search
                  ? "Try another search term."
                  : "Add products in your Supabase products table and they will appear here."}
              </p>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="mt-5 rounded-full bg-[#173d2b] px-5 py-3 text-sm font-bold text-white"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => {
                const outOfStock = Number(product.stock) < 1;

                return (
                  <article
                    key={product.id}
                    className="group overflow-hidden rounded-3xl border border-stone-200/80 bg-white transition duration-300 hover:-translate-y-1 hover:border-stone-300 hover:shadow-xl hover:shadow-stone-200/50"
                  >
                    <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#f1f3ee]">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-[#64836c]">
                          <Package size={66} strokeWidth={1.1} />
                          <span className="text-xs font-semibold uppercase tracking-widest">
                            JandaStore
                          </span>
                        </div>
                      )}

                      <span
                        className={`absolute left-3 top-3 rounded-full px-3 py-1.5 text-[11px] font-bold ${
                          outOfStock
                            ? "bg-red-100 text-red-700"
                            : "bg-white/90 text-[#24583b]"
                        }`}
                      >
                        {outOfStock ? "Out of stock" : "Available"}
                      </span>
                    </div>

                    <div className="p-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                        Product #{product.id}
                      </p>
                      <h3 className="mt-2 line-clamp-1 text-lg font-bold">
                        {product.name}
                      </h3>
                      <p className="mt-2 min-h-10 line-clamp-2 text-sm leading-5 text-stone-500">
                        {product.description ||
                          "Discover this product at JandaStore."}
                      </p>

                      <div className="mt-5 flex items-end justify-between gap-2">
                        <div>
                          <p className="text-xs text-stone-400">Price</p>
                          <p className="mt-1 text-xl font-black tracking-tight text-[#24583b]">
                            {formatPrice(product.price)}
                          </p>
                        </div>
                        <p className="text-xs text-stone-500">
                          {product.stock} in stock
                        </p>
                      </div>

                      <button
                        onClick={() => addToCart(product)}
                        disabled={outOfStock}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#173d2b] px-4 py-3.5 text-sm font-bold text-white hover:bg-[#24583b] disabled:cursor-not-allowed disabled:bg-stone-300"
                      >
                        <ShoppingBag size={17} />
                        {outOfStock ? "Unavailable" : "Add to cart"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#173d2b] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-xl font-black">
              JandaStore<span className="text-[#a7d5b2]">.</span>
            </p>
            <p className="mt-1 text-sm text-white/65">
              A simpler way to discover what you need.
            </p>
          </div>
          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} JandaStore. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-40">
          <button
            aria-label="Close cart"
            onClick={() => setCartOpen(false)}
            className="absolute inset-0 h-full w-full bg-black/40 backdrop-blur-[2px]"
          />

          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-5">
              <div>
                <h2 className="text-xl font-black">Your cart</h2>
                <p className="mt-1 text-xs text-stone-500">
                  {cartCount} item{cartCount === 1 ? "" : "s"} selected
                </p>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                aria-label="Close cart"
                className="rounded-full bg-stone-100 p-2.5 hover:bg-stone-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <span className="rounded-2xl bg-stone-100 p-5 text-stone-400">
                    <ShoppingBag size={36} />
                  </span>
                  <h3 className="mt-5 text-lg font-bold">
                    Your cart is empty
                  </h3>
                  <p className="mt-2 text-sm text-stone-500">
                    Add a few products and they will appear here.
                  </p>
                  <button
                    onClick={() => setCartOpen(false)}
                    className="mt-5 rounded-full bg-[#173d2b] px-5 py-3 text-sm font-bold text-white"
                  >
                    Continue shopping
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 rounded-2xl border border-stone-200 p-3"
                  >
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f1f3ee] text-[#64836c]">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package size={32} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-2 text-sm font-bold">
                          {item.name}
                        </h3>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          aria-label={`Remove ${item.name}`}
                          className="text-stone-400 hover:text-red-600"
                        >
                          <X size={17} />
                        </button>
                      </div>

                      <p className="mt-1 text-sm font-bold text-[#31734c]">
                        {formatPrice(item.price)}
                      </p>

                      <div className="mt-2 flex items-center gap-3">
                        <button
                          onClick={() => changeQuantity(item.id, -1)}
                          className="rounded-lg border border-stone-200 p-1.5 hover:bg-stone-100"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="min-w-4 text-center text-sm font-bold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => changeQuantity(item.id, 1)}
                          disabled={item.quantity >= item.stock}
                          className="rounded-lg border border-stone-200 p-1.5 hover:bg-stone-100 disabled:opacity-40"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-stone-200 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stone-500">Subtotal</span>
                  <span className="text-xl font-black">
                    {formatPrice(subtotal)}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-stone-500">
                  Delivery and final order details will be confirmed at checkout.
                </p>
                <button
                  onClick={handleCheckout}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#173d2b] px-4 py-4 text-sm font-bold text-white hover:bg-[#24583b]"
                >
                  Continue to checkout <ArrowRight size={18} />
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Register and Login */}
      {authOpen && (
        <Auth
          onClose={() => setAuthOpen(false)}
          onSuccess={() => setAuthOpen(false)}
        />
      )}
    </div>
  );
}

export default App;