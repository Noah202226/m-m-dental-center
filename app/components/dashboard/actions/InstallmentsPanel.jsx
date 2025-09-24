import { useEffect, useState } from "react";
import AddPaymentModal from "./AddPaymentModal"; // import modal
import ViewHistoryModal from "./ViewPaymentHistoryModal";
import { FiEdit, FiPlusCircle, FiTrash2 } from "react-icons/fi";
import { useTransactionStore } from "@/app/stores/useTransactionStore";

import TransactionsPanel from "./TransactionPanel";

export default function InstallmentsPanel({ patient, fetchPatients }) {
  const [showModal, setShowModal] = useState(false);

  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 shadow-md">
      <h3 className="font-semibold text-yellow-400 mb-3 flex items-center gap-2">
        💰 Installment Payments
      </h3>

      {patient?.serviceType === "Installment" ? (
        <div>
          <p className="text-gray-300">
            Remaining Balance:{" "}
            <span className="text-yellow-400 font-bold">
              ₱{patient.balance?.toLocaleString() ?? 0}
            </span>
          </p>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-sm bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg"
            >
              Add Payment
            </button>
            <button
              onClick={() => setShowHistory(true)}
              className="btn btn-sm bg-gray-800 hover:bg-gray-700 text-yellow-400 rounded-lg"
            >
              View History
            </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-400">Not an installment service.</p>
      )}

      {showModal && (
        <AddPaymentModal
          patient={patient}
          onClose={() => setShowModal(false)}
          fetchPatients={fetchPatients}
        />
      )}

      {showHistory && (
        <ViewHistoryModal
          patient={patient}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}
