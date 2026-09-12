"use client";

import { useEffect, useState } from "react";
import { useCategoryStore } from "../../stores/useCategoryStore";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Tags, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function CategoriesSettings() {
  const { categories, fetchCategories, addCategory, deleteCategory } =
    useCategoryStore();
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAddCategory = async (e) => {
    e?.preventDefault();
    const trimmed = newCategory.trim();
    if (!trimmed) return toast.error("Enter a category name");

    if (
      categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      return toast.error("Category already exists");
    }

    try {
      setLoading(true);
      await addCategory(trimmed);
      toast.success(`Category "${trimmed}" created! 🏷️`, {
        description: "Available immediately across inventory and expenses.",
      });
      setNewCategory("");
    } catch {
      toast.error("Failed to add category");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (c) => {
    const confirm = window.confirm(`Delete category "${c.name}"?`);
    if (!confirm) return;

    try {
      await deleteCategory(c.$id);
      toast.success(`Category "${c.name}" deleted 🗑️`);
    } catch {
      toast.error("Failed to delete category");
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h3 className="text-sm font-semibold flex items-center gap-2 text-[hsl(var(--foreground))]">
          <Tags className="h-4 w-4 text-amber-500" />
          <span>Expense & Product Categories</span>
        </h3>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
          Manage taxonomy labels used to categorize clinic operational expenses and dental supplies
        </p>
      </div>

      {/* Add Category Form */}
      <form onSubmit={handleAddCategory} className="flex gap-2">
        <Input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="e.g. Dental Consumables, Utilities, Office Supplies..."
          className="h-10 text-sm"
        />
        <Button type="submit" loading={loading} className="gap-1.5 h-10 shrink-0">
          <Plus size={16} />
          <span>Add</span>
        </Button>
      </form>

      {/* Categories List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))] pb-1">
          <span>Configured Categories</span>
          <span>{categories.length} Total</span>
        </div>

        {categories.length === 0 ? (
          <div className="p-8 text-center text-xs text-[hsl(var(--muted-foreground))] border border-dashed border-[hsl(var(--border))] rounded-xl">
            No categories registered yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {categories.map((c) => (
              <div
                key={c.$id}
                className="flex items-center justify-between p-3 rounded-xl bg-[hsl(var(--muted))]/40 border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]/50 transition-colors"
              >
                <span className="text-xs font-medium text-[hsl(var(--foreground))] truncate">
                  {c.name}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteCategory(c)}
                  className="h-7 w-7 text-[hsl(var(--muted-foreground))] hover:text-red-500 shrink-0"
                  title="Delete category"
                >
                  <Trash2 size={13} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
