import { useState } from "react";
import { motion } from "framer-motion";
import ServicesData from "../settings/services/Services";

export default function SettingsTabs() {
  const [activeTab, setActiveTab] = useState("personalization");

  const tabs = [
    { key: "personalization", label: "PERSONALIZATION" },
    { key: "users", label: "USERS" },
    { key: "dropdown", label: "DROPDOWN VALUES" },
    { key: "inventory", label: "PRODUCT INVENTORY" },
  ];

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
                {/* Animate underline */}
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
      <div className="mt-6 p-4 border border-yellow-400 rounded-lg bg-black">
        {activeTab === "personalization" && (
          <p className="text-yellow-400">
            ⚙️ Personalization settings go here...
          </p>
        )}
        {activeTab === "users" && (
          <p className="text-yellow-400">👥 Manage users here...</p>
        )}
        {activeTab === "dropdown" && <ServicesData />}
        {activeTab === "inventory" && (
          <div className="p-6 bg-yellow-400 text-black text-center rounded font-semibold">
            🚧 Features coming soon...
          </div>
        )}
      </div>
    </div>
  );
}
