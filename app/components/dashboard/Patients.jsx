"use client";

import { useState } from "react";
import { FiSearch, FiUser, FiTrash2 } from "react-icons/fi";
import InstallmentsPanel from "./actions/InstallmentsPanel";
import { usePatientStore } from "../../stores/usePatientStore";
import TransactionsPanel from "./actions/TransactionPanel";

export default function PatientsLayout() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleSelect = (p) => {
    setSelectedPatient(p);

    // only open modal if on mobile
    if (window.innerWidth < 768) {
      setIsModalOpen(true);
    }
  };

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

        <div className="max-h-full md:max-h-full overflow-y-auto p-2 space-y-1">
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
                  onClick={() => handleSelect(p)}
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

      {/* Right: Patient Details (Desktop only) */}
      <main className="hidden md:block flex-1 p-2 overflow-y-auto">
        {selectedPatient ? (
          <PatientDetails
            patient={selectedPatient}
            fetchPatients={fetchPatients}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <FiUser className="mr-2" /> Select a patient to view details
          </div>
        )}
      </main>

      {/* Mobile Modal */}
      {isModalOpen && selectedPatient && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 w-[90%] max-h-[90vh] overflow-y-auto rounded-xl p-6 shadow-xl border border-yellow-500/40">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-yellow-400 hover:text-yellow-600"
            >
              ✕
            </button>
            <PatientDetails
              patient={selectedPatient}
              fetchPatients={fetchPatients}
            />
          </div>
        </div>
      )}
    </div>
  );
}
function PatientDetails({ patient, fetchPatients }) {
  return (
    <div className="space-y-0">
      {/* Patient Info + Installment Summary */}
      <div className="bg-black p-3 rounded-2xl border border-yellow-500/40 shadow-lg">
        <h2 className="text-3xl font-extrabold text-yellow-400 mb-4">
          {patient.patientName}
        </h2>

        {/* Grid: 1 column on mobile, 2 columns on md+ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {/* Left: Patient Info */}
          <div className="space-y-2">
            <p className="text-gray-300">
              <span className="font-semibold text-yellow-400">Age:</span>{" "}
              {patient.patientAge}
            </p>
            <p className="text-gray-300">
              <span className="font-semibold text-yellow-400">Gender:</span>{" "}
              {patient.gender}
            </p>
            <p className="text-gray-300">
              <span className="font-semibold text-yellow-400">Contact:</span>{" "}
              {patient.contact}
            </p>
            <p className="text-gray-300">
              <span className="font-semibold text-yellow-400">Address:</span>{" "}
              {patient.address}
            </p>
            <p className="text-gray-300">
              <span className="font-semibold text-yellow-400">Service:</span>{" "}
              {patient.serviceName}
            </p>
            <p className="text-gray-300">
              <span className="font-semibold text-yellow-400">
                Sub-service:
              </span>{" "}
              {patient.subServiceName || "-"}
            </p>
            <p className="text-gray-300">
              <span className="font-semibold text-yellow-400">Price:</span> ₱
              {patient.servicePrice}
            </p>
          </div>

          {/* Right: Installment Info */}
          {patient.serviceType === "Installment" && (
            <InstallmentsPanel
              patient={patient}
              fetchPatients={fetchPatients}
            />
          )}
        </div>
      </div>

      {/* Transactions Section */}
      <TransactionsPanel patient={patient} />
    </div>
  );
}
