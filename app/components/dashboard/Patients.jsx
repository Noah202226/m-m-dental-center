"use client";

import { useState } from "react";
import { FiSearch, FiUser, FiDollarSign } from "react-icons/fi";

export default function PatientsLayout() {
  const [selectedPatient, setSelectedPatient] = useState({
    id: 1,
    name: "Noa Ligpitan",
    age: 28,
    service: "Braces",
    balance: 12000,
  });
  const [search, setSearch] = useState("");

  const patients = [
    {
      id: 1,
      name: "Noa Ligpitan",
      age: 28,
      service: "Braces",
      balance: 12000,
      address: "Makapilapil San Ildefonso, Bulacan",
    },
    {
      id: 2,
      name: "Maria Santos",
      age: 32,
      service: "Teeth Whitening",
      balance: 0,
      address: "Makapilapil San Ildefonso, Bulacan",
    },
    {
      id: 3,
      name: "Juan Dela Cruz",
      age: 25,
      service: "Braces",
      balance: 8000,
      address: "Makapilapil San Ildefonso, Bulacan",
    },
    {
      id: 4,
      name: "Mark Reyes",
      age: 30,
      service: "Cleaning",
      balance: 0,
      address: "Makapilapil San Ildefonso, Bulacan",
    },
    {
      id: 5,
      name: "Ana Cruz",
      age: 27,
      service: "Braces",
      balance: 15000,
      address: "Makapilapil San Ildefonso, Bulacan",
    },
    {
      id: 6,
      name: "Carlos Lopez",
      age: 40,
      service: "Extraction",
      balance: 0,
      address: "Makapilapil San Ildefonso, Bulacan",
    },
  ];

  // Filter patients
  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-9rem)] bg-black text-gray-200">
      {/* Left: Patients List Panel */}
      <aside className="w-full md:w-1/3 border-r border-gray-800 flex flex-col">
        {/* Sticky Search Bar */}
        <div className="sticky top-0 bg-black p-4 z-10 border-b border-gray-800">
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

        {/* Scrollable Patient List */}
        <div className="max-h-30 md:max-h-110 overflow-y-auto p-2 space-y-1">
          {filteredPatients.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPatient(p)}
              className={`w-full text-left p-3 rounded-lg transition ${
                selectedPatient?.id === p.id
                  ? "bg-yellow-500 text-black"
                  : "bg-gray-800 text-white hover:bg-gray-700"
              }
              ${p.balance > 0 ? "border-l-4 border-red-500" : "border-none"}
              ${p.balance === 0 ? "opacity-70" : "opacity-100"}
              ${p.balance > 0 ? "font-semibold" : "font-normal"}
              
              ${p.service === "Braces" ? "italic" : ""}
              `}
            >
              <h3 className="font-semibold">{p.name}</h3>
              <p className="text-sm opacity-75">{p.service}</p>
              <p className="text-sm opacity-75">{p.address}</p>
            </button>
          ))}
          {filteredPatients.length === 0 && (
            <p className="text-gray-500 text-sm">No patients found.</p>
          )}
        </div>
      </aside>

      {/* Right: Patient Details */}
      <main className="flex-1 p-6 overflow-y-auto">
        {selectedPatient ? (
          <div className="space-y-4">
            {/* Patient Info */}
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
                {selectedPatient.service}
              </p>
            </div>

            {/* Installment Payments */}
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-md">
              <h3 className="font-semibold text-yellow-400 mb-3 flex items-center gap-2">
                <FiDollarSign /> Installment Payments
              </h3>
              {selectedPatient.balance > 0 ? (
                <div>
                  <p className="text-gray-300">
                    Remaining Balance:{" "}
                    <span className="text-yellow-400 font-bold">
                      ₱{selectedPatient.balance.toLocaleString()}
                    </span>
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button className="btn btn-sm bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg">
                      Add Payment
                    </button>
                    <button className="btn btn-sm bg-gray-800 hover:bg-gray-700 text-yellow-400 rounded-lg">
                      View History
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-green-400 font-bold">Fully Paid 🎉</p>
              )}
            </div>
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
