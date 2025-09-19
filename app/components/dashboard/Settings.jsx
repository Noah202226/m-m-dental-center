"use client";
import { useState } from "react";

export default function SettingsData() {
  const [services, setServices] = useState([]);
  const [newServiceName, setNewServiceName] = useState("");
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [editServiceName, setEditServiceName] = useState("");

  const [newSubServiceName, setNewSubServiceName] = useState("");
  const [editingSubService, setEditingSubService] = useState(null);

  const [openServiceId, setOpenServiceId] = useState(null);

  // ---- MAIN SERVICES ----
  const addService = () => {
    if (!newServiceName.trim()) return;
    setServices([
      ...services,
      { id: Date.now(), name: newServiceName, subServices: [] },
    ]);
    setNewServiceName("");
  };

  const startEditService = (id, name) => {
    setEditingServiceId(id);
    setEditServiceName(name);
    setOpenServiceId(id); // force open when editing
  };

  const saveServiceEdit = (id) => {
    setServices(
      services.map((s) => (s.id === id ? { ...s, name: editServiceName } : s))
    );
    setEditingServiceId(null);
    setEditServiceName("");
  };

  const deleteService = (id) => {
    setServices(services.filter((s) => s.id !== id));
    if (openServiceId === id) setOpenServiceId(null);
  };

  // ---- SUB-SERVICES ----
  const addSubService = (serviceId) => {
    if (!newSubServiceName.trim()) return;
    setServices(
      services.map((s) =>
        s.id === serviceId
          ? {
              ...s,
              subServices: [
                ...s.subServices,
                { id: Date.now(), name: newSubServiceName },
              ],
            }
          : s
      )
    );
    setNewSubServiceName("");
    setOpenServiceId(serviceId); // keep open when adding
  };

  const startEditSubService = (serviceId, subId, name) => {
    setEditingSubService({ serviceId, subId });
    setNewSubServiceName(name);
    setOpenServiceId(serviceId);
  };

  const saveSubServiceEdit = () => {
    setServices(
      services.map((s) =>
        s.id === editingSubService.serviceId
          ? {
              ...s,
              subServices: s.subServices.map((sub) =>
                sub.id === editingSubService.subId
                  ? { ...sub, name: newSubServiceName }
                  : sub
              ),
            }
          : s
      )
    );
    setEditingSubService(null);
    setNewSubServiceName("");
  };

  const deleteSubService = (serviceId, subId) => {
    setServices(
      services.map((s) =>
        s.id === serviceId
          ? {
              ...s,
              subServices: s.subServices.filter((sub) => sub.id !== subId),
            }
          : s
      )
    );
  };

  return (
    <div className="card shadow-xl w-full max-w-3xl mx-auto mt-8">
      <div className="card-body">
        <h2 className="card-title text-[var(--theme-text)]">System Settings</h2>
        <p>Manage services and their sub-services here.</p>

        {/* Add Main Service */}
        <div className="join w-full mt-4">
          <input
            type="text"
            className="input input-bordered join-item w-full"
            placeholder="Add new service"
            value={newServiceName}
            onChange={(e) => setNewServiceName(e.target.value)}
          />
          <button onClick={addService} className="btn btn-primary join-item">
            Add
          </button>
        </div>

        {/* Services List */}
        <div className="mt-6 space-y-3">
          {services.map((service) => (
            <div
              key={service.id}
              className="collapse collapse-arrow border border-base-300 rounded-lg"
            >
              <input
                type="checkbox"
                checked={openServiceId === service.id}
                onChange={() =>
                  setOpenServiceId(
                    openServiceId === service.id ? null : service.id
                  )
                }
              />
              <div className="collapse-title font-medium flex justify-between items-center">
                {editingServiceId === service.id ? (
                  <input
                    type="text"
                    className="input input-sm input-bordered w-full max-w-xs"
                    value={editServiceName}
                    onChange={(e) => setEditServiceName(e.target.value)}
                  />
                ) : (
                  <span>{service.name}</span>
                )}
                <div className="flex gap-2">
                  {editingServiceId === service.id ? (
                    <button
                      className="btn btn-xs btn-success"
                      onClick={() => saveServiceEdit(service.id)}
                    >
                      Save
                    </button>
                  ) : (
                    <button
                      className="btn btn-xs"
                      onClick={() => startEditService(service.id, service.name)}
                    >
                      Edit
                    </button>
                  )}
                  <button
                    className="btn btn-xs btn-error"
                    onClick={() => deleteService(service.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="collapse-content">
                {/* Sub-services */}
                <ul className="list-disc list-inside space-y-2">
                  {service.subServices.map((sub) => (
                    <li
                      key={sub.id}
                      className="flex justify-between items-center"
                    >
                      {editingSubService &&
                      editingSubService.subId === sub.id ? (
                        <input
                          type="text"
                          className="input input-sm input-bordered w-full max-w-xs"
                          value={newSubServiceName}
                          onChange={(e) => setNewSubServiceName(e.target.value)}
                        />
                      ) : (
                        <span>{sub.name}</span>
                      )}
                      <div className="flex gap-2">
                        {editingSubService &&
                        editingSubService.subId === sub.id ? (
                          <button
                            className="btn btn-xs btn-success"
                            onClick={saveSubServiceEdit}
                          >
                            Save
                          </button>
                        ) : (
                          <button
                            className="btn btn-xs"
                            onClick={() =>
                              startEditSubService(service.id, sub.id, sub.name)
                            }
                          >
                            Edit
                          </button>
                        )}
                        <button
                          className="btn btn-xs btn-error"
                          onClick={() => deleteSubService(service.id, sub.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Add Sub-service */}
                <div className="join w-full mt-3">
                  <input
                    type="text"
                    className="input input-bordered join-item w-full"
                    placeholder="Add sub-service"
                    value={editingSubService ? "" : newSubServiceName}
                    onChange={(e) => setNewSubServiceName(e.target.value)}
                  />
                  <button
                    className="btn btn-primary join-item"
                    onClick={() => addSubService(service.id)}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
