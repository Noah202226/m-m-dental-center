"use client";

import { useEffect, useState, useMemo } from "react";
import { useProductStore } from "../../stores/useProductStore";
import { useCategoryStore } from "../../stores/useCategoryStore";
import { FaBoxOpen, FaPesoSign } from "react-icons/fa6";
import { FiPlus } from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";

// 🔹 Modern Floating-Label Add/Edit Modal
const ProductModal = ({
  isOpen,
  onClose,
  onSave,
  productForm,
  setProductForm,
  isEditing,
  loading,
  categories,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50 backdrop-blur-sm">
      <div className="bg-black border border-yellow-500/40 text-yellow-400 p-8 rounded-3xl w-full max-w-lg shadow-xl">
        <h3 className="text-2xl font-bold mb-6 text-center">
          {isEditing ? "Edit Product" : "Add New Product"}
        </h3>

        <div className="grid grid-cols-1 gap-6">
          {/* Product Name */}
          <div className="relative">
            <input
              type="text"
              id="productName"
              placeholder=" "
              className="peer w-full rounded-xl border border-yellow-400 bg-black px-4 pt-5 pb-2 text-yellow-400 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
              value={productForm.name}
              onChange={(e) =>
                setProductForm({ ...productForm, name: e.target.value })
              }
            />
            <label
              htmlFor="productName"
              className="absolute left-4 top-2 text-gray-400 text-sm transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-yellow-400 peer-focus:text-sm"
            >
              Product Name
            </label>
          </div>

          {/* Category */}
          <div className="relative">
            <select
              id="productCategory"
              className="peer w-full rounded-xl border border-yellow-400 bg-black px-4 pt-5 pb-2 text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition appearance-none"
              value={productForm.category}
              onChange={(e) =>
                setProductForm({ ...productForm, category: e.target.value })
              }
            >
              <option value="" disabled>
                Select category
              </option>
              {categories.map((c) => (
                <option key={c.$id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <label
              htmlFor="productCategory"
              className="absolute left-4 top-2 text-gray-400 text-sm transition-all peer-focus:top-2 peer-focus:text-yellow-400 peer-focus:text-sm"
            >
              Category
            </label>
          </div>

          {/* Price and Stock */}
          <div className="grid grid-cols-2 gap-6">
            <div className="relative">
              <input
                type="number"
                id="productPrice"
                placeholder=" "
                className="peer w-full rounded-xl border border-yellow-400 bg-black px-4 pt-5 pb-2 text-yellow-400 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                value={productForm.price}
                onChange={(e) =>
                  setProductForm({ ...productForm, price: e.target.value })
                }
              />
              <label
                htmlFor="productPrice"
                className="absolute left-4 top-2 text-gray-400 text-sm transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-yellow-400 peer-focus:text-sm"
              >
                Price
              </label>
            </div>

            <div className="relative">
              <input
                type="number"
                id="productStock"
                placeholder=" "
                className="peer w-full rounded-xl border border-yellow-400 bg-black px-4 pt-5 pb-2 text-yellow-400 placeholder-transparent focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                value={productForm.stock}
                onChange={(e) =>
                  setProductForm({ ...productForm, stock: e.target.value })
                }
              />
              <label
                htmlFor="productStock"
                className="absolute left-4 top-2 text-gray-400 text-sm transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-yellow-400 peer-focus:text-sm"
              >
                Stock
              </label>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={onSave}
            className={`btn bg-yellow-400 text-black hover:bg-yellow-500 rounded-xl px-6 py-2 font-semibold shadow-md transition ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={loading}
          >
            {loading ? "Saving..." : isEditing ? "Update" : "Save"}
          </button>
          <button
            onClick={onClose}
            className="btn bg-gray-700 text-white hover:bg-gray-600 rounded-xl px-6 py-2 font-semibold shadow-md transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// 🔹 Delete Confirmation Modal
const DeleteModal = ({ isOpen, onClose, onConfirm, product }) => {
  if (!isOpen || !product) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
      <div className="bg-black border border-red-500/50 text-yellow-400 p-6 rounded-2xl w-full max-w-sm text-center">
        <h3 className="text-lg font-bold mb-4 text-red-500">Delete Product?</h3>
        <p className="mb-4">
          Are you sure you want to delete{" "}
          <span className="font-bold">{product.name}</span>?
        </p>
        <div className="flex justify-center gap-4">
          <button onClick={onConfirm} className="btn btn-error text-white">
            Delete
          </button>
          <button onClick={onClose} className="btn bg-gray-600 text-white">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ProductsDashboard() {
  const { products, fetchProducts, addProduct, updateProduct, deleteProduct } =
    useProductStore();

  const { categories, fetchCategories } = useCategoryStore();

  const [productForm, setProductForm] = useState({
    id: null,
    name: "",
    price: "",
    stock: "",
    category: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openAddModal = () => {
    setProductForm({ id: null, name: "", price: "", stock: "", category: "" });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setProductForm({
      id: p.$id,
      name: p.name,
      price: p.price,
      stock: p.stock,
      category: p.category,
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.price) return;

    // Prevent duplicate names
    if (
      products.some(
        (p) =>
          p.name.toLowerCase() === productForm.name.toLowerCase() &&
          p.$id !== productForm.id
      )
    ) {
      toast.error("Product with this name already exists!");
      return;
    }

    const payload = {
      name: productForm.name,
      category: productForm.category,
      price: Number(productForm.price),
      stock: Number(productForm.stock) || 0,
    };
    setLoading(true);

    try {
      if (isEditing) await updateProduct(productForm.id, payload);
      else await addProduct(payload);

      toast.success(isEditing ? "Product updated!" : "Product added!");
      setIsModalOpen(false);
      setProductForm({
        id: null,
        name: "",
        price: "",
        stock: "",
        category: "",
      });
    } catch (err) {
      console.error(err);
      toast.error("Error saving product.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    try {
      await deleteProduct(selectedProduct.$id);
      toast.success("Product deleted!");
      setDeleteModalOpen(false);
      setSelectedProduct(null);
    } catch {
      toast.error("Error deleting product.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate total value
  const totalValue = useMemo(
    () => products.reduce((acc, p) => acc + p.price * p.stock, 0),
    [products]
  );

  return (
    <div className="flex flex-col h-full overflow-hidden text-yellow-400">
      <Toaster position="top-right" />

      {/* 🔹 Header */}
      <div className="shrink-0 bg-black pb-2 z-5 px-2">
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <FaBoxOpen /> Products
        </h2>

        <div className="flex justify-between items-center mb-4">
          <button
            onClick={openAddModal}
            className="btn btn-sm bg-yellow-400 text-black hover:bg-yellow-500 flex items-center gap-2"
          >
            <FiPlus /> Add Product
          </button>

          <div className="font-bold text-yellow-400">
            Total Value: <FaPesoSign className="inline" />{" "}
            {totalValue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 🔹 Scrollable List */}
      <div
        className="flex-1 overflow-y-auto p-2"
        style={{ maxHeight: "calc(100vh - 160px)" }}
      >
        {products.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No products available.</p>
            <img
              src="/empty-state.svg"
              alt="No products"
              className="mx-auto mt-4 w-48 opacity-50"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <div
                key={p.$id}
                className="card bg-black border border-yellow-500/40 shadow-lg rounded-2xl p-4 hover:shadow-yellow-500/20 transition-all duration-300"
              >
                <h2 className="text-lg font-bold text-yellow-400">{p.name}</h2>
                <p className="text-sm text-gray-400 mb-2">{p.category}</p>

                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Price</span>
                  <span className="font-bold text-yellow-400 flex items-center gap-1">
                    <FaPesoSign /> {p.price.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Stock</span>
                  <span className="font-bold text-yellow-400">{p.stock}</span>
                </div>

                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Total</span>
                  <span className="font-bold text-yellow-400 flex items-center gap-1">
                    <FaPesoSign /> {(p.price * p.stock).toLocaleString()}
                  </span>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => openEditModal(p)}
                    className="btn btn-xs btn-warning text-black"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProduct(p);
                      setDeleteModalOpen(true);
                    }}
                    className="btn btn-xs btn-error text-white"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🔹 Modals */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        productForm={productForm}
        setProductForm={setProductForm}
        isEditing={isEditing}
        loading={loading}
        categories={categories}
      />

      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteProduct}
        product={selectedProduct}
      />
    </div>
  );
}
