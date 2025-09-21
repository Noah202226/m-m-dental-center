// ServicesData.jsx
"use client";

import { useEffect, useState } from "react";
import { useSettingsStore } from "../../../stores/useSettingStore"; // adjust path if needed

/* ---------- Confirm Modal ---------- */
function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div className="modal modal-open">
      <div className="modal-box bg-black text-yellow-400">
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="py-4 text-gray-300">{message}</p>
        <div className="modal-action">
          <button
            className="btn bg-gray-700 text-yellow-400"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button className="btn bg-yellow-400 text-black" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- SubService item (inline edit) ---------- */
function SubServiceItem({ serviceId, sub, onEditSub, onDeleteSub }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(sub.name);

  return (
    <li className="flex justify-between items-center gap-3">
      <div className="flex-1">
        {editing ? (
          <input
            className="input input-sm input-bordered w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        ) : (
          <span className="text-gray-300">{sub.name}</span>
        )}
      </div>

      <div className="flex gap-2">
        {editing ? (
          <button
            className="btn btn-xs bg-yellow-400 text-black"
            onClick={() => {
              if (!name.trim()) return;
              onEditSub?.(serviceId, sub.id, name);
              setEditing(false);
            }}
          >
            Save
          </button>
        ) : (
          <button
            className="btn btn-xs bg-gray-700 text-yellow-400"
            onClick={() => {
              setName(sub.name);
              setEditing(true);
            }}
          >
            Edit
          </button>
        )}

        <button
          className="btn btn-xs bg-red-600 text-white"
          onClick={() => onDeleteSub?.(serviceId, sub.id)}
        >
          Delete
        </button>
      </div>
    </li>
  );
}

