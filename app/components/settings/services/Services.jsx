"use client";

import { useEffect, useState } from "react";
import { useSettingsStore } from "../../../stores/useSettingStore";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../ui/Card";
import { Button } from "../../ui/Button";
import { Badge } from "../../ui/Badge";
import { Input } from "../../ui/Input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../ui/Dialog";
import {
  Stethoscope,
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Info,
  Sparkles,
  Layers,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

const PRESET_CATEGORIES = [
  "Orthodontics",
  "Oral Surgery",
  "Restorative Dentistry",
  "Prosthodontics",
  "Endodontics",
  "Periodontics",
  "Cosmetic Dentistry",
  "General Consultation",
  "Pediatric Dentistry",
];

export default function ServicesData() {
  const {
    services = [],
    fetchServices,
    addService,
    updateService,
    deleteService,
    addSubService,
    updateSubService,
    deleteSubService,
    loadingServices,
  } = useSettingsStore();

  const [newServiceName, setNewServiceName] = useState("");
  const [addingService, setAddingService] = useState(false);

  // Accordion state (set of open service IDs)
  const [openServices, setOpenServices] = useState(new Set());

  // Inline edit states
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editServiceName, setEditServiceName] = useState("");

  const [editingSubId, setEditingSubId] = useState(null);
  const [editSubName, setEditSubName] = useState("");

  // Sub-procedure input per service
  const [subInputs, setSubInputs] = useState({});

  // Confirmation modal
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: null, // "service" | "sub"
    id: null,
    parentId: null,
    name: "",
  });

  useEffect(() => {
    if (typeof fetchServices === "function") {
      fetchServices();
    }
  }, [fetchServices]);

  // Open first service by default once loaded
  useEffect(() => {
    if (services.length > 0 && openServices.size === 0) {
      setOpenServices(new Set([services[0].id]));
    }
  }, [services]);

  const toggleAccordion = (id) => {
    setOpenServices((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddMainService = async (e) => {
    e?.preventDefault();
    const trimmed = newServiceName.trim();
    if (!trimmed) {
      toast.error("Please enter a service category name");
      return;
    }

    try {
      setAddingService(true);
      await addService(trimmed);
      setNewServiceName("");
      toast.success(`Service category "${trimmed}" added! 🦷`, {
        description: "You can now define sub-procedures for this specialty.",
      });
      // Open the newly added category
      if (typeof fetchServices === "function") await fetchServices();
    } catch (err) {
      console.error("Error adding service:", err);
      toast.error("Failed to add service category");
    } finally {
      setAddingService(false);
    }
  };

  const handleSaveServiceEdit = async (id) => {
    const trimmed = editServiceName.trim();
    if (!trimmed) return toast.error("Service name cannot be blank");
    try {
      await updateService(id, trimmed);
      setEditingServiceId(null);
      setEditServiceName("");
      toast.success("Service category updated! ✏️");
    } catch {
      toast.error("Failed to update service");
    }
  };

  const handleAddSubProcedure = async (serviceId) => {
    const inputVal = (subInputs[serviceId] || "").trim();
    if (!inputVal) return toast.error("Please enter a sub-procedure name");

    try {
      await addSubService(serviceId, inputVal);
      setSubInputs((prev) => ({ ...prev, [serviceId]: "" }));
      toast.success(`Procedure "${inputVal}" added! ✨`, {
        description: "Available immediately in patient registration.",
      });
    } catch {
      toast.error("Failed to add procedure");
    }
  };

  const handleSaveSubEdit = async (serviceId, subId) => {
    const trimmed = editSubName.trim();
    if (!trimmed) return toast.error("Procedure name cannot be blank");
    try {
      if (updateSubService) {
        await updateSubService(subId, trimmed).catch(() =>
          updateSubService(serviceId, subId, trimmed)
        );
      }
      setEditingSubId(null);
      setEditSubName("");
      toast.success("Procedure updated! ✏️");
    } catch {
      toast.error("Failed to update procedure");
    }
  };

  const handleConfirmDelete = async () => {
    try {
      if (confirmDialog.type === "service") {
        await deleteService(confirmDialog.id);
        toast.success(`Category "${confirmDialog.name}" deleted 🗑️`, {
          description: "All sub-procedures under this service were also removed.",
        });
      } else if (confirmDialog.type === "sub") {
        await deleteSubService(confirmDialog.id);
        toast.success(`Sub-procedure "${confirmDialog.name}" removed 🗑️`);
      }
    } catch {
      toast.error("Failed to delete item");
    } finally {
      setConfirmDialog({ isOpen: false, type: null, id: null, parentId: null, name: "" });
    }
  };

  return (
    <div className="space-y-6">
      {/* 📘 Instructional Guide Banner */}
      <Card className="border-amber-500/30 bg-amber-500/5 overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
              <Info className="h-5 w-5" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">
                  How Dental Services & Procedures Work
                </h3>
                <Badge variant="default" className="text-[10px]">
                  Catalog Guide
                </Badge>
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
                Configure your clinic's treatments in a 2-tier hierarchy to make patient registration and billing effortless:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                <div className="p-2.5 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
                  <span className="font-bold text-amber-500 block mb-0.5">
                    1. Main Department
                  </span>
                  <span className="text-[11px] text-[hsl(var(--muted-foreground))]">
                    Broad category, e.g. <i>Orthodontics</i> or <i>Restorative Care</i>.
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
                  <span className="font-bold text-amber-500 block mb-0.5">
                    2. Specific Procedure
                  </span>
                  <span className="text-[11px] text-[hsl(var(--muted-foreground))]">
                    Billable treatments, e.g. <i>Metal Braces</i> or <i>Composite Filling</i>.
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
                  <span className="font-bold text-emerald-500 block mb-0.5">
                    3. Auto-populated
                  </span>
                  <span className="text-[11px] text-[hsl(var(--muted-foreground))]">
                    Procedures instantly sync with Patient Intake and Billing dropdowns.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ➕ Add New Service Category Panel */}
      <Card className="border-[hsl(var(--border))]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-[hsl(var(--foreground))]">
            <Layers className="h-4 w-4 text-amber-500" />
            <span>Create New Service Category</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Add a main dental department or treatment classification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <form onSubmit={handleAddMainService} className="flex gap-2">
            <div className="relative flex-1">
              <Stethoscope className="absolute left-3 top-2.5 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <Input
                type="text"
                placeholder="e.g. Endodontics, Oral Surgery, Teeth Whitening..."
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                className="pl-9 h-10 text-sm"
              />
            </div>
            <Button type="submit" loading={addingService} className="gap-1.5 h-10 shrink-0">
              <Plus size={16} />
              <span>Add Category</span>
            </Button>
          </form>

          {/* Quick preset suggestions */}
          <div>
            <span className="text-[11px] text-[hsl(var(--muted-foreground))] block mb-1.5 flex items-center gap-1">
              <Sparkles size={12} className="text-amber-500" /> Suggested Dental Specialties:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setNewServiceName(cat)}
                  className="px-2.5 py-1 text-[11px] rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50 hover:bg-amber-500/15 hover:text-amber-500 hover:border-amber-500/40 text-[hsl(var(--foreground))] transition-colors cursor-pointer"
                >
                  +{cat}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 📋 Master Services & Sub-procedures List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[hsl(var(--foreground))]">
              Configured Dental Catalog
            </h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              Click any service category to manage its specific sub-procedures
            </p>
          </div>
          <Badge variant="outline" className="text-xs">
            {services.length} Categories Active
          </Badge>
        </div>

        {loadingServices ? (
          <div className="p-12 text-center text-xs text-[hsl(var(--muted-foreground))]">
            Loading dental services catalog...
          </div>
        ) : services.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <Stethoscope className="h-10 w-10 mx-auto text-[hsl(var(--muted-foreground))] mb-2 opacity-50" />
            <p className="text-xs font-semibold text-[hsl(var(--foreground))]">
              No service categories configured yet
            </p>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">
              Use the form above or pick a suggested specialty to begin setting up your clinic catalog.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {services.map((service) => {
              const isOpen = openServices.has(service.id);
              const subCount = service.subServices?.length || 0;
              const isEditing = editingServiceId === service.id;

              return (
                <Card
                  key={service.id}
                  className={`transition-all duration-150 border ${
                    isOpen
                      ? "border-amber-500/40 shadow-sm ring-1 ring-amber-500/20"
                      : "border-[hsl(var(--border))] hover:border-[hsl(var(--border))]/80"
                  }`}
                >
                  {/* Category Header */}
                  <div className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleAccordion(service.id)}
                        className="p-1 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
                      >
                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>

                      {isEditing ? (
                        <div className="flex items-center gap-2 flex-1 max-w-md">
                          <Input
                            value={editServiceName}
                            onChange={(e) => setEditServiceName(e.target.value)}
                            className="h-8 text-sm font-semibold"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            className="h-8 px-2.5"
                            onClick={() => handleSaveServiceEdit(service.id)}
                          >
                            <Check size={14} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5"
                            onClick={() => {
                              setEditingServiceId(null);
                              setEditServiceName("");
                            }}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      ) : (
                        <div
                          className="cursor-pointer flex items-center gap-2.5 min-w-0"
                          onClick={() => toggleAccordion(service.id)}
                        >
                          <span className="font-bold text-sm sm:text-base text-[hsl(var(--foreground))] hover:text-amber-500 transition-colors truncate">
                            {service.name}
                          </span>
                          <Badge
                            variant={subCount > 0 ? "secondary" : "outline"}
                            className="text-[10px] shrink-0 font-medium"
                          >
                            {subCount} {subCount === 1 ? "Procedure" : "Procedures"}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isEditing && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[hsl(var(--muted-foreground))] hover:text-amber-500"
                          onClick={() => {
                            setEditingServiceId(service.id);
                            setEditServiceName(service.name);
                          }}
                          title="Rename Category"
                        >
                          <Edit2 size={14} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-[hsl(var(--muted-foreground))] hover:text-red-500"
                        onClick={() =>
                          setConfirmDialog({
                            isOpen: true,
                            type: "service",
                            id: service.id,
                            parentId: null,
                            name: service.name,
                          })
                        }
                        title="Delete Category"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>

                  {/* Accordion Content (Sub-procedures) */}
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 border-t border-[hsl(var(--border))] space-y-3 bg-[hsl(var(--muted))]/20">
                      {/* Sub-procedure Input Bar */}
                      <div className="pt-2">
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder={`Add specific procedure under "${service.name}"...`}
                            value={subInputs[service.id] || ""}
                            onChange={(e) =>
                              setSubInputs((prev) => ({
                                ...prev,
                                [service.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddSubProcedure(service.id);
                              }
                            }}
                            className="h-9 text-xs bg-[hsl(var(--background))]"
                          />
                          <Button
                            size="sm"
                            className="h-9 gap-1 shrink-0"
                            onClick={() => handleAddSubProcedure(service.id)}
                          >
                            <Plus size={14} />
                            <span>Add Procedure</span>
                          </Button>
                        </div>
                        <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-1">
                          Press Enter or click "Add Procedure" to append to {service.name}
                        </p>
                      </div>

                      {/* Sub-procedure Items */}
                      {subCount > 0 ? (
                        <div className="space-y-1.5 pt-1">
                          {service.subServices.map((sub) => {
                            const isEditingThisSub = editingSubId === sub.id;

                            return (
                              <div
                                key={sub.id}
                                className="flex items-center justify-between p-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:bg-[hsl(var(--accent))]/50 transition-colors"
                              >
                                {isEditingThisSub ? (
                                  <div className="flex items-center gap-2 flex-1 mr-2">
                                    <Input
                                      value={editSubName}
                                      onChange={(e) => setEditSubName(e.target.value)}
                                      className="h-8 text-xs font-medium"
                                      autoFocus
                                    />
                                    <Button
                                      size="sm"
                                      className="h-8 px-2"
                                      onClick={() => handleSaveSubEdit(service.id, sub.id)}
                                    >
                                      <Check size={13} />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 px-2"
                                      onClick={() => {
                                        setEditingSubId(null);
                                        setEditSubName("");
                                      }}
                                    >
                                      <X size={13} />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <ArrowRight size={12} className="text-amber-500 shrink-0" />
                                    <span className="text-xs font-medium text-[hsl(var(--foreground))] truncate">
                                      {sub.name}
                                    </span>
                                  </div>
                                )}

                                <div className="flex items-center gap-1 shrink-0">
                                  {!isEditingThisSub && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-[hsl(var(--muted-foreground))] hover:text-amber-500"
                                      onClick={() => {
                                        setEditingSubId(sub.id);
                                        setEditSubName(sub.name);
                                      }}
                                      title="Edit procedure"
                                    >
                                      <Edit2 size={12} />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-[hsl(var(--muted-foreground))] hover:text-red-500"
                                    onClick={() =>
                                      setConfirmDialog({
                                        isOpen: true,
                                        type: "sub",
                                        id: sub.id,
                                        parentId: service.id,
                                        name: sub.name,
                                      })
                                    }
                                    title="Delete procedure"
                                  >
                                    <Trash2 size={12} />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 text-center border border-dashed border-[hsl(var(--border))] rounded-lg">
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">
                            No specific procedures configured under {service.name} yet.
                          </p>
                          <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
                            Type a procedure name above (e.g. "Root Canal Therapy") and click "Add Procedure".
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ⚠️ Accessible Radix Delete Confirmation Modal */}
      <Dialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) =>
          !open &&
          setConfirmDialog({
            isOpen: false,
            type: null,
            id: null,
            parentId: null,
            name: "",
          })
        }
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription className="pt-1">
              {confirmDialog.type === "service" ? (
                <>
                  Are you sure you want to delete the category{" "}
                  <strong className="text-[hsl(var(--foreground))]">"{confirmDialog.name}"</strong>?
                  <span className="block text-red-400 mt-2 text-xs">
                    Warning: All nested procedures under this category will also be removed.
                  </span>
                </>
              ) : (
                <>
                  Are you sure you want to remove the procedure{" "}
                  <strong className="text-[hsl(var(--foreground))]">"{confirmDialog.name}"</strong>?
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setConfirmDialog({
                  isOpen: false,
                  type: null,
                  id: null,
                  parentId: null,
                  name: "",
                })
              }
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
