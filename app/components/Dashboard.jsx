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
              <NewPatientModal />
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
                    onClick={() => console.log("New Patient")}
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
    </div>
  );
}
