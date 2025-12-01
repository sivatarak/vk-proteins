"use client";

import { useState } from "react";
import { Trash2, Edit3, Plus, X, CheckCircle, AlertTriangle } from "lucide-react";

export default function AdminClient({ initialProducts }) {
    const [products, setProducts] = useState(initialProducts || []);
    const [editing, setEditing] = useState(null);

    // Dynamic categories (admin can add new ones)
    const [categories, setCategories] = useState([
        { value: "boiler", label: "Boiler Chicken" },
        { value: "layer", label: "Layer Chicken" },
        { value: "egg", label: "Fresh Eggs" }
    ]);

    // Form for product
    const [form, setForm] = useState({
        label: "",
        category: "boiler",
        unit: "kg",
        pricePerUnit: ""
    });

    // Popup modals
    const [showAddCategory, setShowAddCategory] = useState(false);
    const [newCategory, setNewCategory] = useState("");

    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    // Toast messages
    const [toast, setToast] = useState({ show: false, type: "success", msg: "" });

    function showToast(type, msg) {
        setToast({ show: true, type, msg });
        setTimeout(() => setToast({ show: false, type: "", msg: "" }), 2500);
    }

    async function refreshProducts() {
        const res = await fetch("/api/products");
        const data = await res.json();
        setProducts(data);
    }

    // CREATE PRODUCT
    async function createProduct(e) {
        e.preventDefault();

        const res = await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                label: form.label,
                name: form.label,
                category: form.category,
                unit: form.unit,
                pricePerUnit: form.pricePerUnit
            })
        });

        if (!res.ok) {
            showToast("error", "Failed to add product");
            return;
        }

        showToast("success", "Product added successfully!");

        setForm({ label: "", category: "boiler", unit: "kg", pricePerUnit: "" });
        refreshProducts();
    }

    // UPDATE PRODUCT
    async function updateProduct(id) {
        const res = await fetch(`/api/products/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...editing,
                name: editing.label
            })
        });

        if (!res.ok) {
            showToast("error", "Update failed");
            return;
        }

        showToast("success", "Product updated!");
        setEditing(null);
        refreshProducts();
    }

    // DELETE CONFIRM MODAL
    function openDeleteModal(id) {
        setDeleteId(id);
        setShowConfirmDelete(true);
    }

    // DELETE PRODUCT
    async function deleteProductFinal() {
        const res = await fetch(`/api/products/${deleteId}`, {
            method: "DELETE"
        });

        if (!res.ok) {
            showToast("error", "Delete failed");
        } else {
            showToast("success", "Product deleted!");
            refreshProducts();
        }

        setShowConfirmDelete(false);
        setDeleteId(null);
    }

    // LOGOUT
    async function handleLogout() {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/login";
    }

    // Category image functions
    const getCategoryImage = (category) => {
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
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50">

            {/* HEADER */}
            <div className="bg-gradient-to-r from-pink-600 via-orange-500 to-yellow-500 shadow-xl sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">

                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-md p-2">
                            <img src="/Vk_protein_logo.jpg" className="w-full h-full object-cover rounded-xl" />
                        </div>

                        <div>
                            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                            <p className="text-white/90 text-sm">Manage VK Proteins Inventory</p>
                        </div>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="bg-white/20 hover:bg-white/30 text-white px-6 py-2 rounded-xl border border-white/30"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* ADD PRODUCT CARD */}
            <div className="max-w-7xl mx-auto px-6 py-10">
                <div className="bg-white/90 rounded-3xl shadow-xl p-8">

                    <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
                        <Plus className="w-8 h-8 text-pink-600" /> Add Product
                    </h2>

                    <form onSubmit={createProduct} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">

                        {/* LABEL */}
                        <input
                            className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl"
                            placeholder="Product Label"
                            value={form.label}
                            onChange={(e) => setForm({ ...form, label: e.target.value })}
                            required
                        />

                        {/* CATEGORY DROPDOWN */}
                        <select
                            className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl"
                            value={form.category}
                            onChange={(e) => {
                                if (e.target.value === "add_new") {
                                    setShowAddCategory(true);
                                } else {
                                    setForm({ ...form, category: e.target.value });
                                }
                            }}
                        >
                            {categories.map((c) => (
                                <option key={c.value} value={c.value}>
                                    {c.label}
                                </option>
                            ))}

                            <option value="add_new">➕ Add New Category</option>
                        </select>

                        {/* UNIT */}
                        <select
                            className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl"
                            value={form.unit}
                            onChange={(e) => setForm({ ...form, unit: e.target.value })}
                        >
                            <option value="kg">Per Kg</option>
                            <option value="piece">Per Piece</option>
                        </select>

                        {/* PRICE + ADD BUTTON */}
                        <div className="flex items-center gap-3">
                            <input
                                type="number"
                                step="0.01"
                                className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl"
                                placeholder="₹ Price"
                                value={form.pricePerUnit}
                                onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })}
                                required
                            />

                            <button
                                type="submit"
                                className="bg-gradient-to-r from-pink-600 to-orange-600 text-white px-6 py-3 rounded-2xl font-bold"
                            >
                                Add
                            </button>
                        </div>
                    </form>
                </div>

                {/* PRODUCTS GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
                    {products.map((product) => (
                        <div key={product.id} className="bg-white rounded-3xl shadow-xl overflow-hidden">
                            <div className="h-56 relative">
                                <img src={getCategoryImage(product.category)} className="w-full h-full object-cover" />
                                <div className="absolute bottom-0 bg-black/40 p-4 w-full text-white text-xl font-bold">
                                    {product.label}
                                </div>
                            </div>

                            <div className="p-5 space-y-4">
                                <div className="text-3xl font-bold text-green-600">₹{product.pricePerUnit}</div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setEditing(product)}
                                        className="flex-1 bg-blue-600 text-white py-3 rounded-xl flex items-center justify-center gap-2"
                                    >
                                        <Edit3 className="w-5 h-5" /> Edit
                                    </button>

                                    <button
                                        onClick={() => openDeleteModal(product.id)}
                                        className="flex-1 bg-red-600 text-white py-3 rounded-xl flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-5 h-5" /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {/* EDIT PRODUCT MODAL */}
                {editing && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
                        <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-lg w-full">

                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">Edit Product</h2>
                                <button onClick={() => setEditing(null)}>
                                    <X className="w-7 h-7 text-gray-600" />
                                </button>
                            </div>

                            <div className="space-y-4">

                                {/* Label */}
                                <input
                                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl"
                                    value={editing.label}
                                    onChange={(e) =>
                                        setEditing({ ...editing, label: e.target.value })
                                    }
                                />

                                {/* Price */}
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl"
                                    value={editing.pricePerUnit}
                                    onChange={(e) =>
                                        setEditing({ ...editing, pricePerUnit: e.target.value })
                                    }
                                />

                                {/* Category */}
                                <select
                                    value={editing.category}
                                    onChange={(e) =>
                                        setEditing({ ...editing, category: e.target.value })
                                    }
                                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl"
                                >
                                    {categories.map((c) => (
                                        <option key={c.value} value={c.value}>
                                            {c.label}
                                        </option>
                                    ))}
                                </select>

                                {/* Unit */}
                                <select
                                    value={editing.unit}
                                    onChange={(e) =>
                                        setEditing({ ...editing, unit: e.target.value })
                                    }
                                    className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl"
                                >
                                    <option value="kg">Per Kg</option>
                                    <option value="piece">Per Piece</option>
                                </select>

                                {/* ACTION BUTTONS */}
                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={() => updateProduct(editing.id)}
                                        className="flex-1 bg-pink-600 text-white py-4 rounded-2xl font-bold"
                                    >
                                        Save
                                    </button>

                                    <button
                                        onClick={() => setEditing(null)}
                                        className="flex-1 bg-gray-200 text-gray-800 py-4 rounded-2xl font-bold"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {/* DELETE CONFIRM MODAL */}
                {showConfirmDelete && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-6 h-6 text-red-600" /> Confirm Delete
                            </h2>

                            <p className="mb-6 text-gray-700">
                                Are you sure you want to delete this product? This action cannot be undone.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={deleteProductFinal}
                                    className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold"
                                >
                                    Delete
                                </button>
                                <button
                                    onClick={() => setShowConfirmDelete(false)}
                                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ADD CATEGORY MODAL */}
                {showAddCategory && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full">

                            <h2 className="text-xl font-bold mb-6">Add New Category</h2>

                            <input
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl mb-4"
                                placeholder="Ex: Mutton / Goat / Fish"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        if (!newCategory.trim()) return;

                                        const value = newCategory.trim().toLowerCase().replace(/\s+/g, "_");

                                        setCategories([...categories, { value, label: newCategory }]);
                                        setForm({ ...form, category: value });

                                        setNewCategory("");
                                        setShowAddCategory(false);

                                        showToast("success", "New category added!");
                                    }}
                                    className="flex-1 bg-pink-600 text-white py-3 rounded-xl font-bold"
                                >
                                    Add
                                </button>

                                <button
                                    onClick={() => setShowAddCategory(false)}
                                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* TOAST MESSAGE */}
                {toast.show && (
                    <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-lg text-white flex items-center gap-3
                        ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}
                    >
                        {toast.type === "success"
                            ? <CheckCircle className="w-6 h-6" />
                            : <AlertTriangle className="w-6 h-6" />
                        }
                        <span className="font-medium">{toast.msg}</span>
                    </div>
                )}

                <p className="text-center text-gray-600 mt-12">
                    © 2025 VK Proteins • All Rights Reserved
                </p>
            </div>
        </div>
    );
}
