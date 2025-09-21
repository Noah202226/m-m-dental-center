"use client";

import { useState, useEffect } from "react";
import { FiSearch, FiUser, FiTrash2 } from "react-icons/fi";

import InstallmentsPanel from "./actions/InstallmentsPanel";

import { usePatientStore } from "../../stores/usePatientStore";

export default function PatientsLayout() {
  // const [patients, setPatients] = useState([]);
  // const [selectedPatient, setSelectedPatient] = useState(null);
  const [search, setSearch] = useState("");
  // const [loading, setLoading] = useState(true);

  const {
    patients,
    fetchPatients,
    loading,
    selectedPatient,
    setSelectedPatient,
    deletePatient,
  } = usePatientStore();

  const filteredPatients = patients.filter((p) =>
    [p.name, p.serviceName, p.address]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-9rem)] bg-black text-gray-200">
      {/* Left: Patients List */}
      <aside className="w-full md:w-1/3 border-r border-gray-800 flex flex-col">
        <div className="sticky top-0 bg-black p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <FiSearch className="text-yellow-400" />
            <input
              type="text"
              placeholder="Search patients..."
              className="input input-sm w-full bg-gray-800 text-gray-200 border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="max-h-30 md:max-h-110 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <p className="text-gray-500 text-sm">Loading patients...</p>
          ) : filteredPatients.length > 0 ? (
            filteredPatients.map((p) => (
              <div
                key={p.$id}
                className={`flex items-center justify-between w-full p-3 rounded-lg transition ${
                  selectedPatient?.$id === p.$id
                    ? "bg-yellow-500 text-black"
                    : "bg-gray-800 text-white hover:bg-gray-700"
                }`}
              >
                <button
                  onClick={() => setSelectedPatient(p)}
                  className="flex-1 text-left"
                >
                  <h3 className="font-semibold">{p.patientName}</h3>
                  <p className="text-sm opacity-75">{p.address}</p>
                  <p className="text-sm opacity-75">{p.serviceName}</p>
                  <p className="text-sm opacity-75">{p.serviceType}</p>
                </button>
                <button
                  onClick={() => {
                    deletePatient(p.$id);
                  }}
                  className="ml-2 text-red-400 hover:text-red-600"
                  title="Delete Patient"
                >
                  <FiTrash2 />
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No patients found.</p>
          )}
        </div>
      </aside>

      {/* Right: Patient Details */}
      <main className="flex-1 p-6 overflow-y-auto">
        {selectedPatient ? (
          <div className="space-y-4">
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-md">
              <h2 className="text-2xl font-bold text-yellow-400 mb-3">
                {selectedPatient.name}
              </h2>
              <p className="text-gray-300">
                <span className="font-semibold">Age:</span>{" "}
                {selectedPatient.age}
              </p>
              <p className="text-gray-300">
                <span className="font-semibold">Service:</span>{" "}
                {selectedPatient.serviceName}
              </p>
            </div>

            <InstallmentsPanel
              patient={selectedPatient}
              fetchPatients={fetchPatients}
            />
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <FiUser className="mr-2" /> Select a patient to view details
          </div>
        )}
      </main>
    </div>
  );
}
