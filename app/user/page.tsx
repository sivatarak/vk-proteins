"use client";

import { useEffect, useState } from "react";
import { ShoppingBag, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getProductImage } from "../utils/productImage";

// Types
type Product = {
  id: number;
  label: string | null;
  category: { id: number; label: string; value: string; unit: string };
  pricePerUnit: number;
};

type ToastState = {
  show: boolean;
  type: "success" | "error";
  msg: string;
};

// ────────────────────────────────
// MAIN COMPONENT
// ────────────────────────────────
export default function UserPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [cartCount, setCartCount] = useState(0);
  const [toast, setToast] = useState<ToastState>({ show: false, type: "success", msg: "" });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Auto user ID
  useEffect(() => {
    if (!localStorage.getItem("userId")) {
      localStorage.setItem("userId", "guest-" + Date.now());
    }
  }, []);

  // Load products
  useEffect(() => {
    // First check localStorage for pre-fetched products
    
    // Fallback to fetch if no cache
    setLoading(true);

    // Optimized fetch with cache
    fetch("/api/products", {
      cache: 'force-cache',
      headers: {
        'Cache-Control': 'max-age=30'
      }
    })
      .then(r => {
        if (!r.ok) throw new Error("Failed to fetch");
        return r.json();
      })
      .then(data => {
        setProducts(data);
        // Cache for future use
        localStorage.setItem("cachedProducts", JSON.stringify(data));
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setLoading(false);
        // You could show an error message here
      });

    // Load cart from localStorage
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartCount(cart.length);
  }, []);

  const showToast = (msg: string) => {
    setToast({ show: true, type: "success", msg });
    setTimeout(() => setToast({ show: false, type: "success", msg: "" }), 2500);
  };

  const getDisplayUnit = (unit: string) => (unit === "kg" ? "kg" : unit === "piece" ? "pcs" : unit);
  const getStep = (unit: string) => (unit === "kg" ? 0.25 : unit === "dozen" ? 12 : 1);

  // In getTotalPrice and addToCart, change default to 0 if quantity is 0
  const getTotalPrice = (p: Product) => {
    const q = quantities[p.id] ?? 0;
    return (q * p.pricePerUnit).toFixed(2);
  };

  // Prevent adding to cart if quantity is 0 or empty
  const addToCart = async (product: Product) => {
    const qty = quantities[product.id] ?? 0;
    if (qty <= 0) {
      showToast("Please select a quantity");
      return;
    }

    setActionLoading(product.id);
    try {
      const item = {
        id: product.id,
        label: product.label || product.category.label,
        price: product.pricePerUnit,
        quantity: qty,
        total: Number((qty * product.pricePerUnit).toFixed(2)),
        unit: product.category.unit,
        category: product.category.value,
        image: getProductImage(product),
      };

      let cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const existing = cart.findIndex((i: any) => i.id === product.id);
      if (existing >= 0) cart[existing] = item;
      else cart.push(item);

      localStorage.setItem("cart", JSON.stringify(cart));
      setCartCount(cart.length);
      showToast(`${item.label} added to cart`);
    } finally {
      setActionLoading(null);
    }
  };

  const LoadingSpinner = () => (
    <div className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
  );

  const handleQuantityChange = (id: number, value: string, step: number) => {
    let num = parseFloat(value);
    if (isNaN(num) || num < step) {
      num = step;
    }
    // Round to nearest multiple of step if needed, but for simplicity, allow any >= min
    setQuantities({ ...quantities, [id]: num });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 px-3 sm:px-4">
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-3xl shadow-2xl">
            <div className="w-16 h-16 border-4 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-xl font-bold">Loading...</p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-gradient-to-r from-orange-600 via-pink-600 to-yellow-500 text-white shadow-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image
              src="/VK_proteins.png"  // ← No /public, no backslashes, exact filename case
              alt="VK Proteins"
              width={48}
              height={48}
              className="w-12 h-12 rounded-xl border-2 border-white bg-white shadow"
              priority
            />
            <div>
              <h1 className="text-xl font-bold">VK Proteins</h1>
              <p className="text-sm opacity-90">Fresh & Quality Products</p>
            </div>
          </div>

          <button
            onClick={() => router.push("/cart")}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl border border-white/30 shadow"
          >
            <ShoppingCart className="w-5 h-5" />
            Cart
            {cartCount > 0 && (
              <span className="ml-1 bg-red-600 px-2 py-0.5 rounded-full text-xs">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* PRODUCTS GRID */}
      <div className="max-w-7xl mx-auto px-3 py-10">
        <h2 className="text-3xl font-bold mb-8 flex items-center gap-2 text-gray-800">
          <ShoppingBag className="w-8 h-8 text-pink-600" />
          Available Products
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((p) => {
            const step = getStep(p.category.unit);
            return (
              <div key={p.id} className="bg-white rounded-3xl shadow-lg overflow-hidden">
                {/* Product Image */}
                <div className="h-56 relative">
                  <Image
                    src={getProductImage(p)}
                    alt={p.label || p.category.label}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 400px"
                    priority
                    placeholder="blur"
                    blurDataURL="data:image/webp;base64,UklGRh4AAABXRUJQVlA4WA=="
                  />

                  {/* Title Overlay */}
                  <div className="absolute bottom-0 bg-black/40 text-white px-4 py-3 w-full">
                    <h3 className="text-xl font-bold">{p.label || p.category.label}</h3>
                    <p className="text-sm opacity-90">{p.category.unit}</p>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4">
                  <div className="text-3xl font-bold text-green-600">
                    ₹{p.pricePerUnit}/<span className="text-lg text-gray-600">{getDisplayUnit(p.category.unit)}</span>
                  </div>

                  {/* Quantity Selector - Your Preferred Design + Full 0 Support & Auto Delete */}
                  {/* Final Quantity Selector - Empty when 0 or deleted */}
                  <div className="flex items-center justify-center gap-6 bg-gradient-to-r from-pink-50 to-orange-50 rounded-3xl p-5 shadow-inner">
                    {/* Minus Button */}
                    <button
                      onClick={() => {
                        const step = getStep(p.category.unit);
                        const current = quantities[p.id] ?? 0;
                        const newQty = Math.max(0, current - step);

                        if (newQty === 0) {
                          // Delete entry → input will show empty
                          const { [p.id]: _, ...rest } = quantities;
                          setQuantities(rest);
                        } else {
                          setQuantities({ ...quantities, [p.id]: newQty });
                        }
                      }}
                      className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center text-3xl font-light text-gray-600 hover:bg-gray-100 active:scale-90 transition-all"
                    >
                      −
                    </button>

                    {/* Quantity Input - Shows empty when no value */}
                    <div className="flex flex-col items-center">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        value={quantities[p.id] ?? ""}  // Empty string when no quantity
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          let value = parseFloat(inputValue);

                          // If empty, NaN, negative, or exactly "0" after parsing → delete it
                          if (inputValue === "" || isNaN(value) || value < 0 || value === 0) {
                            const { [p.id]: _, ...rest } = quantities;
                            setQuantities(rest);
                          } else {
                            // Round to 2 decimal places
                            value = Math.round(value * 100) / 100;
                            setQuantities({ ...quantities, [p.id]: value });
                          }
                        }}
                        className="w-32 text-center text-4xl font-bold text-gray-800 bg-transparent outline-none placeholder-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
                        placeholder="0"  // Shows faint "0" only when empty
                      />
                      <span className="text-lg font-medium text-gray-600 mt-2">
                        {getDisplayUnit(p.category.unit)}
                      </span>
                    </div>

                    {/* Plus Button */}
                    <button
                      onClick={() => {
                        const step = getStep(p.category.unit);
                        const current = quantities[p.id] ?? 0;
                        const newQty = current + step;
                        setQuantities({ ...quantities, [p.id]: newQty });
                      }}
                      className="w-14 h-14 rounded-full bg-gradient-to-r from-pink-600 to-orange-600 shadow-xl flex items-center justify-center text-3xl font-light text-white hover:from-pink-700 hover:to-orange-700 active:scale-90 transition-all"
                    >
                      +
                    </button>
                  </div>

                  {/* Total Price */}
                  <div className="text-lg font-semibold text-gray-800">
                    Total: <span className="text-pink-600 text-xl">₹{getTotalPrice(p)}</span>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => addToCart(p)}
                    disabled={actionLoading === p.id}
                    className="w-full py-3 bg-gradient-to-r from-pink-600 to-orange-600 text-white rounded-xl font-bold shadow hover:shadow-lg active:scale-95 transition disabled:opacity-70"
                  >
                    {actionLoading === p.id ? (
                      <span className="flex items-center justify-center gap-3">
                        <LoadingSpinner /> Adding...
                      </span>
                    ) : (
                      "Add to Cart"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Toast */}
        {toast.show && (
          <div className="fixed bottom-6 right-6 px-6 py-4 bg-green-600 text-white rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-pulse">
            <span className="text-2xl">✅</span>
            <span className="font-bold">{toast.msg}</span>
          </div>
        )}
      </div>
    </div>
  );
}