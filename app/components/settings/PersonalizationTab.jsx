"use client";

import { useEffect, useState } from "react";
import { usePersonalizationStore } from "../../stores/usePersonalizationStore";
import toast from "react-hot-toast";

export default function PersonalizationTab() {
  const {
    clientTitle,
    clientInitial,
    fetchPersonalization,
    setClientTitle,
    setClientInitial,
  } = usePersonalizationStore();
  const [title, setTitle] = useState("");
  const [initial, setInitial] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPersonalization();
  }, [fetchPersonalization]);

  useEffect(() => {
    setTitle(clientTitle);
    setInitial(clientInitial || "");
  }, [clientTitle, clientInitial]);

  const handleSave = async () => {
    if (!title.trim()) return toast.error("Title cannot be empty");
    if (!initial.trim()) return toast.error("Profile initial cannot be empty");

    setLoading(true);
    try {
      await setClientTitle(title);
      await setClientInitial(initial);
      toast.success("Personalization saved!");
    } catch {
      toast.error("Error saving personalization");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 text-yellow-400">
      <h2 className="text-xl font-bold mb-4">Personalization</h2>

      <div className="max-w-md flex flex-col gap-4">
        {/* Profile Initial */}
        <div>
          <label className="block text-gray-400 font-semibold mb-2">
            Profile Initial (maximum of 2 letter)
          </label>
          <input
            type="text"
            placeholder="Enter your profile initial"
            maxLength={2}
            className="input input-bordered w-full rounded-xl bg-black border-yellow-400 text-yellow-400 px-4 py-2 focus:ring-2 focus:ring-yellow-400 focus:outline-none transition"
            value={initial}
            onChange={(e) => setInitial(e.target.value.toUpperCase())}
            disabled={loading}
          />
        </div>

        {/* Client Software Title */}
        <div>
          <label className="block text-gray-400 font-semibold mb-2">
            Client Software Title
          </label>
          <input
            type="text"
            placeholder="Enter your software title"
            className="input input-bordered w-full rounded-xl bg-black border-yellow-400 text-yellow-400 px-4 py-2 focus:ring-2 focus:ring-yellow-400 focus:outline-none transition"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
          />
        </div>

        <button
          onClick={handleSave}
          className={`btn bg-yellow-400 text-black hover:bg-yellow-500 rounded-xl px-6 py-2 font-semibold shadow-md transition ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
