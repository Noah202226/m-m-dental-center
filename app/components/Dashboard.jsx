"use client";

import { useEffect, useState } from "react";
import {
  Home,
  Settings,
  Calendar,
  Users,
  Stethoscope,
  Menu,
} from "lucide-react";
import SettingsData from "./dashboard/Settings";
import Reports from "./dashboard/Reports";
import Patients from "./dashboard/Patients";
import { useAuthStore } from "../stores/authStore";
import NewPatientModal from "./dashboard/actions/NewPatientModal";
import { useServices } from "./hooks/useServices";
import { databases } from "../lib/appwrite";

const PATIENTS_COLLECTION_ID = "patients";
const INSTALLMENTS_COLLECTION_ID = "installments";
const DATABASE_ID = process.env.NEXT_PUBLIC_DATABASE_ID;
import { ID } from "appwrite";

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: <Home size={20} /> },
  { id: "appointments", label: "Appointments", icon: <Calendar size={20} /> },
  { id: "patients", label: "Patients", icon: <Users size={20} /> },
  { id: "reports", label: "Reports", icon: <Stethoscope size={20} /> },
  { id: "settings", label: "Settings", icon: <Settings size={20} /> },
];

export default function DentalClinicLayout() {
  const [active, setActive] = useState("dashboard");
  const [dateTime, setDateTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Logout function (replace with your auth logic)
  const { logout } = useAuthStore((state) => state);

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const openDialog = () => {
    document.getElementById("new_patient_modal").showModal();
  };
  const closeDialog = () => {
    document.getElementById("new_patient_modal").close();
  };

  const [serviceType, setServiceType] = useState("One-time");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const patientData = {
      patientName: formData.get("name"),
      patientAge: Number(formData.get("age")),
      address: formData.get("address"),
      gender: formData.get("gender"),
      contact: formData.get("contact"),
      serviceName: services.find((s) => s.id === selectedService)?.name || "",
      subServiceName:
        services
          .find((s) => s.id === selectedService)
          ?.subServices.find((sub) => sub.id === selectedSubService)?.name ||
        "",
      serviceType: formData.get("service-type"), // One-time or Installment
      servicePrice:
        serviceType === "Installment"
          ? Number(formData.get("totalPrice"))
          : Number(formData.get("servicePrice")),
      balance:
        serviceType === "Installment"
          ? Number(formData.get("totalPrice")) -
            Number(formData.get("initialPayment"))
          : 0, // initial balance is full price,
    };

    try {
      // 1️⃣ Save patient
      const newPatient = await databases.createDocument(
        DATABASE_ID,
        PATIENTS_COLLECTION_ID,
        ID.unique(),
        patientData
      );

      console.log("Patient saved:", newPatient);

      // 2️⃣ If Installment → save initial installment record
      if (patientData.serviceType === "Installment") {
        const initialPayment = Number(formData.get("initialPayment")) || 0;
        const balanceAfter = patientData.servicePrice - initialPayment;

        await databases.createDocument(
          DATABASE_ID,
          INSTALLMENTS_COLLECTION_ID,
          ID.unique(),
          {
            patientId: newPatient.$id,
            amountPaid: initialPayment,
            paymentDate: new Date().toISOString(),
            balanceAfter: balanceAfter,
          }
        );

        console.log("Initial installment saved");

        // 3️⃣ Save transaction for the initial payment
        await databases.createDocument(
          DATABASE_ID,
          "transactions",
          ID.unique(),
          {
            patientId: newPatient.$id,
            patientName: newPatient.patientName,
            serviceName: newPatient.serviceName,
            subServiceName: newPatient.subServiceName ?? "",
            amount: initialPayment,
            paymentType: "Installment",
            date: new Date().toISOString(),
          }
        );
      } else {
        // 4️⃣ If One-time → save full transaction
        await databases.createDocument(
          DATABASE_ID,
          "transactions",
          ID.unique(),
          {
            patientId: newPatient.$id,
            patientName: newPatient.patientName,
            serviceName: newPatient.serviceName,
            subServiceName: newPatient.subServiceName ?? "",
            amount: newPatient.servicePrice,
            paymentType: "One-time",
            date: new Date().toISOString(),
          }
        );
      }

      e.target.reset();
      setSelectedService("");
      setSelectedSubService("");
      closeDialog();
    } catch (error) {
      console.error("Error saving patient:", error);
    }
  };

  const { services, loading } = useServices();

  const [selectedService, setSelectedService] = useState("");
  const [selectedSubService, setSelectedSubService] = useState("");

  return (
    <div className="flex h-screen bg-black text-gray-200">
      {/* Sidebar (hidden on small screens, togglable) */}
      <aside
        className={`fixed md:static inset-y-0 left-0 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-200 ease-in-out
  w-64 bg-black border-r border-gray-800 flex flex-col z-20`}
      >
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-yellow-400">
            M&M Dental Center
          </h1>
          <button
            className="md:hidden text-gray-400"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActive(item.id);
                setSidebarOpen(false); // close sidebar on mobile
              }}
              className={`flex items-center w-full px-4 py-3 rounded-xl transition-colors duration-200
                ${
                  active === item.id
                    ? "bg-yellow-400 text-black font-semibold"
                    : "text-gray-300 hover:bg-gray-900 hover:text-yellow-400"
                }
              `}
            >
              {item.icon}
              <span className="ml-3">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Overlay on mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-800 bg-black sticky top-0 z-10">
          {/* LEFT: Mobile Menu Button + DateTime */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-yellow-400 p-2 rounded-lg hover:bg-gray-900"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>

            <div className="sm:flex flex-col text-center md:text-left">
              <span className="text-xs sm:text-sm text-gray-300">
                {dateTime.toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}{" "}
              </span>
              <span className="text-base sm:text-lg font-mono text-yellow-400">
                {dateTime.toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* RIGHT: Quick Stats + Actions + Profile */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Stats hidden on xs screens */}
            <div className="hidden sm:flex gap-4">
              <div className="text-center">
                <p className="text-xs sm:text-sm text-gray-400">
                  Today’s Appointments
                </p>
                <p className="text-base sm:text-lg font-bold text-yellow-400">
                  12
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs sm:text-sm text-gray-400">
                  Total Patients
                </p>
                <p className="text-base sm:text-lg font-bold text-yellow-400">
                  134
                </p>
              </div>
            </div>

            {/* Action Buttons (Desktop) */}
            <div className="hidden md:flex gap-2 z-10">
              <NewPatientModal openDialog={openDialog} />
              <button
                onClick={() => console.log("New Expense")}
                className="px-3 py-1.5 rounded-md bg-gray-900 text-yellow-400 text-sm font-medium border border-gray-700 hover:bg-gray-800"
              >
                + Expense
              </button>
              <button
                onClick={() => console.log("New Appointment")}
                className="px-3 py-1.5 rounded-md bg-yellow-400 text-black text-sm font-medium hover:bg-yellow-500"
              >
                + Appointment
              </button>
            </div>

            {/* Mobile Dropdown Menu */}
            <div className="dropdown dropdown-end md:hidden z-50">
              <label
                tabIndex={0}
                className="btn btn-sm bg-yellow-400 text-black hover:bg-yellow-500"
              >
                + New
              </label>
              <ul
                tabIndex={0}
                className="dropdown-content menu p-2 shadow bg-gray-900 border border-gray-700 rounded-lg w-44 z-50"
              >
                <li className="z-50">
                  <button
                    onClick={() =>
                      document.getElementById("new_patient_modal").showModal()
                    } // use state here
                    className="text-yellow-400 hover:bg-gray-800"
                  >
                    + Patient
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => console.log("New Expense")}
                    className="text-yellow-400 hover:bg-gray-800"
                  >
                    + Expense
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => console.log("New Appointment")}
                    className="text-yellow-400 hover:bg-gray-800"
                  >
                    + Appointment
                  </button>
                </li>
              </ul>
            </div>

            {/* User Profile */}
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="flex items-center gap-2 sm:gap-3 cursor-pointer"
              >
                <span className="hidden sm:inline text-sm">
                  Hello, Dr. Smith
                </span>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-400 flex items-center justify-center text-black font-bold">
                  DS
                </div>
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content menu p-2 shadow bg-black border border-yellow-500 rounded-box w-44"
              >
                <li>
                  <a>Profile</a>
                </li>
                <li>
                  <button
                    onClick={() => {
                      logout();
                    }}
                    className="text-red-500"
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <section className="p-4 sm:p-6">
          {active === "dashboard" && (
            <div>
              <h3 className="text-lg font-bold mb-3 text-yellow-400">
                Overview
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="card bg-gray-900 shadow-md p-4 sm:p-6 rounded-xl">
                  <p className="text-gray-400">Today’s Appointments</p>
                  <h4 className="text-xl sm:text-2xl font-bold text-yellow-400">
                    12
                  </h4>
                </div>
                <div className="card bg-gray-900 shadow-md p-4 sm:p-6 rounded-xl">
                  <p className="text-gray-400">New Patients</p>
                  <h4 className="text-xl sm:text-2xl font-bold text-yellow-400">
                    5
                  </h4>
                </div>
                <div className="card bg-gray-900 shadow-md p-4 sm:p-6 rounded-xl">
                  <p className="text-gray-400">Revenue</p>
                  <h4 className="text-xl sm:text-2xl font-bold text-yellow-400">
                    ₱25,000
                  </h4>
                </div>
              </div>
            </div>
          )}

          {active === "appointments" && (
            <div>
              <h3 className="text-lg font-bold text-yellow-400">
                Appointments
              </h3>
              <p className="text-gray-400">
                Manage your patient schedules here.
              </p>
            </div>
          )}

          {active === "patients" && <Patients />}
          {active === "reports" && <Reports />}
          {active === "settings" && <SettingsData />}
        </section>
      </main>

      {/* Modal Overlay */}
      <dialog id="new_patient_modal" className="modal fixed inset-0 z-50">
        <div className="flex items-center justify-center w-full h-90vh bg-black/70 px-4">
          <div className="w-full max-w-md sm:max-w-lg md:max-w-xl bg-gray-900 rounded-xl shadow-lg border border-gray-700 relative flex flex-col max-h-screen overflow-y-auto">
            {/* Close Button */}
            <button
              className="btn btn-sm btn-circle absolute right-3 top-3 bg-gray-800 text-yellow-400 hover:bg-yellow-500"
              onClick={() => closeDialog()}
            >
              ✕
            </button>

            {/* Title */}
            <h3 className="text-xl font-bold py-6 text-yellow-400 text-center sticky top-0 bg-gray-900 z-10">
              Add New Patient
            </h3>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-4 p-6 flex-1 overflow-y-auto"
            >
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  className="w-full input input-bordered bg-black text-yellow-400 border-yellow-400 rounded-lg"
                  required
                />
              </div>
              {/* Age */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  name="age"
                  className="w-full input input-bordered bg-black text-yellow-400 border-yellow-400 rounded-lg"
                  required
                />
              </div>
              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  className="w-full input input-bordered bg-black text-yellow-400 border-yellow-400 rounded-lg"
                  required
                />
              </div>
              {/* Gender */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Gender
                </label>
                <select
                  name="gender"
                  className="w-full select select-bordered bg-black text-yellow-400 border-yellow-400 rounded-lg"
                  required
                >
                  <option value="" disabled>
                    Select Gender
                  </option>
                  <option value="Male" className="text-white">
                    Male
                  </option>
                  <option value="Female" className="text-white">
                    Female
                  </option>
                </select>
              </div>
              {/* Service Rendered */}
              <div>
                <label className="block mb-2">Select Service</label>
                <select
                  className="select select-bordered w-full mb-4 bg-black text-yellow-400 border-yellow-400"
                  value={selectedService}
                  onChange={(e) => {
                    setSelectedService(e.target.value);
                    setSelectedSubService(""); // reset sub when service changes
                  }}
                >
                  <option value="">-- Choose a Service --</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Sub-service Selection */}
              {selectedService && (
                <>
                  <label className="block mb-2">Select Sub-service</label>
                  <select
                    className="select select-bordered w-full mb-4 bg-black text-yellow-400 border-yellow-400"
                    value={selectedSubService}
                    onChange={(e) => setSelectedSubService(e.target.value)}
                  >
                    <option value="">-- Choose a Sub-service --</option>
                    {services
                      .find((s) => s.id === selectedService)
                      ?.subServices.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                  </select>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Service Type
                </label>
                <select
                  name="service-type"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full input input-bordered bg-black text-yellow-400 border-yellow-400 rounded-lg"
                >
                  <option value="One-time">One-time</option>
                  <option value="Installment">Installment</option>
                </select>
              </div>

              {/* Installment plan */}
              {serviceType === "Installment" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Total Service Price
                    </label>
                    <input
                      type="number"
                      name="totalPrice"
                      className="w-full input input-bordered bg-black text-yellow-400 border-yellow-400 rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Initial Payment
                    </label>
                    <input
                      type="number"
                      name="initialPayment"
                      className="w-full input input-bordered bg-black text-yellow-400 border-yellow-400 rounded-lg"
                      required
                    />
                  </div>
                </>
              )}

              {/* Service Price - only show for One-time payment */}
              {serviceType === "One-time" && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Service Price
                  </label>
                  <input
                    type="number"
                    name="servicePrice"
                    className="w-full input input-bordered bg-black text-yellow-400 border-yellow-400"
                    required
                  />
                </div>
              )}
              {/* Contact */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Contact Number
                </label>
                <input
                  type="text"
                  name="contact"
                  className="w-full input input-bordered bg-black text-yellow-400 border-yellow-400 rounded-lg"
                  required
                />
              </div>
              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-gray-900">
                <button
                  type="button"
                  className="btn bg-gray-700 text-gray-200 hover:bg-gray-600 rounded-lg"
                  onClick={() => closeDialog()}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn bg-yellow-400 text-black hover:bg-yellow-500 rounded-lg"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      </dialog>
    </div>
  );
}
