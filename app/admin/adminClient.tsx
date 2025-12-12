// src/app/admin/page.tsx (or wherever your AdminClient is)
"use client";

import { useState, useEffect } from "react";
import {
  Trash2,
  Edit3,
  Plus,
  X,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import Image from "next/image";
import { getProductImage } from "../utils/productImage";

// =======================
// TYPES
// =======================
type Category = {
  id: number;
  label: string;
  value: string;
  unit: string;
};

type Product = {
  id: number;
  label: string | null;
  name: string;
  unit: string;
  pricePerUnit: number;
  isActive: boolean;
  categoryId: number;
  category: Category;
};

type ToastType = "success" | "error";

// =======================
// MAIN COMPONENT
// =======================
export default function AdminClient({
  initialProducts,
  initialCategories,
}: {
  initialProducts: Product[];
  initialCategories: Category[];
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [categories, setCategories] = useState<Category[]>(initialCategories || []);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({
    label: "",
    categoryId: initialCategories[0]?.id ?? 0,
    pricePerUnit: "",
  });
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", unit: "kg" });
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteCategory, setShowDeleteCategory] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    type: ToastType;
    msg: string;
  }>({ show: false, type: "success", msg: "" });
  const [actionLoading, setActionLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const showToast = (type: ToastType, msg: string) => {
    setToast({ show: true, type, msg });
    setTimeout(() => setToast({ show: false, type: "success", msg: "" }), 3000);
  };

  const getUnitForCategory = (id: number) =>
    categories.find((c) => c.id === id)?.unit || "kg";

  const refreshProducts = async () => {
    setLoading(true);
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  };

  const refreshCategories = async () => {
    setLoading(true);
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    refreshProducts();
    refreshCategories();
  }, []);

  // CREATE PRODUCT
  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label.trim() || !form.pricePerUnit || form.categoryId === 0) {
      showToast("error", "Please fill all fields");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: form.label.trim(),
          categoryId: form.categoryId,
          pricePerUnit: Number(form.pricePerUnit),
        }),
      });

      if (res.ok) {
        showToast("success", "Product added successfully!");
        setForm({ label: "", categoryId: categories[0]?.id || 0, pricePerUnit: "" });
        await refreshProducts();
      } else {
        showToast("error", "Failed to add product");
      }
    } finally {
      setActionLoading(false);
    }
  };

  // UPDATE PRODUCT
  const updateProduct = async (id: number) => {
    if (!editing) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: editing.label,
          pricePerUnit: editing.pricePerUnit,
          categoryId: editing.categoryId,
        }),
      });

      if (res.ok) {
        showToast("success", "Product updated!");
        setEditing(null);
        await refreshProducts();
      } else {
        showToast("error", "Update failed");
      }
    } finally {
      setActionLoading(false);
    }
  };

  // DELETE PRODUCT
  const openDeleteModal = (id: number) => {
    setDeleteId(id);
    setShowConfirmDelete(true);
  };

  const deleteProductFinal = async () => {
    if (!deleteId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/products/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        showToast("success", "Product deleted!");
        await refreshProducts();
      }
    } finally {
      setShowConfirmDelete(false);
      setDeleteId(null);
      setActionLoading(false);
    }
  };

  // ADD CATEGORY
  const addNewCategory = async () => {
    if (!newCategory.name.trim()) {
      showToast("error", "Category name required");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: newCategory.name.trim(),
          unit: newCategory.unit,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setCategories((p) => [...p, created]);
        setForm((p) => ({ ...p, categoryId: created.id }));
        setNewCategory({ name: "", unit: "kg" });
        setShowAddCategory(false);
        showToast("success", "Category added!");
      }
    } finally {
      setActionLoading(false);
    }
  };

  // DELETE CATEGORY
  const openDeleteCategoryModal = (id: number) => {
    const inUse = products.some((p) => p.categoryId === id);
    if (inUse) {
      showToast("error", "Cannot delete: products are using this category");
      return;
    }
    setCategoryToDelete(id);
    setShowDeleteCategory(true);
  };

  const deleteCategoryFinal = async () => {
    if (!categoryToDelete) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/categories/${categoryToDelete}`, { method: "DELETE" });
      if (res.ok) {
        setCategories((c) => c.filter((cat) => cat.id !== categoryToDelete));
        showToast("success", "Category deleted");
      }
    } finally {
      setShowDeleteCategory(false);
      setCategoryToDelete(null);
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const LoadingSpinner = () => (
    <div className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50">
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-3xl shadow-2xl">
            <div className="w-16 h-16 border-4 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-xl font-bold">Loading...</p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-gradient-to-r from-pink-600 via-orange-500 to-yellow-500 text-white shadow-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-2xl p-3">
              <Image
                src="/Vk_protein_logo.jpg"
                alt="VK Proteins"
                width={80}
                height={80}
                className="rounded-xl"
                priority
              />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Admin Dashboard</h1>
              <p className="text-lg opacity-90">Manage VK Proteins Inventory</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="bg-white/20 hover:bg-white/30 px-8 py-4 rounded-2xl font-bold text-lg"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* ADD PRODUCT FORM */}
        <div className="bg-white rounded-3xl shadow-2xl p-10 mb-12">
          <h2 className="text-4xl font-bold mb-8 flex items-center gap-4 text-gray-800">
            <Plus className="w-12 h-12 text-pink-600" />
            Add New Product
          </h2>

          <form onSubmit={createProduct} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <input
              type="text"
              placeholder="Product Name (e.g. Chicken Breast)"
              className="px-6 py-5 text-lg border-2 border-gray-200 rounded-2xl focus:border-pink-500 outline-none"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              required
            />

            <div className="relative">
              <select
                className="w-full px-6 py-5 text-lg bg-white border-2 border-gray-200 rounded-2xl appearance-none"
                value={form.categoryId}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val === -1) setShowAddCategory(true);
                  else setForm({ ...form, categoryId: val });
                }}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label} ({c.unit})
                  </option>
                ))}
                <option value={-1}>+ Add New Category</option>
              </select>

              {/* DELETE BUTTON (Correct Position) */}
              {form.categoryId > 0 && (
                <button
                  type="button"
                  onClick={() => openDeleteCategoryModal(form.categoryId)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-600 hover:bg-red-700 p-2 rounded-xl shadow-lg text-white transition"
                  title="Delete selected category"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>


            <div className="px-6 py-5 bg-gradient-to-r from-pink-50 to-orange-50 rounded-2xl font-bold text-xl">
              Unit: {getUnitForCategory(form.categoryId)}
            </div>

            <input
              type="number"
              step="0.01"
              placeholder="Price ₹"
              className="px-6 py-5 text-lg border-2 border-gray-200 rounded-2xl focus:border-pink-500 outline-none"
              value={form.pricePerUnit}
              onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })}
              required
            />

            <button
              type="submit"
              disabled={actionLoading}
              className="bg-gradient-to-r from-pink-600 to-orange-600 text-white font-bold text-xl py-5 rounded-2xl hover:shadow-2xl transition active:scale-95 disabled:opacity-70"
            >
              {actionLoading ? (
                <span className="flex items-center justify-center gap-3">
                  <LoadingSpinner /> Adding...
                </span>
              ) : (
                "Add Product"
              )}
            </button>
          </form>
        </div>

        {/* PRODUCTS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-300"
            >
              {/* Product Image */}
              <div className="relative h-72">
                <Image
                  src={getProductImage(product)}
                  alt={product.label || "Product"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 400px"
                  priority
                  placeholder="blur"
                  blurDataURL="data:image/webp;base64,UklGRh4AAABXRUJQVlA4WA=="
                />

                {/* Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
                  <h3 className="text-2xl font-bold">{product.label || product.category.label}</h3>
                  <p className="text-lg opacity-90">{product.unit}</p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-7 space-y-6">
                <div className="text-4xl font-extrabold text-green-600">
                  ₹{product.pricePerUnit}
                  <span className="text-xl text-gray-600">/{product.unit}</span>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setEditing(product)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:shadow-lg transition"
                  >
                    <Edit3 className="w-6 h-6" /> Edit
                  </button>
                  <button
                    onClick={() => openDeleteModal(product.id)}
                    className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:shadow-lg transition"
                  >
                    <Trash2 className="w-6 h-6" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* EDIT PRODUCT MODAL */}
        {editing && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-10 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold">Edit Product</h2>
                <button onClick={() => setEditing(null)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-8 h-8" />
                </button>
              </div>
              <div className="space-y-6">
                <input
                  className="w-full px-6 py-4 border-2 rounded-2xl text-lg"
                  value={editing.label ?? ""}
                  onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                />
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-6 py-4 border-2 rounded-2xl text-lg"
                  value={editing.pricePerUnit}
                  onChange={(e) => setEditing({ ...editing, pricePerUnit: Number(e.target.value) })}
                />
                <select
                  className="w-full px-6 py-5 border-2 rounded-2xl text-lg"
                  value={editing.categoryId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setEditing({ ...editing, categoryId: id });
                  }}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label} ({c.unit})
                    </option>
                  ))}
                </select>
                <div className="flex gap-4">
                  <button
                    onClick={() => updateProduct(editing.id)}
                    disabled={actionLoading}
                    className="flex-1 bg-pink-600 text-white py-4 rounded-2xl font-bold disabled:opacity-70"
                  >
                    {actionLoading ? (
                      <span className="flex items-center justify-center gap-3">
                        <LoadingSpinner /> Saving...
                      </span>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    className="flex-1 bg-gray-200 py-4 rounded-2xl font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ADD CATEGORY MODAL */}
        {showAddCategory && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-10 max-w-md w-full shadow-2xl">
              <h2 className="text-3xl font-bold mb-8">Add New Category</h2>
              <div className="space-y-6">
                <input
                  placeholder="Category Name"
                  className="w-full px-6 py-4 border-2 rounded-2xl"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                />
                <select
                  className="w-full px-6 py-5 border-2 rounded-2xl"
                  value={newCategory.unit}
                  onChange={(e) => setNewCategory({ ...newCategory, unit: e.target.value })}
                >
                  <option value="kg">Kilogram (kg)</option>
                  <option value="piece">Pieces (pcs)</option>
                  <option value="dozen">Dozen</option>
                  <option value="liter">Liters</option>
                </select>
                <div className="flex gap-4">
                  <button
                    onClick={addNewCategory}
                    disabled={actionLoading}
                    className="flex-1 bg-pink-600 text-white py-4 rounded-2xl font-bold disabled:opacity-70"
                  >
                    {actionLoading ? (
                      <span className="flex items-center justify-center gap-3">
                        <LoadingSpinner /> Adding...
                      </span>
                    ) : (
                      "Add Category"
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddCategory(false);
                      setNewCategory({ name: "", unit: "kg" });
                    }}
                    className="flex-1 bg-gray-200 py-4 rounded-2xl font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DELETE PRODUCT CONFIRM */}
        {showConfirmDelete && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-10 max-w-sm w-full shadow-2xl text-center">
              <AlertTriangle className="w-20 h-20 text-red-600 mx-auto mb-6" />
              <h3 className="text-2xl font-bold mb-4">Delete Product?</h3>
              <p className="text-gray-600 mb-8">This action cannot be undone.</p>
              <div className="flex gap-4">
                <button
                  onClick={deleteProductFinal}
                  disabled={actionLoading}
                  className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-bold disabled:opacity-70"
                >
                  {actionLoading ? (
                    <span className="flex items-center justify-center gap-3">
                      <LoadingSpinner /> Deleting...
                    </span>
                  ) : (
                    "Yes, Delete"
                  )}
                </button>
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="flex-1 bg-gray-200 py-4 rounded-2xl font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE CATEGORY CONFIRM */}
        {showDeleteCategory && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-10 max-w-sm w-full shadow-2xl text-center">
              <AlertTriangle className="w-20 h-20 text-red-600 mx-auto mb-6" />
              <h3 className="text-2xl font-bold mb-4">Delete Category?</h3>
              <div className="flex gap-4 mt-8">
                <button
                  onClick={deleteCategoryFinal}
                  disabled={actionLoading}
                  className="flex-1 bg-red-600 text-white py-4 rounded-2xl font-bold disabled:opacity-70"
                >
                  {actionLoading ? (
                    <span className="flex items-center justify-center gap-3">
                      <LoadingSpinner /> Deleting...
                    </span>
                  ) : (
                    "Delete"
                  )}
                </button>
                <button
                  onClick={() => setShowDeleteCategory(false)}
                  className="flex-1 bg-gray-200 py-4 rounded-2xl font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TOAST */}
        {toast.show && (
          <div className={`fixed bottom-8 right-8 px-8 py-6 rounded-2xl shadow-2xl text-white flex items-center gap-4 z-50 animate-pulse ${toast.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
            {toast.type === "success" ? (
              <CheckCircle className="w-10 h-10" />
            ) : (
              <AlertTriangle className="w-10 h-10" />
            )}
            <span className="text-2xl font-bold">{toast.msg}</span>
          </div>
        )}
      </div>
    </div>
  );
}