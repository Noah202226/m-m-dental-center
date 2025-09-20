"use client";
import { useEffect, useState, useCallback } from "react";
import { databases, DATABASE_ID, ID } from "../../../lib/appwrite";

const SERVICES_COLLECTION_ID = "services";
const SUB_SERVICES_COLLECTION_ID = "subServices";

function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div className="modal modal-open">
      <div className="modal-box bg-black text-yellow-400">
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="py-4">{message}</p>
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

function SubServiceItem({ serviceId, sub, editSubService, deleteSubService }) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(sub.name);

  return (
    <li className="flex justify-between items-center">
      {editing ? (
        <input
          type="text"
          className="input input-sm input-bordered w-full max-w-xs"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
        />
      ) : (
        <span>{sub.name}</span>
      )}
      <div className="flex gap-2">
        {editing ? (
          <button
            className="btn btn-xs bg-yellow-400 text-black"
            onClick={() => {
              editSubService(serviceId, sub.id, editName);
              setEditing(false);
            }}
          >
            Save
          </button>
        ) : (
          <button
            className="btn btn-xs bg-gray-700 text-yellow-400"
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
        )}
        <button
          className="btn btn-xs bg-red-600 text-white"
          onClick={() => deleteSubService(serviceId, sub.id)}
        >
          Delete
        </button>
      </div>
    </li>
  );
}

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
    <div className="border border-gray-700 rounded-lg p-3">
      <div className="flex justify-between items-center">
        {editingServiceId === service.id ? (
          <input
            type="text"
            className="input input-sm input-bordered w-full max-w-xs"
            value={editServiceName}
            onChange={(e) => startEditService(service.id, e.target.value, true)}
          />
        ) : (
          <span
            className="font-bold text-2xl cursor-pointer text-yellow-400"
            onClick={onToggle}
          >
            {service.name}
          </span>
        )}
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
            {service.subServices.map((sub) => (
              <SubServiceItem
                key={sub.id}
                serviceId={service.id}
                sub={sub}
                editSubService={editSubService}
                deleteSubService={deleteSubService}
              />
            ))}
          </ul>

          <div className="join w-full">
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
                addSubService(service.id, subInput);
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

export default function ServicesData() {
  const [services, setServices] = useState([]);
  const [newServiceName, setNewServiceName] = useState("");
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editServiceName, setEditServiceName] = useState("");
  const [openServiceId, setOpenServiceId] = useState(null);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);

  const [confirm, setConfirm] = useState({
    isOpen: false,
    type: null,
    serviceId: null,
    subId: null,
  });

  // 🔄 reusable fetch function
  const fetchData = useCallback(async () => {
    try {
      const servicesRes = await databases.listDocuments(
        DATABASE_ID,
        SERVICES_COLLECTION_ID
      );
      const subRes = await databases.listDocuments(
        DATABASE_ID,
        SUB_SERVICES_COLLECTION_ID
      );

      const subByService = {};
      subRes.documents.forEach((sub) => {
        if (!subByService[sub.serviceId]) {
          subByService[sub.serviceId] = [];
        }
        subByService[sub.serviceId].push({
          id: sub.$id,
          name: sub.subServiceName,
        });
      });

      const combined = servicesRes.documents.map((s) => ({
        id: s.$id,
        name: s.serviceName,
        subServices: subByService[s.$id] || [],
      }));

      setServices(combined);
    } catch (error) {
      console.error("Error fetching services:", error);
      setToast("Failed to load services!");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ---- SERVICES CRUD ----
  const addService = async () => {
    if (!newServiceName.trim()) return;
    try {
      await databases.createDocument(
        DATABASE_ID,
        SERVICES_COLLECTION_ID,
        ID.unique(),
        {
          serviceName: newServiceName,
        }
      );
      setNewServiceName("");
      setToast("Service added successfully!");
      fetchData(); // 🔄 refresh
    } catch (error) {
      console.error("Add service error:", error);
      setToast("Failed to add service!");
    }
  };

  const saveServiceEdit = async (id) => {
    try {
      await databases.updateDocument(DATABASE_ID, SERVICES_COLLECTION_ID, id, {
        serviceName: editServiceName,
      });
      setToast("Service updated!");
      fetchData(); // 🔄 refresh
    } catch (error) {
      console.error("Update service error:", error);
      setToast("Failed to update service!");
    } finally {
      setEditingServiceId(null);
      setEditServiceName("");
    }
  };

  const deleteService = async (id) => {
    try {
      await databases.deleteDocument(DATABASE_ID, SERVICES_COLLECTION_ID, id);
      setToast("Service deleted!");
      fetchData(); // 🔄 refresh
    } catch (error) {
      console.error("Delete service error:", error);
      setToast("Failed to delete service!");
    }
  };

  // ---- SUB-SERVICES CRUD ----
  const addSubService = async (serviceId, name) => {
    if (!name.trim()) return;
    try {
      await databases.createDocument(
        DATABASE_ID,
        SUB_SERVICES_COLLECTION_ID,
        ID.unique(),
        {
          serviceId,
          subServiceName: name,
        }
      );
      setToast("Sub-service added!");
      fetchData(); // 🔄 refresh
    } catch (error) {
      console.error("Add sub-service error:", error);
      setToast("Failed to add sub-service!");
    }
  };

  const editSubService = async (serviceId, subId, newName) => {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        SUB_SERVICES_COLLECTION_ID,
        subId,
        {
          subServiceName: newName,
        }
      );
      setToast("Sub-service updated!");
      fetchData(); // 🔄 refresh
    } catch (error) {
      console.error("Update sub-service error:", error);
      setToast("Failed to update sub-service!");
    }
  };

  const deleteSubService = async (serviceId, subId) => {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        SUB_SERVICES_COLLECTION_ID,
        subId
      );
      setToast("Sub-service deleted!");
      fetchData(); // 🔄 refresh
    } catch (error) {
      console.error("Delete sub-service error:", error);
      setToast("Failed to delete sub-service!");
    }
  };

  const handleConfirm = () => {
    if (confirm.type === "service") {
      deleteService(confirm.serviceId);
    } else if (confirm.type === "sub") {
      deleteSubService(confirm.serviceId, confirm.subId);
    }
    setConfirm({ isOpen: false, type: null, serviceId: null, subId: null });
  };

  if (loading) {
    return <p className="text-yellow-400">Loading services...</p>;
  }

  return (
    <div className="card shadow-xl w-full max-w-7xl mx-auto mt-8 bg-black text-yellow-400">
      <div className="card-body">
        <h2 className="card-title">System Settings</h2>
        <p>Manage services and their sub-services here.</p>

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
            onClick={addService}
            className="btn bg-yellow-400 text-black join-item"
          >
            Add
          </button>
        </div>

        {/* Services List */}
        <div className="mt-6 space-y-3">
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
              startEditService={(id, name, typing = false) => {
                setEditingServiceId(id);
                setEditServiceName(name);
              }}
              saveServiceEdit={saveServiceEdit}
              deleteService={(id) =>
                setConfirm({ isOpen: true, type: "service", serviceId: id })
              }
              addSubService={addSubService}
              editSubService={editSubService}
              deleteSubService={(serviceId, subId) =>
                setConfirm({ isOpen: true, type: "sub", serviceId, subId })
              }
            />
          ))}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 bg-yellow-400 text-black px-4 py-2 rounded shadow-md z-50 animate-fade-in">
          {toast}
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirm.isOpen}
        title="Delete Confirmation"
        message="Are you sure you want to delete this item?"
        onConfirm={handleConfirm}
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
