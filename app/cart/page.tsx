"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Trash2, Phone, X } from "lucide-react";
import { useRouter } from "next/navigation";

type CartItem = {
  id: number;
  label: string;
  price: number;
  quantity: number;
  total: number;
  unit: string;      // "kg" | "piece" | "dozen" | "liter" | ...
  category: string;
};

type ToastState = {
  show: boolean;
  type: "success" | "error";
  msg: string;
};

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [toast, setToast] = useState<ToastState>({
    show: false,
    type: "success",
    msg: "",
  });

  const router = useRouter();
  const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  // ---------- helpers ----------

  function showToast(type: "success" | "error", msg: string) {
    setToast({ show: true, type, msg });
    setTimeout(() => setToast({ show: false, type, msg: "" }), 2000);
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(saved);
  }, []);

  function syncCart(updated: CartItem[]) {
    setCart(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("cart", JSON.stringify(updated));
    }
  }

  function getDisplayUnit(unit: string): string {
    if (unit === "kg") return "kg";
    if (unit === "piece") return "pcs";
    if (unit === "dozen") return "dozen";
    if (unit === "liter") return "L";
    return unit;
  }

  function normalizeQuantityForUnit(unit: string, raw: number): number {
    if (isNaN(raw) || raw < 0) raw = 0;

    if (unit === "kg") {
      return Number(raw.toFixed(3));
    }

    // for dozen we still treat quantity as "count", but user changes by 1 dozen (12)
    if (unit === "dozen") {
      return Math.round(raw);
    }

    // piece, liter, etc. → whole numbers
    return Math.round(raw);
  }

  function updateQuantity(productId: number, newQty: number) {
    const updated = cart.map((item) => {
      if (item.id === productId) {
        const normalized = normalizeQuantityForUnit(item.unit, newQty);
        return {
          ...item,
          quantity: normalized,
          total: Number((normalized * item.price).toFixed(2)),
        };
      }
      return item;
    });
    syncCart(updated);
  }

  function removeItem(id: number) {
    const updated = cart.filter((item) => item.id !== id);
    syncCart(updated);
    showToast("success", "Item removed from cart");
  }

  function clearAllItems() {
    syncCart([]);
    setShowClearAllModal(false);
    showToast("success", "All items removed from cart");
  }

  // Format quantity for WhatsApp text
  function formatQuantity(item: CartItem): string {
    const unitLabel = getDisplayUnit(item.unit);

    if (item.unit === "dozen") {
      // assume quantity here is "dozens"
      return `${item.quantity} dozen`;
    }

    return `${item.quantity} ${unitLabel}`;
  }

  const grandTotal = cart.reduce(
    (sum, item) => sum + Number(item.total ?? 0),
    0
  );
  const grandTotalDisplay = grandTotal.toFixed(2);

  function sendWhatsappOrder() {
    if (!customerName.trim()) {
      showToast("error", "Please enter your name");
      return;
    }

    if (cart.length === 0) {
      showToast("error", "Cart is empty");
      return;
    }

    let text = `🍗 VK Proteins Order\n\n`;
    text += `👤 Customer Name: ${customerName}\n`;
    text += `📅 Date: ${new Date().toLocaleDateString("en-IN")}\n`;
    text += `⏰ Time: ${new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    })}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    cart.forEach((item, index) => {
      const unitDisplay = getDisplayUnit(item.unit);
      text += `${index + 1}. ${item.label}\n`;
      text += `   Quantity: ${formatQuantity(item)}\n`;
      text += `   Price: ₹${item.price}/${unitDisplay}\n`;
      text += `   Total: ₹${item.total.toFixed(2)}\n\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 Grand Total: ₹${grandTotalDisplay}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `Thank you! 🐔 Please confirm delivery address and time.\n`;
    const encoded = encodeURIComponent(text);
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
    window.open(url, "_blank");
  }

  // ---------- UI ----------

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-yellow-50">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-yellow-500 text-white shadow-xl p-6 flex justify-between items-center">
        <button
          onClick={() => router.push("/user")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-6 h-6" />
          <span className="font-semibold text-sm">Back</span>
        </button>
        <h1 className="text-2xl font-bold">
          Your Cart ({cart.length} items)
        </h1>
        <div className="w-6" />
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        {/* CLEAR ALL BUTTON */}
        {cart.length > 0 && (
          <div className="flex justify-end">
            <button
              onClick={() => setShowClearAllModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow"
            >
              <X className="w-4 h-4" />
              Clear All Items
            </button>
          </div>
        )}

        {cart.length === 0 ? (
          <div className="text-center text-gray-600 py-20 text-lg">
            Your cart is empty.
            <button
              onClick={() => router.push("/user")}
              className="mt-4 block mx-auto px-6 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            {cart.map((item) => {
              const unitLabel = getDisplayUnit(item.unit);

              return (
                <div
                  key={item.id}
                  className="bg-white p-6 rounded-3xl shadow-lg space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold">{item.label}</h2>
                      <p className="text-sm text-gray-500 capitalize">
                        {item.category} • {unitLabel}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Quantity Selector */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        const step =
                          item.unit === "kg"
                            ? 0.25
                            : item.unit === "dozen"
                            ? 1
                            : 1;
                        const newQty = item.quantity - step;
                        updateQuantity(item.id, newQty);
                      }}
                      className="px-3 py-2 bg-gray-200 rounded-xl text-lg font-bold text-gray-700"
                    >
                      –
                    </button>

                    <input
                      type="number"
                      step={
                        item.unit === "kg"
                          ? "0.001"
                          : item.unit === "dozen"
                          ? "1"
                          : "1"
                      }
                      min="0"
                      value={item.quantity}
                      onChange={(e) => {
                        const raw = parseFloat(e.target.value);
                        updateQuantity(item.id, isNaN(raw) ? 0 : raw);
                      }}
                      className="w-24 text-center px-3 py-2 border-2 rounded-xl bg-gray-50 text-gray-800 font-semibold"
                    />

                    <button
                      onClick={() => {
                        const step =
                          item.unit === "kg"
                            ? 0.25
                            : item.unit === "dozen"
                            ? 1
                            : 1;
                        const newQty = item.quantity + step;
                        updateQuantity(item.id, newQty);
                      }}
                      className="px-3 py-2 bg-gray-200 rounded-xl text-lg font-bold text-gray-700"
                    >
                      +
                    </button>

                    <span className="font-medium text-gray-700">
                      {unitLabel}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-4">
                    <div>
                      <span className="text-lg font-semibold text-gray-700">
                        Price: ₹{item.price} / {unitLabel}
                      </span>
                      <div className="text-sm text-gray-500">
                        Total: {formatQuantity(item)}
                      </div>
                    </div>
                    <span className="text-xl font-bold text-pink-600">
                      ₹{item.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* NAME INPUT & TOTAL SECTION */}
            <div className="bg-white rounded-3xl p-6 shadow-xl space-y-4">
              <label className="text-gray-700 font-semibold">Your Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl"
              />
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-6 text-center space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Grand Total</h3>
                <span className="text-sm text-gray-500">
                  {cart.length} item{cart.length !== 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-3xl font-bold text-green-600">
                ₹{grandTotalDisplay}
              </p>

              <button
                onClick={sendWhatsappOrder}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 shadow"
              >
                <Phone className="w-6 h-6" />
                Send Order on WhatsApp
              </button>
            </div>
          </>
        )}
      </div>

      {/* CLEAR ALL MODAL */}
      {showClearAllModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">Clear All Items?</h2>
            <p className="mb-6 text-gray-700">
              Are you sure you want to remove all {cart.length} items from your
              cart?
            </p>
            <div className="flex gap-3">
              <button
                onClick={clearAllItems}
                className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold"
              >
                Yes, Clear All
              </button>
              <button
                onClick={() => setShowClearAllModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-lg text-white flex items-center gap-2 ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          <span className="font-medium text-sm">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
