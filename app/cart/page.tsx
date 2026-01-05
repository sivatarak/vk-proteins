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
  unit: string;
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
  const [toast, setToast] = useState<ToastState>({ show: false, type: "success", msg: "" });

  const router = useRouter();
  const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  // ---------- helpers ----------
  function showToast(type: "success" | "error", msg: string) {
    setToast({ show: true, type, msg });
    setTimeout(() => setToast({ show: false, type, msg: "" }), 2500);
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(saved);
  }, []);

  function syncCart(updated: CartItem[]) {
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  }

  function getDisplayUnit(unit: string): string {
    return unit === "kg" ? "kg" : unit === "piece" ? "pcs" : unit === "dozen" ? "dozen" : unit;
  }

  function getStep(unit: string): number {
    return unit === "kg" ? 0.25 : unit === "dozen" ? 1 : 1;
  }

  function updateQuantity(id: number, newValue: string | number) {
    let qty = typeof newValue === "string" ? parseFloat(newValue) : newValue;

    if (isNaN(qty) || qty < 0) {
      // Remove item if quantity is 0 or invalid
      const updated = cart.filter((item) => item.id !== id);
      syncCart(updated);
      showToast("success", "Item removed");
      return;
    }

    // Round appropriately
    if (cart.find(item => item.id === id)?.unit === "kg") qty = Math.round(qty * 100) / 100;

    const updated = cart.map((item) =>
      item.id === id
        ? { ...item, quantity: qty, total: Number((qty * item.price).toFixed(2)) }
        : item
    );
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
    showToast("success", "Cart cleared");
  }

  function formatQuantity(item: CartItem): string {
    const unitLabel = getDisplayUnit(item.unit);
    return `${item.quantity} ${unitLabel}`;
  }

  const grandTotal = cart.reduce((sum, item) => sum + item.total, 0);
  const grandTotalDisplay = grandTotal.toFixed(2);

  function sendWhatsappOrder() {
    if (!customerName.trim()) {
      showToast("error", "Please enter your name");
      return;
    }
    if (cart.length === 0) {
      showToast("error", "Your cart is empty");
      return;
    }

    let text = `🍗 VK Proteins Order\n\n`;
    text += `👤 Customer: ${customerName}\n`;
    text += `📅 ${new Date().toLocaleDateString("en-IN")} • ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}\n\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    cart.forEach((item, i) => {
      text += `${i + 1}. ${item.label}\n`;
      text += `   ${formatQuantity(item)} × ₹${item.price} = ₹${item.total.toFixed(2)}\n\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 Grand Total: ₹${grandTotalDisplay}\n\n`;
    text += `Thank you for choosing VK Proteins! 🐔\nPlease confirm delivery details.`;

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50 pb-10">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-orange-600 via-pink-600 to-yellow-500 text-white shadow-2xl">
        <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
          <button onClick={() => router.push("/user")} className="flex items-center gap-3 hover:opacity-90">
            <ArrowLeft className="w-7 h-7" />
            <span className="font-bold">Back</span>
          </button>
          <h1 className="text-2xl font-extrabold">Your Cart ({cart.length})</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Clear All */}
        {cart.length > 0 && (
          <div className="flex justify-end">
            <button
              onClick={() => setShowClearAllModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-lg font-medium transition"
            >
              <Trash2 className="w-5 h-5" />
              Clear All
            </button>
          </div>
        )}

        {/* Empty Cart */}
        {cart.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-6 opacity-30">🛒</div>
            <p className="text-xl text-gray-600 mb-8">Your cart is empty</p>
            <button
              onClick={() => router.push("/user")}
              className="px-8 py-4 bg-gradient-to-r from-pink-600 to-orange-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            {cart.map((item) => {
              const step = getStep(item.unit);
              const currentQty = item.quantity;

              return (
                <div key={item.id} className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                  <div className="p-6 space-y-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">{item.label}</h2>
                        <p className="text-gray-500 capitalize">{item.category}</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-700 p-2"
                      >
                        <Trash2 className="w-7 h-7" />
                      </button>
                    </div>

                    {/* Quantity Selector - Matches User Page Style */}
                    <div className="flex items-center justify-center gap-6 bg-gradient-to-r from-pink-50 to-orange-50 rounded-3xl p-6 shadow-inner">
                      <button
                        onClick={() => updateQuantity(item.id, currentQty - step)}
                        className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center text-3xl font-light text-gray-600 hover:bg-gray-100 active:scale-90 transition"
                      >
                        −
                      </button>

                      <div className="flex flex-col items-center">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={currentQty > 0 ? currentQty : ""}
                          onChange={(e) => updateQuantity(item.id, e.target.value)}
                          placeholder="0"
                          className="w-32 text-center text-4xl font-bold text-gray-800 bg-transparent outline-none placeholder-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:hidden [&::-webkit-inner-spin-button]:hidden"
                        />
                        <span className="text-lg font-medium text-gray-600 mt-2">
                          {getDisplayUnit(item.unit)}
                        </span>
                      </div>

                      <button
                        onClick={() => updateQuantity(item.id, currentQty + step)}
                        className="w-14 h-14 rounded-full bg-gradient-to-r from-pink-600 to-orange-600 shadow-xl flex items-center justify-center text-3xl font-light text-white hover:from-pink-700 hover:to-orange-700 active:scale-90 transition"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t-2 border-dashed border-pink-100">
                      <div>
                        <p className="text-gray-600">Price per unit</p>
                        <p className="text-xl font-bold">₹{item.price}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-600">Item Total</p>
                        <p className="text-3xl font-extrabold text-pink-600">₹{item.total.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Customer Name */}
            <div className="bg-white rounded-3xl shadow-2xl p-6">
              <label className="block text-lg font-bold text-gray-700 mb-3">Your Name</label>
              <input
                type="text"
                placeholder="Enter your name for the order"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-6 py-4 text-lg border-2 border-pink-200 rounded-2xl focus:border-pink-500 focus:outline-none transition"
              />
            </div>

            {/* Grand Total & WhatsApp Button */}
            <div className="bg-gradient-to-r from-pink-600 to-orange-600 rounded-3xl shadow-2xl p-8 text-white text-center">
              <p className="text-xl mb-2 opacity-90">{cart.length} item{cart.length > 1 ? "s" : ""}</p>
              <p className="text-5xl font-extrabold mb-6 drop-shadow-lg">₹{grandTotalDisplay}</p>

              <button
                onClick={sendWhatsappOrder}
                className="w-full bg-white text-pink-600 py-5 rounded-2xl font-extrabold text-2xl shadow-xl hover:shadow-2xl active:scale-95 transition flex items-center justify-center gap-4"
              >
                <Phone className="w-8 h-8" />
                Send Order on WhatsApp
              </button>
            </div>
          </>
        )}
      </div>

      {/* Clear All Modal */}
      {showClearAllModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Clear Cart?</h2>
            <p className="text-gray-700 mb-8">Remove all {cart.length} items permanently?</p>
            <div className="flex gap-4">
              <button
                onClick={clearAllItems}
                className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-bold hover:bg-red-700 transition"
              >
                Yes, Clear All
              </button>
              <button
                onClick={() => setShowClearAllModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-4 rounded-2xl font-bold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.show && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl shadow-2xl text-white font-bold flex items-center gap-3 z-50 animate-pulse ${
          toast.type === "success" ? "bg-green-600" : "bg-red-600"
        }`}>
          <span>✅</span>
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}