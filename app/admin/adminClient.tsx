// src/app/admin/page.tsx - COMPLETE FIXED VERSION
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
// SKELETON COMPONENTS
// =======================
const ProductCardSkeleton = () => (
  <div className="bg-white rounded-3xl shadow-2xl overflow-hidden animate-pulse">
    <div className="h-72 bg-gradient-to-r from-gray-200 to-gray-300"></div>
    <div className="p-7 space-y-4">
      <div className="h-8 bg-gray-300 rounded w-3/4"></div>
      <div className="h-12 bg-gray-200 rounded"></div>
      <div className="flex gap-4">
        <div className="flex-1 h-14 bg-gray-300 rounded-2xl"></div>
        <div className="flex-1 h-14 bg-gray-300 rounded-2xl"></div>
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
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // =======================
  // TOAST SYSTEM
  // =======================
  const showToast = useCallback((type: ToastType, msg: string) => {
    setToast({ show: true, type, msg });
    setTimeout(() => setToast({ show: false, type: "success", msg: "" }), 3000);
  }, []);

  // =======================
  // UNIT HELPERS
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
        headers: { 'Cache-Control': 'no-cache' }
      });

      clearTimeout(timeout);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      
      // Ensure all products have unit data
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
      
      // Update form if category was deleted
      if (form.categoryId > 0 && !data.find((c: Category) => c.id === form.categoryId)) {
        setForm(prev => ({ ...prev, categoryId: data[0]?.id || 0 }));
      }
      
      return true;
    } catch (error) {
      console.error("Failed to refresh categories:", error);
      return false;
    }
  }, [form.categoryId]);

  const refreshAllData = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshProducts(), refreshCategories()]);
    setRefreshing(false);
  }, [refreshProducts, refreshCategories]);

  // =======================
  // INITIAL LOAD
  // =======================
  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // =======================
  // PRODUCT OPERATIONS
  // =======================
  const createProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.label.trim()) {
      showToast("error", "Product name required");
      return;
    }
    
    if (!form.pricePerUnit || Number(form.pricePerUnit) <= 0) {
      showToast("error", "Valid price required");
      return;
    }
    
    if (form.categoryId === 0) {
      showToast("error", "Please select a category");
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
          pricePerUnit: Number(parseFloat(form.pricePerUnit).toFixed(2)),
        }),
      });

      if (res.ok) {
        showToast("success", "Product added successfully!");
        setForm({ 
          label: "", 
          categoryId: categories[0]?.id || 0, 
          pricePerUnit: "" 
        });
        
        // OPTIMISTIC UPDATE: Add to UI immediately
        const newProduct = await res.json();
        setProducts(prev => [{
          ...newProduct,
          unit: newProduct.unit || getUnitForCategory(newProduct.categoryId),
        }, ...prev]);
        
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

  // UPDATE PRODUCT
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
        
        // OPTIMISTIC UPDATE
        setProducts(prev => 
          prev.map(p => p.id === editing.id ? {
            ...editing,
            unit: editing.unit || getUnitForCategory(editing.categoryId),
          } : p)
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

  // DELETE PRODUCT - OPTIMISTIC VERSION
  const openDeleteModal = (id: number) => {
    setDeleteId(id);
    setShowConfirmDelete(true);
  };

  const deleteProductFinal = async () => {
    if (!deleteId) return;
    
    const productToDelete = products.find(p => p.id === deleteId);
    
    // OPTIMISTIC UPDATE: Remove immediately
    setProducts(prev => prev.filter(p => p.id !== deleteId));
    setShowConfirmDelete(false);
    
    showToast("success", `${productToDelete?.label || 'Product'} deleted`);
    
    // BACKGROUND SYNC
    (async () => {
      try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 3000);
        
        await fetch(`/api/products/${deleteId}`, {
          method: "DELETE",
          signal: controller.signal,
        });
        
        // Silent refresh after successful delete
        setTimeout(() => refreshProducts(), 500);
        
      } catch (error) {
        console.log("Background delete failed (non-critical):", error);
        // Rollback if needed (only if server confirms failure)
        setTimeout(async () => {
          const success = await refreshProducts();
          if (!success) {
            // If refresh fails, revert optimistic update
            setProducts(prev => {
              if (productToDelete && !prev.find(p => p.id === deleteId)) {
                return [...prev, productToDelete].sort((a, b) => a.id - b.id);
              }
              return prev;
            });
          }
        }, 1000);
      }
    })();
    
    setDeleteId(null);
  };

  // =======================
  // CATEGORY OPERATIONS
  // =======================
  const addNewCategory = async () => {
    if (!newCategory.label.trim()) {
      showToast("error", "Category name required");
      return;
    }

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
        
        // OPTIMISTIC UPDATE
        setCategories(prev => [...prev, created]);
        setForm(prev => ({ ...prev, categoryId: created.id }));
        setNewCategory({ label: "", unit: "kg" });
        setShowAddCategory(false);
        
        showToast("success", "Category added!");
      } else {
        const error = await res.json();
        showToast("error", error.error || "Failed to add category");
      }
    } catch (error) {
      showToast("error", "Network error - please try again");
    } finally {
      setActionLoading(false);
    }
  };

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
    
    const categoryToRemove = categories.find(c => c.id === categoryToDelete);
    
    // OPTIMISTIC UPDATE
    setCategories(prev => prev.filter(cat => cat.id !== categoryToDelete));
    setShowDeleteCategory(false);
    
    showToast("success", `${categoryToRemove?.label || 'Category'} deleted`);
    
    // BACKGROUND SYNC
    (async () => {
      try {
        await fetch(`/api/categories/${categoryToDelete}`, { 
          method: "DELETE" 
        });
      } catch (error) {
        console.log("Background category delete failed:", error);
        // Silent rollback
        setTimeout(() => refreshCategories(), 1000);
      }
    })();
    
    setCategoryToDelete(null);
  };

  // =======================
  // AUTH
  // =======================
  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  // =======================
  // RENDER
  // =======================
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-yellow-50">
      {/* Loading Overlay - Only for initial load */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-3xl shadow-2xl">
            <div className="w-16 h-16 border-4 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-xl font-bold">Loading Dashboard...</p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-gradient-to-r from-pink-600 via-orange-500 to-yellow-500 text-white shadow-2xl sticky top-0 z-40">
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
          
          <div className="flex items-center gap-4">
            <button
              onClick={refreshAllData}
              disabled={refreshing}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-5 py-3 rounded-2xl font-bold text-lg transition disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            
            <button
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 px-8 py-3 rounded-2xl font-bold text-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* ADD PRODUCT FORM */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-4 text-gray-800">
            <Plus className="w-10 h-10 text-pink-600" />
            Add New Product
          </h2>

          <form onSubmit={createProduct} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
            <input
              type="text"
              placeholder="Product Name (e.g. Chicken Breast)"
              className="px-5 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-pink-500 outline-none transition"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              required
            />

            <div className="relative">
              <select
                className="w-full px-5 py-4 text-lg bg-white border-2 border-gray-200 rounded-2xl appearance-none pr-12"
                value={form.categoryId}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (val === -1) {
                    setShowAddCategory(true);
                  } else {
                    setForm({ ...form, categoryId: val });
                  }
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
              
              {/* DELETE CATEGORY BUTTON */}
              {form.categoryId > 0 && (
                <button
                  type="button"
                  onClick={() => openDeleteCategoryModal(form.categoryId)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-100 hover:bg-red-200 p-2 rounded-xl text-red-600 transition"
                  title="Delete selected category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="px-5 py-4 bg-gradient-to-r from-pink-50 to-orange-50 rounded-2xl font-bold text-lg flex items-center">
              Unit: <span className="ml-2 text-pink-600">{getUnitForCategory(form.categoryId)}</span>
            </div>

            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Price ₹"
              className="px-5 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-pink-500 outline-none transition"
              value={form.pricePerUnit}
              onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })}
              required
            />

            <button
              type="submit"
              disabled={actionLoading}
              className="bg-gradient-to-r from-pink-600 to-orange-600 text-white font-bold text-lg py-4 rounded-2xl hover:shadow-xl transition active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {actionLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Adding...
                </span>
              ) : (
                "Add Product"
              )}
            </button>
          </form>
        </div>

        {/* PRODUCTS SECTION */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            Products ({products.length})
          </h2>
          <div className="text-sm text-gray-500">
            Click refresh to sync with server
          </div>
        </div>

        {/* PRODUCTS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {refreshing ? (
            // Show skeletons during refresh
            Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={`skeleton-${i}`} />
            ))
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
                {/* Product Image */}
                <div className="relative h-64">
                  <Image
                    src={getProductImage(product)}
                    alt={product.label || "Product"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 400px"
                    priority={product.id <= 4}
                    loading={product.id > 4 ? "lazy" : "eager"}
                  />

                  {/* Title Overlay - FIXED UNIT DISPLAY */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-5 text-white">
                    <h3 className="text-xl font-bold truncate">
                      {product.label || product.category?.label}
                    </h3>
                    <p className="text-sm opacity-90 mt-1">
                      {/* DISPLAY UNIT CORRECTLY */}
                      {product.unit || product.category?.unit || "pcs"} • {product.category?.label}
                    </p>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-5">
                  <div className="text-3xl font-extrabold text-green-600">
                    ₹{product.pricePerUnit.toFixed(2)}
                    <span className="text-lg text-gray-600">
                      /{product.unit || product.category?.unit || "pcs"}
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setEditing(product)}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition hover:brightness-110"
                    >
                      <Edit3 className="w-4 h-4" /> Edit
                    </button>
                    <button
                      onClick={() => openDeleteModal(product.id)}
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition hover:brightness-110"
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
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Edit Product</h2>
                <button 
                  onClick={() => setEditing(null)} 
                  className="text-gray-500 hover:text-gray-700 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name
                  </label>
                  <input
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-lg focus:border-pink-500 outline-none transition"
                    value={editing.label ?? ""}
                    onChange={(e) => setEditing({ ...editing, label: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price per Unit
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-lg focus:border-pink-500 outline-none transition"
                    value={editing.pricePerUnit}
                    onChange={(e) => setEditing({ ...editing, pricePerUnit: Number(e.target.value) })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-lg focus:border-pink-500 outline-none transition"
                    value={editing.categoryId}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      setEditing({ 
                        ...editing, 
                        categoryId: id,
                        unit: getUnitForCategory(id)
                      });
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
                    className="flex-1 bg-gradient-to-r from-pink-600 to-orange-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition disabled:opacity-70"
                  >
                    {actionLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </span>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl font-bold transition"
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
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in">
              <h2 className="text-2xl font-bold mb-6">Add New Category</h2>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name
                  </label>
                  <input
                    placeholder="e.g., Fish, Meat, Dairy"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 outline-none transition"
                    value={newCategory.label}
                    onChange={(e) => setNewCategory({ ...newCategory, label: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit of Measurement
                  </label>
                  <select
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 outline-none transition"
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
                    className="flex-1 bg-gradient-to-r from-pink-600 to-orange-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition disabled:opacity-70"
                  >
                    {actionLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Adding...
                      </span>
                    ) : (
                      "Add Category"
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddCategory(false);
                      setNewCategory({ label: "", unit: "kg" });
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl font-bold transition"
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
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-in zoom-in">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-5" />
              <h3 className="text-xl font-bold mb-3">Delete Product?</h3>
              <p className="text-gray-600 mb-7">
                This product will be removed immediately. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={deleteProductFinal}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition hover:brightness-110"
                >
                  Delete Now
                </button>
                <button
                  onClick={() => {
                    setShowConfirmDelete(false);
                    setDeleteId(null);
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl font-bold transition"
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
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-in zoom-in">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-5" />
              <h3 className="text-xl font-bold mb-3">Delete Category?</h3>
              <p className="text-gray-600 mb-7">
                This category will be removed from the list. Products using it won't be affected.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={deleteCategoryFinal}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-bold hover:shadow-lg transition hover:brightness-110"
                >
                  Delete
                </button>
                <button
                  onClick={() => {
                    setShowDeleteCategory(false);
                    setCategoryToDelete(null);
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 py-3 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TOAST NOTIFICATION */}
        {toast.show && (
          <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-right-5 ${toast.type === "success" ? "bg-green-600" : toast.type === "warning" ? "bg-yellow-600" : "bg-red-600"}`}>
            {toast.type === "success" ? (
              <CheckCircle className="w-6 h-6" />
            ) : toast.type === "warning" ? (
              <AlertTriangle className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
            <span className="font-bold text-white">{toast.msg}</span>
          </div>
        )}
      </div>
    </div>
  );
}