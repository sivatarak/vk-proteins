"use client";

import { useEffect, useState } from "react";
import { LogOut, ShoppingBag, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";

type Product = {
  id: number;
  label: string | null;
  name: string;
  category: string;
  unit: string;
  pricePerUnit: number;
  isActive: boolean;
};

type ToastState = {
  show: boolean;
  type: "success" | "error";
  msg: string;
};

export default function UserClient({ products }: { products: Product[] }) {


  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [cartCount, setCartCount] = useState(0);

  const [toast, setToast] = useState<ToastState>({
    show: false,
    type: "success",
    msg: "",
  });

  const router = useRouter();

  function showToast(type: "success" | "error", msg: string) {
    setToast({ show: true, type, msg });
    setTimeout(() => setToast({ show: false, type, msg: "" }), 2000);
  }

  function loadCartCount() {
    if (typeof window === "undefined") return;
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartCount(cart.length);
  }

  useEffect(() => {
    loadCartCount();
  }, []);

  function setDecimalQuantity(productId: number, value: number) {
    setQuantities((prev) => ({
      ...prev,
      [productId]: value,
    }));
  }

  function getTotalPrice(product: Product) {
    const q = quantities[product.id] || 0.25;
    return (q * product.pricePerUnit).toFixed(2);
  }

  // ADD TO CART (overwrite same product)
  function addToCart(product: Product) {
    const qty = quantities[product.id] || 0.25;

    if (qty <= 0) {
      showToast("error", "Quantity must be greater than 0");
      return;
    }

    const item = {
      id: product.id,
      label: product.label ?? "",
      price: product.pricePerUnit,
      quantity: qty,
      total: Number((qty * product.pricePerUnit).toFixed(2)),
      unit: product.unit,
      category: product.category,
    };

    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const index = cart.findIndex((x: any) => x.id === product.id);

    if (index >= 0) {
      cart[index] = item;
    } else {
      cart.push(item);
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    setCartCount(cart.length);

    showToast("success", `${item.label} (${qty} kg) added to cart`);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  function getCategoryImage(category: string) {
    switch (category) {
      case "boiler":
        return "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=800&q=80";
      case "layer":
        return "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=800&q=80";
      case "egg":
        return "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=800&q=80";
      default:
        return "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800&q=80";
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 px-3 sm:px-2">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-yellow-500 text-white shadow-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 sm:py-6 flex justify-between items-center">

          <div className="flex items-center gap-2 sm:gap-3">
            <img
              src="/Vk_protein_logo.jpg"
              className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl object-cover shadow-md border"
            />

            <div>
              <h1 className="hidden sm:block text-2xl font-bold">VK Proteins</h1>

              {/* Smaller text on mobile */}
              <h1 className="sm:hidden text-base font-semibold leading-tight text-center w-full">
                Fresh & Quality <br />
                Products
              </h1>


              <p className="hidden sm:block text-sm opacity-90">
                Fresh & Quality Products
              </p>
            </div>
          </div>

          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={() => router.push("/cart")}
              className="flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-4 sm:py-2 
                   bg-white/20 hover:bg-white/30 rounded-lg sm:rounded-xl 
                   border border-white/30 shadow text-xs sm:text-sm"
            >
              <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="ml-1 bg-red-500 text-white text-[10px] sm:text-xs px-1.5 py-[1px] rounded-full">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-4 sm:py-2 
                   bg-white/20 hover:bg-white/30 rounded-lg sm:rounded-xl 
                   border border-white/30 shadow text-xs sm:text-sm"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>


      {/* MAIN */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-2">
          <ShoppingBag className="w-8 h-8 text-pink-600" />
          Available Products
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition"
            >
              <div className="relative h-56">
                <img
                  src={getCategoryImage(product.category)}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 w-full bg-black/40 px-4 py-3">
                  <h3 className="text-xl font-bold text-white">
                    {product.label ?? ""}
                  </h3>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <span className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 text-transparent bg-clip-text">
                    ₹{product.pricePerUnit}
                  </span>
                  <span className="ml-2 text-gray-600">/ {product.unit}</span>
                </div>

                {/* Quantity Selector */}
                {/* Quantity Selector */}
                <div className="flex items-center gap-3 mt-2">
                  {/* Minus Button */}
                  <button
                    onClick={() => {
                      const current = quantities[product.id] ?? 0.25;
                      let newQty = current;

                      // Free-hand: Step size only for + / -
                      if (product.unit === "kg") newQty -= 0.25;
                      else newQty -= 1;

                      if (newQty < 0) newQty = 0;

                      setDecimalQuantity(product.id, Number(newQty.toFixed(3)));
                    }}
                    className="px-3 py-2 bg-gray-200 rounded-xl text-lg font-bold text-gray-700"
                  >
                    –
                  </button>

                  {/* Free-Hand Dynamic Input */}
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={quantities[product.id] ?? 0.25}
                    onChange={(e) => {
                      let value = parseFloat(e.target.value);

                      // If empty or invalid → default to 0
                      if (isNaN(value) || value < 0) value = 0;

                      setDecimalQuantity(product.id, Number(value.toFixed(3)));
                    }}
                    className="w-24 text-center px-3 py-2 border-2 rounded-xl bg-gray-50 text-gray-800 font-semibold"
                  />

                  {/* Plus Button */}
                  <button
                    onClick={() => {
                      const current = quantities[product.id] ?? 0.25;
                      let newQty = current;

                      // Free-hand: Step size only for + / -
                      if (product.unit === "kg") newQty += 0.25;
                      else newQty += 1;

                      setDecimalQuantity(product.id, Number(newQty.toFixed(3)));
                    }}
                    className="px-3 py-2 bg-gray-200 rounded-xl text-lg font-bold text-gray-700"
                  >
                    +
                  </button>

                  <span className="font-medium text-gray-700">
                    {product.unit === "kg" ? "kg" : "pcs"}
                  </span>
                </div>


                <div className="text-lg font-semibold text-gray-800">
                  Total Price:
                  <span className="text-pink-600 ml-2">
                    ₹{getTotalPrice(product)}
                  </span>
                </div>

                <button
                  onClick={() => addToCart(product)}
                  className="w-full bg-gradient-to-r from-pink-600 to-orange-600 text-white py-3 rounded-xl font-bold shadow hover:shadow-lg active:scale-95 transition"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>

        {toast.show && (
          <div
            className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-lg text-white flex items-center gap-2 ${toast.type === "success"
              ? "bg-green-600"
              : "bg-red-600"
              }`}
          >
            <span className="font-medium text-sm">{toast.msg}</span>
          </div>
        )}

        <p className="text-center mt-12 text-gray-600">
          © 2025 VK Proteins • Freshness Delivered Daily
        </p>
      </div>
    </div>
  );
}
