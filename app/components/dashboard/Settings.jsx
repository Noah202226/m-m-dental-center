"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useSettingsStore } from "../../stores/useSettingStore";
import ServicesData from "../settings/services/Services";
import { Edit, Trash, Plus } from "lucide-react";

export default function SettingsTabs() {
  const [activeTab, setActiveTab] = useState("personalization");

  const tabs = [
    { key: "personalization", label: "PERSONALIZATION" },
    { key: "users", label: "USERS" },
    { key: "services", label: "SERVICES" },
    { key: "inventory", label: "PRODUCT INVENTORY" },
  ];

  const {
    theme,
    setTheme,
    users,
    addUser,
    deleteUser,
    products,
    addProduct,
    deleteProduct,
  } = useSettingsStore();

  // Local input states
  const [newUser, setNewUser] = useState({ name: "", email: "" });
  const [newProduct, setNewProduct] = useState({ name: "", price: "" });

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-yellow-400">Settings</h2>
      </div>

      {/* 🚀 Custom Scrollable Tab Bar */}
      <div className="relative border-b border-yellow-400 overflow-x-auto">
        <div className="flex space-x-2 min-w-max px-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-4 py-2 rounded-md font-semibold transition-colors 
                  ${
                    isActive
                      ? "text-black bg-yellow-400"
                      : "text-gray-400 hover:text-yellow-300 hover:bg-yellow-400/20"
                  }`}
              >
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-black"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6 p-4  border border-yellow-400 rounded-lg bg-black">
        {/* 🔹 Personalization */}
        {activeTab === "personalization" && (
          <div className="flex flex-col gap-4 text-yellow-400">
            <p className="font-semibold">Choose Theme:</p>
            <div className="flex gap-4">
              <button
                onClick={() => setTheme("dark")}
                className={`btn ${
                  theme === "dark"
                    ? "bg-yellow-400 text-black"
                    : "bg-gray-800 text-yellow-400"
                }`}
              >
                Dark
              </button>
              <button
                onClick={() => setTheme("light")}
                className={`btn ${
                  theme === "light"
                    ? "bg-yellow-400 text-black"
                    : "bg-gray-800 text-yellow-400"
                }`}
              >
                Light
              </button>
            </div>
            <p>
              🌙 Current theme: <span className="font-bold">{theme}</span>
            </p>
          </div>
        )}

        {/* 🔹 Users */}
        {activeTab === "users" && (
          <div className="text-yellow-400 space-y-4">
            {/* Add User */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser((u) => ({ ...u, name: e.target.value }))
                }
                placeholder="Name"
                className="input input-bordered bg-black border-yellow-400"
              />
              <input
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser((u) => ({ ...u, email: e.target.value }))
                }
                placeholder="Email"
                className="input input-bordered bg-black border-yellow-400"
              />
              <button
                onClick={() => {
                  if (!newUser.name || !newUser.email) return;
                  addUser(newUser);
                  setNewUser({ name: "", email: "" });
                }}
                className="btn bg-yellow-400 text-black border-none"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* User List */}
            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex justify-between items-center border-b border-yellow-400 pb-1"
                >
                  <span>
                    {u.name} - <span className="italic">{u.email}</span>
                  </span>
                  <button
                    onClick={() => deleteUser(u.id)}
                    className="btn btn-ghost btn-xs text-red-600"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              ))}
              {users.length === 0 && (
                <p className="italic">No users added yet...</p>
              )}
            </div>
          </div>
        )}

        {/* 🔹 Services */}
        {activeTab === "services" && <ServicesData />}

        {/* 🔹 Inventory */}
        {activeTab === "inventory" && (
          <div className="text-yellow-400 space-y-4">
            {/* Add Product */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Product Name"
                className="input input-bordered bg-black border-yellow-400"
              />
              <input
                type="number"
                value={newProduct.price}
                onChange={(e) =>
                  setNewProduct((p) => ({ ...p, price: e.target.value }))
                }
                placeholder="Price"
                className="input input-bordered bg-black border-yellow-400"
              />
              <button
                onClick={() => {
                  if (!newProduct.name || !newProduct.price) return;
                  addProduct(newProduct);
                  setNewProduct({ name: "", price: "" });
                }}
                className="btn bg-yellow-400 text-black border-none"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Product List */}
            <div className="space-y-2">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="flex justify-between items-center border-b border-yellow-400 pb-1"
                >
                  <span>
                    {p.name} - ₱{p.price}
                  </span>
                  <button
                    onClick={() => deleteProduct(p.id)}
                    className="btn btn-ghost btn-xs text-red-600"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              ))}
              {products.length === 0 && (
                <p className="italic">No products in inventory...</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
