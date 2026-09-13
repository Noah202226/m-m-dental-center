"use client";

import { useState, useEffect, useCallback } from "react";
import { databases, DATABASE_ID, ID } from "../../lib/appwrite";
import { Permission, Role, Query } from "appwrite";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/Dialog";
import {
  UserCheck,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  XCircle,
  Stethoscope,
  Power,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

const COLLECTION_ID = "dentists";

export default function DentistsTab() {
  const [dentists, setDentists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // New Dentist Form State
  const [newName, setNewName] = useState("");
  const [newIsActive, setNewIsActive] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Edit Modal State
  const [editingDentist, setEditingDentist] = useState(null);
  const [editName, setEditName] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Modal State
  const [deletingDentist, setDeletingDentist] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch Dentists from Appwrite
  const fetchDentists = useCallback(async () => {
    try {
      setLoading(true);
      const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
        Query.orderAsc("$createdAt"),
      ]);
      setDentists(res.documents || []);
    } catch (err) {
      console.error("Failed to load dentists:", err);
      toast.error("Failed to load clinical dentists list");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDentists();
  }, [fetchDentists]);

  // Add Dentist
  const handleAddDentist = async (e) => {
    if (e) e.preventDefault();
    if (!newName.trim()) {
      return toast.error("Please enter the dentist's full name & title");
    }

    setIsAdding(true);
    try {
      const permissions = [
        Permission.read(Role.any()),
        Permission.create(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any()),
      ];

      const doc = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          name: newName.trim(),
          isActive: newIsActive,
        },
        permissions
      );

      setDentists((prev) => [...prev, doc]);
      setNewName("");
      setNewIsActive(true);
      toast.success(`Practitioner "${doc.name}" registered! 👨‍⚕️`, {
        description: doc.isActive ? "Available for appointment assignment." : "Saved as inactive.",
      });
    } catch (err) {
      console.error("Error creating dentist:", err);
      toast.error("Could not add dentist profile");
    } finally {
      setIsAdding(false);
    }
  };

  // Quick Toggle Active Status
  const handleToggleStatus = async (dentist) => {
    const updatedStatus = !dentist.isActive;
    try {
      // Optimistic update
      setDentists((prev) =>
        prev.map((d) => (d.$id === dentist.$id ? { ...d, isActive: updatedStatus } : d))
      );

      await databases.updateDocument(DATABASE_ID, COLLECTION_ID, dentist.$id, {
        isActive: updatedStatus,
      });

      toast.success(
        `${dentist.name} is now ${updatedStatus ? "Active" : "Inactive"}`
      );
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Failed to update status");
      // Revert optimistic update
      fetchDentists();
    }
  };

  // Open Edit Modal
  const openEditModal = (dentist) => {
    setEditingDentist(dentist);
    setEditName(dentist.name);
    setEditIsActive(dentist.isActive ?? true);
  };

  // Save Edit
  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      return toast.error("Dentist name cannot be empty");
    }

    setIsUpdating(true);
    try {
      const updated = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        editingDentist.$id,
        {
          name: editName.trim(),
          isActive: editIsActive,
        }
      );

      setDentists((prev) =>
        prev.map((d) => (d.$id === updated.$id ? updated : d))
      );
      toast.success("Dentist profile updated! ✨");
      setEditingDentist(null);
    } catch (err) {
      console.error("Failed to update dentist:", err);
      toast.error("Error saving changes");
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete Dentist
  const handleDeleteDentist = async () => {
    if (!deletingDentist) return;
    setIsDeleting(true);
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, deletingDentist.$id);
      setDentists((prev) => prev.filter((d) => d.$id !== deletingDentist.$id));
      toast.success(`Removed "${deletingDentist.name}" 🗑️`);
      setDeletingDentist(null);
    } catch (err) {
      console.error("Failed to delete dentist:", err);
      toast.error("Could not remove dentist profile");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredDentists = dentists.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2 text-[hsl(var(--foreground))]">
            <UserCheck className="h-4 w-4 text-amber-500" />
            <span>Dental Practitioners & Doctors</span>
          </h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
            Manage practicing dentists who handle appointments, patient treatments, and clinical consultations
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchDentists}
          disabled={loading}
          className="gap-1.5 self-start sm:self-auto text-xs"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          <span>Refresh List</span>
        </Button>
      </div>

      {/* Add Dentist Card */}
      <div className="p-4 rounded-xl bg-[hsl(var(--muted))]/40 border border-[hsl(var(--border))] space-y-3">
        <span className="text-xs font-semibold text-[hsl(var(--foreground))] flex items-center gap-1.5">
          <Plus size={14} className="text-amber-500" />
          <span>Register New Dentist</span>
        </span>
        <form onSubmit={handleAddDentist} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Stethoscope className="absolute left-3 top-2.5 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
            <Input
              type="text"
              placeholder="Doctor's Name & Title (e.g. Dr. Jane Cruz, DMD)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={isAdding}
              className="pl-9 text-sm h-10"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-[hsl(var(--muted-foreground))] cursor-pointer select-none px-1">
            <input
              type="checkbox"
              checked={newIsActive}
              onChange={(e) => setNewIsActive(e.target.checked)}
              disabled={isAdding}
              className="checkbox checkbox-sm checkbox-warning rounded"
            />
            <span>Active for Appointments</span>
          </label>

          <Button type="submit" loading={isAdding} className="gap-1.5 h-10 shrink-0">
            <Plus size={16} />
            <span>Add Dentist</span>
          </Button>
        </form>
      </div>

      {/* Search & Directory */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
            <Input
              type="text"
              placeholder="Search doctors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            Total: <span className="font-semibold text-[hsl(var(--foreground))]">{dentists.length}</span> practitioners
          </span>
        </div>

        {/* Dentists List */}
        {loading ? (
          <div className="p-10 text-center text-xs text-[hsl(var(--muted-foreground))] border border-dashed border-[hsl(var(--border))] rounded-xl">
            Loading practitioners...
          </div>
        ) : filteredDentists.length === 0 ? (
          <div className="p-10 text-center text-xs text-[hsl(var(--muted-foreground))] border border-dashed border-[hsl(var(--border))] rounded-xl">
            {search ? "No doctors match your search query." : "No dentists registered yet. Add one above!"}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredDentists.map((dentist) => (
              <div
                key={dentist.$id}
                className="p-3.5 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] flex items-center justify-between gap-3 hover:border-amber-500/40 transition-all shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    dentist.isActive
                      ? "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                      : "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))]"
                  }`}>
                    {dentist.name.replace(/^Dr\.\s*/i, "").charAt(0).toUpperCase() || "D"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[hsl(var(--foreground))] truncate">
                      {dentist.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        variant={dentist.isActive ? "success" : "outline"}
                        className="text-[10px] px-1.5 py-0 h-4"
                      >
                        {dentist.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                        {dentist.isActive ? "Accepting patients" : "On leave / off-duty"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Quick Toggle Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleStatus(dentist)}
                    className={`h-8 w-8 ${
                      dentist.isActive
                        ? "text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                        : "text-[hsl(var(--muted-foreground))] hover:text-amber-500 hover:bg-amber-500/10"
                    }`}
                    title={dentist.isActive ? "Set Inactive" : "Set Active"}
                  >
                    <Power size={14} />
                  </Button>

                  {/* Edit Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditModal(dentist)}
                    className="h-8 w-8 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                    title="Edit Doctor"
                  >
                    <Edit2 size={14} />
                  </Button>

                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeletingDentist(dentist)}
                    className="h-8 w-8 text-[hsl(var(--muted-foreground))] hover:text-red-500"
                    title="Remove Doctor"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dentist Modal */}
      <Dialog open={!!editingDentist} onOpenChange={(open) => !open && setEditingDentist(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-4 w-4 text-amber-500" />
              <span>Edit Practitioner Profile</span>
            </DialogTitle>
            <DialogDescription>
              Update the name, credentials, or clinical availability status for this dentist.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                Doctor Full Name & Title
              </label>
              <Input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={isUpdating}
              />
            </div>

            <label className="flex items-center gap-2.5 p-3 rounded-lg bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))] cursor-pointer">
              <input
                type="checkbox"
                checked={editIsActive}
                onChange={(e) => setEditIsActive(e.target.checked)}
                disabled={isUpdating}
                className="checkbox checkbox-sm checkbox-warning rounded"
              />
              <div>
                <p className="text-xs font-semibold text-[hsl(var(--foreground))]">
                  Active Clinical Duty
                </p>
                <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                  When active, this practitioner appears in appointment assignment dropdowns and public bookings.
                </p>
              </div>
            </label>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingDentist(null)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} loading={isUpdating}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deletingDentist} onOpenChange={(open) => !open && setDeletingDentist(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <Trash2 className="h-4 w-4 text-red-500" />
              <span>Remove Dental Practitioner?</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <strong className="text-[hsl(var(--foreground))]">
                {deletingDentist?.name}
              </strong>{" "}
              from the clinic system? Existing historical appointment records will remain unaffected.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingDentist(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDentist}
              loading={isDeleting}
            >
              Confirm Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
