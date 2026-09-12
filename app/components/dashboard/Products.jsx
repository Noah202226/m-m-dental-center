"use client";

import { useEffect, useState, useMemo } from "react";
import { useProductStore } from "../../stores/useProductStore";
import { useCategoryStore } from "../../stores/useCategoryStore";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Input } from "../ui/Input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/Dialog";
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  Boxes,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

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
    setProductForm({
      id: null,
      name: "",
      price: "",
      stock: "",
      category: categories[0]?.name || "General Supplies",
    });
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

  const handleSaveProduct = async (e) => {
    e?.preventDefault();
    if (!productForm.name?.trim()) {
      toast.error("Please enter a product name");
      return;
    }
    if (!productForm.price || Number(productForm.price) <= 0) {
      toast.error("Please enter a valid unit price");
      return;
    }

    if (
      products.some(
        (p) =>
          p.name.toLowerCase() === productForm.name.trim().toLowerCase() &&
          p.$id !== productForm.id
      )
    ) {
      toast.error("A product with this name already exists in inventory!");
      return;
    }

    const payload = {
      name: productForm.name.trim(),
      category: productForm.category || "General",
      price: Number(productForm.price),
      stock: Number(productForm.stock) || 0,
    };

    setLoading(true);
    try {
      if (isEditing) {
        await updateProduct(productForm.id, payload);
        toast.success(`Product "${payload.name}" updated! 📦`, {
          description: `Price: ₱${payload.price.toLocaleString()} | Stock: ${payload.stock}`,
        });
      } else {
        await addProduct(payload);
        toast.success(`Product "${payload.name}" added to inventory! 📦`, {
          description: `Initial stock: ${payload.stock} items at ₱${payload.price.toLocaleString()}`,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save product to inventory");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    try {
      await deleteProduct(selectedProduct.$id);
      toast.success(`Product "${selectedProduct.name}" removed from inventory 🗑️`);
      setDeleteModalOpen(false);
      setSelectedProduct(null);
    } catch {
      toast.error("Failed to delete product");
    } finally {
      setLoading(false);
    }
  };

  const totalValue = useMemo(
    () => products.reduce((acc, p) => acc + (Number(p.price) || 0) * (Number(p.stock) || 0), 0),
    [products]
  );

  const totalItems = useMemo(
    () => products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0),
    [products]
  );

  return (
    <div className="space-y-6">
      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-2">
            <Package className="h-5 w-5 text-amber-500" />
            <span>Product & Supply Inventory</span>
          </h2>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Track dental clinical supplies, retail oral care products, and stock valuation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] uppercase tracking-wider text-[hsl(var(--muted-foreground))] block">
              Total Inventory Value
            </span>
            <span className="text-base font-bold text-amber-500">
              ₱{totalValue.toLocaleString()}
            </span>
          </div>
          <Button onClick={openAddModal} className="gap-1.5 shadow-sm">
            <Plus size={16} />
            <span>Add Product</span>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5">
          <span className="text-[11px] text-[hsl(var(--muted-foreground))] block">
            Distinct SKUs
          </span>
          <span className="text-lg font-bold text-[hsl(var(--foreground))]">
            {products.length} Products
          </span>
        </Card>
        <Card className="p-3.5">
          <span className="text-[11px] text-[hsl(var(--muted-foreground))] block">
            Units in Stock
          </span>
          <span className="text-lg font-bold text-emerald-500">
            {totalItems.toLocaleString()} Units
          </span>
        </Card>
        <Card className="p-3.5">
          <span className="text-[11px] text-[hsl(var(--muted-foreground))] block">
            Low Stock Alerts
          </span>
          <span className="text-lg font-bold text-amber-500">
            {products.filter((p) => Number(p.stock) <= 5).length} Items
          </span>
        </Card>
        <Card className="p-3.5">
          <span className="text-[11px] text-[hsl(var(--muted-foreground))] block">
            Valuation
          </span>
          <span className="text-lg font-bold text-[hsl(var(--foreground))]">
            ₱{totalValue.toLocaleString()}
          </span>
        </Card>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-[hsl(var(--border))]">
          <Boxes className="h-12 w-12 mx-auto text-[hsl(var(--muted-foreground))] mb-3 opacity-40" />
          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
            No products in inventory
          </h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 max-w-sm mx-auto">
            Add clinical supplies, materials, or retail oral healthcare products to track inventory levels.
          </p>
          <Button onClick={openAddModal} variant="outline" size="sm" className="mt-4 gap-1.5">
            <Plus size={14} /> Add First Product
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {products.map((p) => {
            const stockNum = Number(p.stock) || 0;
            const priceNum = Number(p.price) || 0;
            const isLowStock = stockNum <= 5;

            return (
              <Card
                key={p.$id}
                className="hover:border-amber-500/30 transition-all flex flex-col justify-between"
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-[hsl(var(--foreground))] truncate">
                        {p.name}
                      </h4>
                      <Badge variant="secondary" className="text-[10px] mt-1">
                        {p.category || "General"}
                      </Badge>
                    </div>
                    {isLowStock && (
                      <Badge variant="warning" className="text-[10px] shrink-0">
                        Low Stock
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1 pt-1 text-xs border-t border-[hsl(var(--border))]">
                    <div className="flex justify-between">
                      <span className="text-[hsl(var(--muted-foreground))]">Unit Price:</span>
                      <span className="font-semibold text-[hsl(var(--foreground))]">
                        ₱{priceNum.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[hsl(var(--muted-foreground))]">Stock Count:</span>
                      <span
                        className={`font-semibold ${
                          isLowStock ? "text-amber-500 font-bold" : "text-[hsl(var(--foreground))]"
                        }`}
                      >
                        {stockNum} units
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-xs pt-1">
                      <span className="text-[hsl(var(--muted-foreground))]">Total Worth:</span>
                      <span className="text-emerald-500">
                        ₱{(priceNum * stockNum).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>

                <div className="p-3 pt-0 flex items-center justify-end gap-1.5 border-t border-[hsl(var(--border))] mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1"
                    onClick={() => openEditModal(p)}
                  >
                    <Edit2 size={12} />
                    <span>Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[hsl(var(--muted-foreground))] hover:text-red-500"
                    onClick={() => {
                      setSelectedProduct(p);
                      setDeleteModalOpen(true);
                    }}
                    title="Delete product"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Product Add / Edit Radix Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Product Details" : "Register Inventory Item"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveProduct} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                Product / Item Name *
              </label>
              <Input
                type="text"
                placeholder="e.g. Toothbrush Sensitive, Dental Floss 50m"
                value={productForm.name}
                onChange={(e) =>
                  setProductForm({ ...productForm, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                Category
              </label>
              <select
                className="flex h-9 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-1 text-sm text-[hsl(var(--foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                value={productForm.category}
                onChange={(e) =>
                  setProductForm({ ...productForm, category: e.target.value })
                }
              >
                {categories.map((c) => (
                  <option key={c.$id} value={c.name}>
                    {c.name}
                  </option>
                ))}
                {categories.length === 0 && (
                  <>
                    <option value="Supplies">Supplies</option>
                    <option value="Consumables">Consumables</option>
                    <option value="Oral Care">Oral Care</option>
                  </>
                )}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                  Unit Price (₱) *
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={productForm.price}
                  onChange={(e) =>
                    setProductForm({ ...productForm, price: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                  Stock Units *
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={productForm.stock}
                  onChange={(e) =>
                    setProductForm({ ...productForm, stock: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[hsl(var(--border))]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" loading={loading}>
                {isEditing ? "Save Changes" : "Create Product"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Radix Dialog */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove from Inventory</DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to remove{" "}
              <strong className="text-[hsl(var(--foreground))]">
                "{selectedProduct?.name}"
              </strong>{" "}
              from the active product catalog?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteProduct}
              loading={loading}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
