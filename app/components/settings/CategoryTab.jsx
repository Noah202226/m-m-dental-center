"use client";

import { useEffect, useState } from "react";
import { useCategoryStore } from "../../stores/useCategoryStore";
import toast from "react-hot-toast";

export default function CategoriesSettings() {
  const { categories, fetchCategories, addCategory, deleteCategory } =
    useCategoryStore();
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddCategory = async () => {
    if (!newCategory) return toast.error("Enter a category name");

    if (
      categories.some((c) => c.name.toLowerCase() === newCategory.toLowerCase())
    ) {
      return toast.error("Category already exists");
    }

    try {
      await addCategory(newCategory);
      toast.success("Category added!");
      setNewCategory("");
    } catch {
      toast.error("Error adding category");
    }
  };

  const handleDeleteCategory = async (c) => {
    const confirm = window.confirm(`Delete category "${c.name}"?`);
    if (!confirm) return;

    try {
      await deleteCategory(c.$id);
      toast.success("Category deleted!");
    } catch {
      toast.error("Error deleting category");
    }
  };

  return (
    <div className="p-4 text-yellow-400">
      <h2 className="text-xl font-bold mb-4">Manage Categories</h2>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          className="input input-bordered bg-black border-yellow-400 text-yellow-400 flex-1"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New category name"
        />
        <button
          onClick={handleAddCategory}
          className="btn bg-yellow-400 text-black hover:bg-yellow-500"
        >
          Add
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {categories.length === 0 && (
          <p className="text-gray-500">No categories yet.</p>
        )}
        {categories.map((c) => (
          <div
            key={c.$id}
            className="flex justify-between items-center bg-black border border-yellow-500/40 p-2 rounded"
          >
            <span>{c.name}</span>
            <button
              onClick={() => handleDeleteCategory(c)}
              className="btn btn-xs btn-error text-white"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
