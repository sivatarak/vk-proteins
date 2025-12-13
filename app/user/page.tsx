// src/app/page.tsx (or wherever your UserPage is)
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
  // In your useEffect - REPLACE THE FETCH PART
  useEffect(() => {
    setLoading(true);

    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log("⚠️ Fetch taking too long, showing partial data");
        setLoading(false);
      }
    }, 3000);

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
        clearTimeout(timeoutId);
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        clearTimeout(timeoutId);
        console.error("Fetch error:", err);
        setLoading(false);
        // You could show an error message here
      });

    // Load cart from localStorage
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartCount(cart.length);

    return () => clearTimeout(timeoutId);
  }, []);

  const showToast = (msg: string) => {
    setToast({ show: true, type: "success", msg });
    setTimeout(() => setToast({ show: false, type: "success", msg: "" }), 2500);
  };

  const getStep = (unit: string) => (unit === "kg" ? 0.25 : unit === "dozen" ? 12 : 1);
  const getDisplayUnit = (unit: string) => (unit === "kg" ? "kg" : unit === "piece" ? "pcs" : unit);

  const getTotalPrice = (p: Product) => {
    const q = quantities[p.id] || getStep(p.category.unit);
    return (q * p.pricePerUnit).toFixed(2);
  };

  const addToCart = async (product: Product) => {
    const qty = quantities[product.id] || getStep(product.category.unit);
    if (qty <= 0) return;

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
              src="/Vk_protein_logo.jpg"
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
          {products.map((p) => (
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

                {/* Quantity Selector */}
                <div className="flex items-center gap-4">
                  <button
                    className="px-3 py-2 bg-gray-200 rounded-xl text-xl"
                    onClick={() => {
                      const step = getStep(p.category.unit);
                      const curr = quantities[p.id] || step;
                      setQuantities({ ...quantities, [p.id]: Math.max(0, curr - step) });
                    }}
                  >
                    −
                  </button>

                  <input
                    type="number"
                    className="w-20 px-3 py-2 text-center border rounded-xl bg-gray-50 text-lg font-medium"
                    value={quantities[p.id] || getStep(p.category.unit)}
                    step={getStep(p.category.unit)}
                    onChange={(e) =>
                      setQuantities({
                        ...quantities,
                        [p.id]: parseFloat(e.target.value) || getStep(p.category.unit),
                      })
                    }
                  />

                  <button
                    className="px-3 py-2 bg-gray-200 rounded-xl text-xl"
                    onClick={() => {
                      const step = getStep(p.category.unit);
                      const curr = quantities[p.id] || step;
                      setQuantities({ ...quantities, [p.id]: curr + step });
                    }}
                  >
                    +
                  </button>

                  <span className="text-lg">{getDisplayUnit(p.category.unit)}</span>
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
          ))}
        </div>

        {/* Toast */}
        {toast.show && (
          <div className="fixed bottom-6 right-6 px-6 py-4 bg-green-600 text-white rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-pulse">
            <span className="text-2xl">Checkmark</span>
            <span className="font-bold">{toast.msg}</span>
          </div>
        )}
      </div>
    </div>
  );
}