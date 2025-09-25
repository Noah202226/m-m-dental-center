import { usePatientStore } from "@/app/stores/usePatientStore";
import { useEffect, useState } from "react";
import { FiPlusCircle, FiTrash2 } from "react-icons/fi";
import { useServices } from "../../hooks/useServices";
import toast from "react-hot-toast";

export default function TransactionsPanel({ patient }) {
  const {
    transactions,
    transactionsLoading,
    fetchTransactions,
    addTransaction,
    deleteTransaction,
  } = usePatientStore();

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const { services } = useServices();
  const [selectedService, setSelectedService] = useState("");
  const [selectedSubService, setSelectedSubService] = useState("");

  // Fetch transactions on mount
  useEffect(() => {
    if (patient?.$id) {
      fetchTransactions(patient.$id);
    }
  }, [patient?.$id, fetchTransactions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount) return toast.error("Amount is required");
    await addTransaction(patient.$id, {
      amount: parseInt(amount),
      date,
      remarks: notes,
      patientName: patient?.patientName,
      serviceName: selectedService,
      subServiceName: selectedSubService,
      paymentType: "installment-pay",
    });
    setAmount("");
    setNotes("");
    setSelectedService(null);
    setSelectedSubService(null);
    // Close modal after save
    document.getElementById("txn_modal").close();
  };

  return (
    <div className="bg-black p-6 rounded-2xl border border-yellow-500/40 shadow-lg flex-1  h-full overflow-y-auto mt-3 space-y-3 pr-2">
      <div className="flex items-center justify-between h-full overflow-y-auto">
        <h3 className="text-2xl font-bold text-yellow-400">Transactions</h3>

        {/* DaisyUI Modal Trigger */}
        <button
          className="flex items-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-xl hover:bg-yellow-400 transition"
          onClick={() => document.getElementById("txn_modal").showModal()}
        >
          <FiPlusCircle /> Add
        </button>
      </div>

      {/* DaisyUI Modal */}
      <dialog id="txn_modal" className="modal">
        <div className="modal-box bg-black border border-yellow-500/40">
          <h3 className="font-bold text-lg text-yellow-400 mb-4">
            Add Transaction
          </h3>

          <form method="dialog" className="space-y-3" onSubmit={handleSubmit}>
            {/* Service Selection */}
            <div>
              <label className="block mb-2">Select Service</label>
              <select
                className="select select-bordered w-full bg-black text-yellow-400 border-yellow-400"
                value={selectedService}
                onChange={(e) => {
                  setSelectedService(e.target.value);
                  setSelectedSubService("");
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
              <div>
                <label className="block mb-2">Select Sub-service</label>
                <select
                  className="select select-bordered w-full bg-black text-yellow-400 border-yellow-400"
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
              </div>
            )}

            <input
              type="number"
              placeholder="Amount (₱)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input input-bordered w-full bg-black text-yellow-400 border-yellow-400"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input input-bordered w-full bg-black text-yellow-400 border-yellow-400"
            />
            <textarea
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="textarea textarea-bordered w-full bg-black text-yellow-400 border-yellow-400"
            />

            <button type="submit" className="btn btn-warning w-full font-bold">
              Save Transaction
            </button>
          </form>

          <div className="modal-action">
            <button
              className="btn"
              onClick={() => document.getElementById("txn_modal").close()}
            >
              Close
            </button>
          </div>
        </div>
      </dialog>

      {/* Transactions List */}
      {transactionsLoading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : transactions.length > 0 ? (
        <div className="max-h-full md:max-h-full overflow-y-auto p-2 space-y-1">
          {transactions.map((txn) => (
            <div
              key={txn.$id}
              className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
            >
              <div>
                <p className="text-yellow-400 font-semibold">₱{txn.amount}</p>
                <p className="text-sm text-gray-400">
                  {" "}
                  {new Date(txn.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                {txn.notes && (
                  <p className="text-sm text-gray-300 italic">{txn.notes}</p>
                )}
              </div>
              <button
                onClick={() => deleteTransaction(txn)}
                className="text-red-400 hover:text-red-600"
              >
                <FiTrash2 />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm italic">No transactions yet.</p>
      )}
    </div>
  );
}