/* ---------- Service item ---------- */
function ServiceItem({
  service,
  isOpen,
  onToggle,
  editingServiceId,
  editServiceName,
  startEditService,
  saveServiceEdit,
  deleteService,
  addSubService,
  editSubService,
  deleteSubService,
}) {
  const [subInput, setSubInput] = useState("");

  return (
    <div className="border border-gray-700 rounded-lg p-3 bg-gray-900">
      <h1>Services Name</h1>
      <p className="text-xs italic">
        Click the service name to view sub services
      </p>
      <div className="flex justify-between items-center gap-4">
        <div className="flex-1">
          {editingServiceId === service.id ? (
            <input
              className="input input-sm input-bordered w-full max-w-md"
              value={editServiceName}
              onChange={(e) => startEditService(service.id, e.target.value)}
            />
          ) : (
            <button
              className="text-left text-yellow-300 font-semibold text-lg hover:underline hover:cursor-pointer"
              onClick={onToggle}
            >
              {service.name}
            </button>
          )}
        </div>

        <div className="flex gap-2">
          {editingServiceId === service.id ? (
            <button
              className="btn btn-xs bg-yellow-400 text-black"
              onClick={() => saveServiceEdit(service.id)}
            >
              Save
            </button>
          ) : (
            <button
              className="btn btn-xs bg-gray-700 text-yellow-400"
              onClick={() => startEditService(service.id, service.name)}
            >
              Edit
            </button>
          )}

          <button
            className="btn btn-xs bg-red-600 text-white"
            onClick={() => deleteService(service.id)}
          >
            Delete
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-3 space-y-3">
          <ul className="list-disc list-inside space-y-2">
            {service.subServices?.length ? (
              service.subServices.map((sub) => (
                <SubServiceItem
                  key={sub.id}
                  serviceId={service.id}
                  sub={sub}
                  onEditSub={editSubService}
                  onDeleteSub={deleteSubService}
                />
              ))
            ) : (
              <li className="text-gray-500 italic">No sub-services yet.</li>
            )}
          </ul>

          <div className="join w-full mt-2">
            <input
              type="text"
              className="input input-bordered join-item w-full"
              placeholder="Add sub-service"
              value={subInput}
              onChange={(e) => setSubInput(e.target.value)}
            />
            <button
              className="btn bg-yellow-400 text-black join-item"
              onClick={() => {
                if (!subInput.trim()) return;
                addSubService?.(service.id, subInput);
                setSubInput("");
              }}
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Main ServicesData (uses settings store) ---------- */
export default function ServicesData() {
  // store methods (may be async depending on your store implementation)
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
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editServiceName, setEditServiceName] = useState("");
  const [openServiceId, setOpenServiceId] = useState(null);
  const [toast, setToast] = useState("");
  const [confirm, setConfirm] = useState({
    isOpen: false,
    type: null, // "service" | "sub"
    serviceId: null,
    subId: null,
  });

  // initial fetch
  useEffect(() => {
    if (typeof fetchServices === "function") fetchServices();
    // otherwise, assume store is pre-populated
  }, [fetchServices]);

  // auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // handlers that use optional chaining (won't throw if store missing)
  const handleAddService = async () => {
    if (!newServiceName.trim()) return setToast("Type a service name");
    await addService?.(newServiceName);
    setNewServiceName("");
    setToast("Service added");
    if (typeof fetchServices === "function") fetchServices();
  };

  const handleSaveServiceEdit = async (id) => {
    if (!editServiceName.trim()) return setToast("Service name required");
    await updateService?.(id, editServiceName);
    setEditingServiceId(null);
    setEditServiceName("");
    setToast("Service updated");
    if (typeof fetchServices === "function") fetchServices();
  };

  const handleAddSub = async (serviceId, name) => {
    if (!name || !name.trim()) return setToast("Sub-service is empty");
    await addSubService?.(serviceId, name);
    setToast("Sub-service added");
    if (typeof fetchServices === "function") fetchServices();
  };

  const handleEditSub = async (serviceId, subId, newName) => {
    if (!newName.trim()) return setToast("Sub-service name required");
    // your store may accept (serviceId, subId, newName) or (subId, newName)
    // try both
    if (updateSubService) {
      await updateSubService(subId, newName).catch(() =>
        updateSubService(serviceId, subId, newName)
      );
    } else {
      await updateSubService?.(serviceId, subId, newName);
    }
    setToast("Sub-service updated");
    if (typeof fetchServices === "function") fetchServices();
  };

  const handleDeleteConfirmed = async () => {
    if (confirm.type === "service") {
      await deleteService?.(confirm.serviceId);
      setToast("Service deleted");
    } else if (confirm.type === "sub") {
      // store may accept just subId
      await deleteSubService?.(confirm.subId ?? confirm.serviceId);
      setToast("Sub-service deleted");
    }
    setConfirm({ isOpen: false, type: null, serviceId: null, subId: null });
    if (typeof fetchServices === "function") fetchServices();
  };

  if (loadingServices) {
    return <p className="text-yellow-400">Loading services...</p>;
  }

  return (
    <div className="card shadow-xl w-full max-w-7xl mx-auto mt-8 bg-black text-yellow-400">
      <div className="card-body">
        <h2 className="card-title">System Settings</h2>
        <p className="text-gray-300">
          Manage services and their sub-services here.
        </p>

        {/* Add Main Service */}
        <div className="join w-full mt-4">
          <input
            type="text"
            className="input input-bordered join-item w-full text-black"
            placeholder="Add new service"
            value={newServiceName}
            onChange={(e) => setNewServiceName(e.target.value)}
          />
          <button
            onClick={handleAddService}
            className="btn bg-yellow-400 text-black join-item"
          >
            Add
          </button>
        </div>

        {/* Services List */}
        <div className="mt-6 space-y-3">
          {services.length === 0 && (
            <p className="italic text-gray-500">No services yet.</p>
          )}

          {services.map((service) => (
            <ServiceItem
              key={service.id}
              service={service}
              isOpen={openServiceId === service.id}
              onToggle={() =>
                setOpenServiceId(
                  openServiceId === service.id ? null : service.id
                )
              }
              editingServiceId={editingServiceId}
              editServiceName={editServiceName}
              startEditService={(id, name) => {
                setEditingServiceId(id);
                setEditServiceName(name);
              }}
              saveServiceEdit={handleSaveServiceEdit}
              deleteService={(id) =>
                setConfirm({
                  isOpen: true,
                  type: "service",
                  serviceId: id,
                  subId: null,
                })
              }
              addSubService={handleAddSub}
              editSubService={handleEditSub}
              deleteSubService={(serviceId, subId) =>
                setConfirm({ isOpen: true, type: "sub", serviceId, subId })
              }
            />
          ))}
        </div>
      </div>

      {/* toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-yellow-400 text-black px-4 py-2 rounded shadow-md z-50">
          {toast}
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirm.isOpen}
        title="Delete Confirmation"
        message="Are you sure you want to delete this item?"
        onConfirm={handleDeleteConfirmed}
        onCancel={() =>
          setConfirm({
            isOpen: false,
            type: null,
            serviceId: null,
            subId: null,
          })
        }
      />
    </div>
  );
}
