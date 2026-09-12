"use client";

import { useState } from "react";
import { useSettingsStore } from "../../stores/useSettingStore";
import ServicesData from "../settings/services/Services";
import CategoriesSettings from "../settings/CategoryTab";
import PersonalizationTab from "../settings/PersonalizationTab";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";
import {
  Settings as SettingsIcon,
  Palette,
  Users,
  Stethoscope,
  Tags,
  Plus,
  Trash2,
  Mail,
  User,
} from "lucide-react";

export default function SettingsTabs() {
  const [activeTab, setActiveTab] = useState("services");

  const tabs = [
    { key: "services", label: "Services & Procedures", icon: <Stethoscope size={16} /> },
    { key: "personalization", label: "Branding & Title", icon: <Palette size={16} /> },
    { key: "users", label: "Staff & Users", icon: <Users size={16} /> },
    { key: "inventory", label: "Expense & Product Categories", icon: <Tags size={16} /> },
  ];

  const {
    users,
    addUser,
    deleteUser,
  } = useSettingsStore();

  const [newUser, setNewUser] = useState({ name: "", email: "" });

  const handleAddStaff = () => {
    if (!newUser.name.trim()) return toast.error("Please enter a staff name");
    if (!newUser.email.trim()) return toast.error("Please enter a valid email address");
    addUser(newUser);
    toast.success(`Staff member "${newUser.name}" added! 👩‍⚕️`, {
      description: `${newUser.email} authorized for clinic system access.`,
    });
    setNewUser({ name: "", email: "" });
  };

  const handleDeleteStaff = (u) => {
    deleteUser(u.id);
    toast.success(`Staff member "${u.name}" removed 🗑️`);
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[hsl(var(--foreground))] flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-amber-500" />
          Practice Configuration & Settings
        </h2>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          Configure clinical services, clinic identity, staff members, and category taxonomies
        </p>
      </div>

      {/* Modern Navigation Pills */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[hsl(var(--muted))]/60 border border-[hsl(var(--border))]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-amber-500 text-black shadow-sm font-bold"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Container */}
      <div>
        {/* 🔹 Dental Services & Procedures */}
        {activeTab === "services" && <ServicesData />}

        {/* 🔹 Personalization */}
        {activeTab === "personalization" && (
          <Card className="border-[hsl(var(--border))]">
            <CardContent className="p-6">
              <PersonalizationTab />
            </CardContent>
          </Card>
        )}

        {/* 🔹 Staff / Users */}
        {activeTab === "users" && (
          <Card className="border-[hsl(var(--border))]">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-[hsl(var(--foreground))]">
                <Users className="h-4 w-4 text-amber-500" />
                <span>Authorized Clinical Staff</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Manage dentist and staff profiles authorized to operate this clinic management workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add User Input Form */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  <Input
                    type="text"
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser((u) => ({ ...u, name: e.target.value }))
                    }
                    placeholder="Staff Full Name (e.g. Dr. Jane Cruz)"
                    className="pl-9 h-10 text-sm"
                  />
                </div>
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser((u) => ({ ...u, email: e.target.value }))
                    }
                    placeholder="Email address"
                    className="pl-9 h-10 text-sm"
                  />
                </div>
                <Button
                  onClick={handleAddStaff}
                  className="gap-1.5 h-10 shrink-0"
                >
                  <Plus size={16} />
                  <span>Add Staff</span>
                </Button>
              </div>

              {/* User List */}
              <div className="space-y-2 pt-2">
                {users.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[hsl(var(--muted-foreground))] border border-dashed border-[hsl(var(--border))] rounded-xl">
                    No custom staff members registered yet.
                  </div>
                ) : (
                  users.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[hsl(var(--muted))]/40 border border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold text-xs">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[hsl(var(--foreground))]">
                            {u.name}
                          </p>
                          <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                            {u.email}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteStaff(u)}
                        className="h-8 w-8 text-[hsl(var(--muted-foreground))] hover:text-red-500"
                        title="Remove Staff"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 🔹 Inventory / Categories */}
        {activeTab === "inventory" && (
          <Card className="border-[hsl(var(--border))]">
            <CardContent className="p-6">
              <CategoriesSettings />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
