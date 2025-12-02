"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Trash2, CheckCircle, Phone } from "lucide-react";
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
    const [toast, setToast] = useState<ToastState>({
        show: false,
        type: "success",
        msg: "",
    });

    const router = useRouter();

    // TODO: put your real WhatsApp number here: 91XXXXXXXXXX (NO + sign)
    const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

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
    function updateQuantity(productId: number, newQty: number) {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");

        const index = cart.findIndex((item: any) => item.id === productId);

        if (index >= 0) {
            cart[index].quantity = newQty;
            cart[index].total = Number((newQty * cart[index].price).toFixed(2));
        }

        localStorage.setItem("cart", JSON.stringify(cart));
        setCart(cart); // rerender cart UI
    }



    function removeItem(id: number) {
        const updated = cart.filter((item) => item.id !== id);
        syncCart(updated);
        showToast("success", "Item removed from cart");
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

        let text = `VK Proteins Order\n\n`;
        text += `Name: ${customerName}\n`;
        text += `--------------------------\n`;

        cart.forEach((item, index) => {
            text += `${index + 1}) ${item.label} - ${item.quantity} kg\n`;
            text += `Price: ₹${item.price} × ${item.quantity} = ₹${item.total}\n\n`;
        });

        text += `--------------------------\n`;
        text += `Grand Total: ₹${grandTotal}\n`;
        text += `--------------------------\n`;
        text += `Thank you! Please confirm delivery time.\n`;

        const encoded = encodeURIComponent(text);
        const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
        window.open(url, "_blank");
    }

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
                <h1 className="text-2xl font-bold">Your Cart</h1>
                <div className="w-6" />
            </div>

            <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
                {cart.length === 0 ? (
                    <div className="text-center text-gray-600 py-20 text-lg">
                        Your cart is empty.
                    </div>
                ) : (
                    cart.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white p-6 rounded-3xl shadow-lg space-y-4"
                        >
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold">{item.label}</h2>
                                <button
                                    onClick={() => removeItem(item.id)}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    <Trash2 className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Quantity Selector (decimal) */}
                            {/* Quantity Selector inside Cart */}
                            <div className="flex items-center gap-3">
                                {/* Minus */}
                                <button
                                    onClick={() => {
                                        const qty = item.quantity;
                                        let newQty = qty;

                                        // Chicken → minus 0.25 | Eggs → minus 1
                                        if (item.unit === "kg") newQty -= 0.25;
                                        else newQty -= 1;

                                        if (newQty < 0) newQty = 0;

                                        updateQuantity(item.id, Number(newQty.toFixed(3)));
                                    }}
                                    className="px-3 py-2 bg-gray-200 rounded-xl text-lg font-bold text-gray-700"
                                >
                                    –
                                </button>

                                {/* Free-hand input */}
                                <input
                                    type="number"
                                    step="0.001"
                                    min="0"
                                    value={item.quantity}
                                    onChange={(e) => {
                                        let value = parseFloat(e.target.value);
                                        if (isNaN(value) || value < 0) value = 0;

                                        updateQuantity(item.id, Number(value.toFixed(3)));
                                    }}
                                    className="w-24 text-center px-3 py-2 border-2 rounded-xl bg-gray-50 text-gray-800 font-semibold"
                                />

                                {/* Plus */}
                                <button
                                    onClick={() => {
                                        const qty = item.quantity;
                                        let newQty = qty;

                                        // Chicken → plus 0.25 | Eggs → plus 1
                                        if (item.unit === "kg") newQty += 0.25;
                                        else newQty += 1;

                                        updateQuantity(item.id, Number(newQty.toFixed(3)));
                                    }}
                                    className="px-3 py-2 bg-gray-200 rounded-xl text-lg font-bold text-gray-700"
                                >
                                    +
                                </button>

                                <span className="font-medium text-gray-700">{item.unit === "kg" ? "kg" : "pcs"}</span>
                            </div>


                            <div className="flex justify-between items-center pt-4">
                                <span className="text-lg font-semibold text-gray-700">
                                    Price: ₹{item.price} / {item.unit}
                                </span>
                                <span className="text-xl font-bold text-pink-600">
                                    ₹{item.total.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    ))
                )}

                {/* NAME INPUT & TOTAL SECTION */}
                {cart.length > 0 && (
                    <>
                        <div className="bg-white rounded-3xl p-6 shadow-xl space-y-4">
                            <label className="text-gray-700 font-semibold">
                                Your Name
                            </label>
                            <input
                                type="text"
                                placeholder="Enter your name"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl"
                            />
                        </div>

                        <div className="bg-white rounded-3xl shadow-xl p-6 text-center space-y-4">
                            <h3 className="text-xl font-bold">Grand Total</h3>
                            <p className="text-3xl font-bold text-green-600">
                                ₹{grandTotal}
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

            {/* TOAST */}
            {toast.show && (
                <div
                    className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-lg text-white flex items-center gap-2
        ${toast.type === "success"
                            ? "bg-green-600"
                            : "bg-red-600"
                        }`}
                >
                    <span className="font-medium text-sm">{toast.msg}</span>
                </div>
            )}
        </div>
    );
}


