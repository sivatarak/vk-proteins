// src/app/admin/page.tsx - FULLY COMPLETE, MOBILE-RESPONSIVE VERSION
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Trash2,
  Edit3,
  Plus,
  X,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
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

type ToastType = "success" | "error" | "warning";

// =======================
// SKELETON COMPONENT
// =======================
const ProductCardSkeleton = () => (
  <div className="bg-white rounded-3xl shadow-2xl overflow-hidden animate-pulse">
    <div className="h-56 sm:h-64 bg-gradient-to-r from-gray-200 to-gray-300"></div>
    <div className="p-5 sm:p-6 space-y-4">
      <div className="h-8 bg-gray-300 rounded w-3/4"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-12 bg-gray-300 rounded-2xl"></div>
        <div className="h-12 bg-gray-300 rounded-2xl"></div>
      </div>
    </div>
  </div>
);

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
  const [newCategory, setNewCategory] = useState({ label: "", unit: "kg" });
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
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // =======================
  // TOAST
  // =======================
  const showToast = useCallback((type: ToastType, msg: string) => {
    setToast({ show: true, type, msg });
    setTimeout(() => setToast({ show: false, type: "success", msg: "" }), 3000);
  }, []);

  // =======================
  // UNIT HELPER
  // =======================
  const getUnitForCategory = useCallback((id: number) => {
    const category = categories.find((c) => c.id === id);
    return category?.unit || "kg";
  }, [categories]);

  // =======================
  // DATA FETCHING
  // =======================
  const refreshProducts = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch("/api/products", {
        signal: controller.signal,
        headers: { "Cache-Control": "no-cache" },
      });

      clearTimeout(timeout);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      const productsWithUnits = data.map((p: any) => ({
        ...p,
        unit: p.unit || p.category?.unit || "pcs",
      }));

      setProducts(productsWithUnits);
      return true;
    } catch (error) {
      console.error("Failed to refresh products:", error);
      showToast("error", "Failed to load products");
      return false;
    }
  }, [showToast]);

  const refreshCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data);

      if (form.categoryId > 0 && !data.find((c: Category) => c.id === form.categoryId)) {
        setForm((prev) => ({ ...prev, categoryId: data[0]?.id || 0 }));
      }

      return true;
    } catch (error) {
      console.error("Failed to refresh categories:", error);
      return false;
    }
  }, [form.categoryId]);

  const refreshAllData = useCallback(
    async (isInitial = false) => {
      if (isInitial) setIsInitialLoading(true);
      setRefreshing(true);

      await Promise.all([refreshProducts(), refreshCategories()]);

      setRefreshing(false);
      if (isInitial) setIsInitialLoading(false);
    },
    [refreshProducts, refreshCategories]
  );

  useEffect(() => {
    refreshAllData(true);
  }, [refreshAllData]);

  // =======================
  // PRODUCT OPERATIONS
  // =======================
  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.label.trim()) return showToast("error", "Product name required");
    if (!form.pricePerUnit || Number(form.pricePerUnit) <= 0)
      return showToast("error", "Valid price required");
    if (form.categoryId === 0) return showToast("error", "Please select a category");

    setActionLoading(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: form.label.trim(),
          categoryId: form.categoryId,
          pricePerUnit: Number(parseFloat(form.pricePerUnit).toFixed(2)),
        }),
      });

      if (res.ok) {
        showToast("success", "Product added successfully!");
        setForm({ label: "", categoryId: categories[0]?.id || 0, pricePerUnit: "" });

        const newProduct = await res.json();
        setProducts((prev) => [
          {
            ...newProduct,
            unit: newProduct.unit || getUnitForCategory(newProduct.categoryId),
          },
          ...prev,
        ]);
      } else {
        const error = await res.json();
        showToast("error", error.error || "Failed to add product");
      }
    } catch (error) {
      showToast("error", "Network error - please try again");
    } finally {
      setActionLoading(false);
    }
  };

  const updateProduct = async () => {
    if (!editing) return;

    setActionLoading(true);

    try {
      const res = await fetch(`/api/products/${editing.id}`, {
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
        setProducts((prev) =>
          prev.map((p) =>
            p.id === editing.id
              ? {
                  ...editing,
                  unit: editing.unit || getUnitForCategory(editing.categoryId),
                }
              : p
          )
        );
        setEditing(null);
      } else {
        const error = await res.json();
        showToast("error", error.error || "Update failed");
      }
    } catch (error) {
      showToast("error", "Network error - please try again");
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteModal = (id: number) => {
    setDeleteId(id);
    setShowConfirmDelete(true);
  };

  const deleteProductFinal = async () => {
    if (!deleteId) return;

    const productToDelete = products.find((p) => p.id === deleteId);

    setProducts((prev) => prev.filter((p) => p.id !== deleteId));
    setShowConfirmDelete(false);
    showToast("success", `${productToDelete?.label || "Product"} deleted`);

    (async () => {
      try {
        await fetch(`/api/products/${deleteId}`, { method: "DELETE" });
        setTimeout(() => refreshProducts(), 500);
      } catch (error) {
        console.log("Background delete failed:", error);
        setTimeout(() => refreshProducts(), 1000);
      }
    })();

    setDeleteId(null);
  };

  // =======================
  // CATEGORY OPERATIONS
  // =======================
  const addNewCategory = async () => {
    if (!newCategory.label.trim()) return showToast("error", "Category name required");

    setActionLoading(true);

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: newCategory.label.trim(),
          unit: newCategory.unit,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setCategories((prev) => [...prev, created]);
        setForm((prev) => ({ ...prev, categoryId: created.id }));
        setNewCategory({ label: "", unit: "kg" });
        setShowAddCategory(false);
        showToast("success", "Category added!");
      } else {
        const error = await res.json();
        showToast("error", error.error || "Failed to add category");
      }
    } catch (error) {
      showToast("error", "Network error");
    } finally {
      setActionLoading(false);
    }
  };

  const openDeleteCategoryModal = (id: number) => {
    const inUse = products.some((p) => p.categoryId === id);
    if (inUse) return showToast("error", "Cannot delete: products are using this category");
    setCategoryToDelete(id);
    setShowDeleteCategory(true);
  };

  const deleteCategoryFinal = async () => {
    if (!categoryToDelete) return;

    const categoryToRemove = categories.find((c) => c.id === categoryToDelete);

    setCategories((prev) => prev.filter((cat) => cat.id !== categoryToDelete));
    setShowDeleteCategory(false);
    showToast("success", `${categoryToRemove?.label || "Category"} deleted`);

    (async () => {
      try {
        await fetch(`/api/categories/${categoryToDelete}`, { method: "DELETE" });
      } catch (error) {
        setTimeout(() => refreshCategories(), 1000);
      }
    })();

    setCategoryToDelete(null);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  // =======================
  // RENDER
  // =======================
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50">
      {/* Initial Loading Overlay */}
      {isInitialLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-3xl shadow-2xl text-center">
            <div className="w-16 h-16 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-xl font-bold">Loading Dashboard...</p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-gradient-to-r from-pink-600 via-orange-500 to-yellow-500 text-white shadow-2xl sticky top-0 z-40">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl shadow-2xl p-2 sm:p-3 flex-shrink-0">
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
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Admin Dashboard</h1>
                <p className="text-sm sm:text-base opacity-90">Manage VK Proteins Inventory</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-center sm:justify-end">
              <button
                onClick={() => refreshAllData()}
                disabled={refreshing}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2.5 rounded-2xl font-semibold text-sm sm:text-base transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>

              <button
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 px-6 py-2.5 rounded-2xl font-semibold text-sm sm:text-base transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 max-w-7xl">
        {/* ADD PRODUCT FORM */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-3 text-gray-800">
            <Plus className="w-8 h-8 sm:w-10 sm:h-10 text-pink-600" />
            Add New Product
          </h2>

          <form onSubmit={createProduct} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Product Name (e.g. Chicken Breast)"
              className="px-4 py-3.5 text-base border-2 border-gray-200 rounded-2xl focus:border-pink-500 outline-none transition"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              required
            />

            <div className="relative">
              <select
                className="w-full px-4 py-3.5 text-base bg-white border-2 border-gray-200 rounded-2xl appearance-none pr-10"
                value={form.categoryId}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val === -1) setShowAddCategory(true);
                  else setForm({ ...form, categoryId: val });
                }}
              >
                <option value={0}>Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label} ({c.unit})
                  </option>
                ))}
                <option value={-1}>+ Add New Category</option>
              </select>

              {form.categoryId > 0 && (
                <button
                  type="button"
                  onClick={() => openDeleteCategoryModal(form.categoryId)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-100 hover:bg-red-200 p-1.5 rounded-lg text-red-600 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="px-4 py-3.5 bg-gradient-to-r from-pink-50 to-orange-50 rounded-2xl font-semibold text-base flex items-center justify-center">
              Unit: <span className="ml-2 text-pink-600">{getUnitForCategory(form.categoryId)}</span>
            </div>

            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Price ₹"
              className="px-4 py-3.5 text-base border-2 border-gray-200 rounded-2xl focus:border-pink-500 outline-none transition"
              value={form.pricePerUnit}
              onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })}
              required
            />

            <button
              type="submit"
              disabled={actionLoading}
              className="bg-gradient-to-r from-pink-600 to-orange-600 text-white font-bold text-base py-3.5 rounded-2xl hover:shadow-xl transition active:scale-98 disabled:opacity-70"
            >
              {actionLoading ? "Adding..." : "Add Product"}
            </button>
          </form>
        </div>

        {/* PRODUCTS SECTION */}
        <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            Products ({products.length})
            {refreshing && <span className="ml-3 text-sm font-normal text-gray-500">↻ Refreshing...</span>}
          </h2>
          <div className="text-sm text-gray-500 text-center sm:text-right">
            Click refresh to sync with server
          </div>
        </div>

        {/* PRODUCTS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isInitialLoading ? (
            Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={`skeleton-${i}`} />)
          ) : products.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-white rounded-3xl shadow-lg">
              <div className="text-5xl mb-4">📦</div>
              <h3 className="text-2xl font-bold text-gray-700 mb-2">No Products Found</h3>
              <p className="text-gray-500">Add your first product using the form above</p>
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-56 sm:h-64">
                  <Image
                    src={getProductImage(product)}
                    alt={product.label || "Product"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4 sm:p-5 text-white">
                    <h3 className="text-lg sm:text-xl font-bold truncate">
                      {product.label || product.category?.label}
                    </h3>
                    <p className="text-xs sm:text-sm opacity-90 mt-1">
                      {product.unit || product.category?.unit || "pcs"} • {product.category?.label}
                    </p>
                  </div>
                </div>

                <div className="p-5 sm:p-6 space-y-4">
                  <div className="text-2xl sm:text-3xl font-extrabold text-green-600">
                    ₹{product.pricePerUnit.toFixed(2)}
                    <span className="text-base sm:text-lg text-gray-600">
                      /{product.unit || product.category?.unit || "pcs"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setEditing(product)}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition text-sm sm:text-base"
                    >
                      <Edit3 className="w-4 h-4" /> Edit
                    </button>
                    <button
                      onClick={() => openDeleteModal(product.id)}
                      className="bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition text-sm sm:text-base"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* EDIT PRODUCT MODAL */}
        {editing && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold">Edit Product</h2>
                <button onClick={() => setEditing(null)}>
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 outline-none"
                    value={editing.label ?? ""}
                    onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price per Unit</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 outline-none"
                    value={editing.pricePerUnit}
                    onChange={(e) => setEditing({ ...editing, pricePerUnit: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl"
                    value={editing.categoryId}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      setEditing({ ...editing, categoryId: id, unit: getUnitForCategory(id) });
                    }}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label} ({c.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={updateProduct}
                    disabled={actionLoading}
                    className="flex-1 bg-gradient-to-r from-pink-600 to-orange-600 text-white py-3 rounded-xl font-bold disabled:opacity-70"
                  >
                    {actionLoading ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    className="flex-1 bg-gray-100 py-3 rounded-xl font-bold"
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
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
              <h2 className="text-xl sm:text-2xl font-bold mb-6">Add New Category</h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                  <input
                    placeholder="e.g., Fish, Meat, Dairy"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 outline-none"
                    value={newCategory.label}
                    onChange={(e) => setNewCategory({ ...newCategory, label: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit of Measurement</label>
                  <select
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl"
                    value={newCategory.unit}
                    onChange={(e) => setNewCategory({ ...newCategory, unit: e.target.value })}
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="piece">Piece (pcs)</option>
                    <option value="dozen">Dozen</option>
                    <option value="liter">Liter (L)</option>
                    <option value="pack">Pack</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={addNewCategory}
                    disabled={actionLoading}
                    className="flex-1 bg-gradient-to-r from-pink-600 to-orange-600 text-white py-3 rounded-xl font-bold disabled:opacity-70"
                  >
                    {actionLoading ? "Adding..." : "Add Category"}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddCategory(false);
                      setNewCategory({ label: "", unit: "kg" });
                    }}
                    className="flex-1 bg-gray-100 py-3 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DELETE PRODUCT CONFIRM MODAL */}
        {showConfirmDelete && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-5" />
              <h3 className="text-xl font-bold mb-3">Delete Product?</h3>
              <p className="text-gray-600 mb-7">
                This product will be removed immediately. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={deleteProductFinal}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-bold"
                >
                  Delete Now
                </button>
                <button
                  onClick={() => {
                    setShowConfirmDelete(false);
                    setDeleteId(null);
                  }}
                  className="flex-1 bg-gray-100 py-3 rounded-xl font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE CATEGORY CONFIRM MODAL */}
        {showDeleteCategory && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-5" />
              <h3 className="text-xl font-bold mb-3">Delete Category?</h3>
              <p className="text-gray-600 mb-7">
                This category will be removed from the list. Products using it won't be affected.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={deleteCategoryFinal}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-bold"
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    setShowDeleteCategory(false);
                    setCategoryToDelete(null);
                  }}
                  className="flex-1 bg-gray-100 py-3 rounded-xl font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TOAST NOTIFICATION */}
        {toast.show && (
          <div
            className={`fixed bottom-4 left-4 right-4 sm:bottom-6 sm:left-auto sm:right-6 px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 text-white ${
              toast.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-6 h-6 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            )}
            <span className="font-bold text-sm sm:text-base">{toast.msg}</span>
          </div>
        )}
      </div>
    </div>
  );
}