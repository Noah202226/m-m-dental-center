"use client";

import { useEffect, useState } from "react";
import { databases, DATABASE_ID, ID } from "../../../lib/appwrite"; // adjust path
import { Query } from "appwrite";

export default function ViewHistoryModal({ patient, onClose }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPaid, setTotalPaid] = useState(0);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await databases.listDocuments(DATABASE_ID, "installments", [
          Query.equal("patientId", patient.$id),
          Query.orderDesc("paymentDate"),
        ]);
        setPayments(res.documents);

        // compute total paid
        const total = res.documents.reduce(
          (sum, p) => sum + (p.amountPaid || 0),
          0
        );
        setTotalPaid(total);
      } catch (err) {
        console.error("Error fetching payments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [patient.$id]);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-6 rounded-xl border border-gray-700 w-[28rem] max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-yellow-400 mb-4">
          Payment History for {patient.patientName}
        </h2>

        <div className="mb-4 space-y-1 text-sm">
          <p className="text-gray-300">
            <span className="font-semibold text-white ">Service Rendered:</span>
            {loading ? (
              " Computing..."
            ) : (
              <span className="text-[var(--theme-text)]">
                {" "}
                {patient?.serviceName.toLocaleString()}{" "}
              </span>
            )}
          </p>
          <p className="text-gray-300">
            <span className="font-semibold text-white ">Service Amount:</span>
            {loading ? (
              " Computing..."
            ) : (
              <span className="text-[var(--theme-text)]">
                {" "}
                {patient?.servicePrice.toLocaleString()}{" "}
              </span>
            )}
          </p>
        </div>

        <div className="flex justify-between mb-4 text-sm">
          <p className="text-gray-300">
            <span className="font-semibold text-yellow-400">Total Paid:</span> ₱
            {loading ? " Computing..." : totalPaid.toLocaleString()}
          </p>
          <p className="text-gray-300">
            <span className="font-semibold text-yellow-400">Remaining:</span> ₱
            {(patient.balance ?? 0).toLocaleString()}
          </p>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : payments.length === 0 ? (
          <p className="text-gray-400">No payments found.</p>
        ) : (
          <table className="w-full text-sm text-left border border-gray-700 rounded-lg overflow-hidden">
            <thead className="bg-gray-800 text-yellow-400">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr
                  key={p.$id}
                  className="border-t border-gray-700 hover:bg-gray-800"
                >
                  <td className="px-3 py-2 text-gray-300">
                    {new Date(p.paymentDate).toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-3 py-2 text-yellow-400 font-bold">
                    ₱{p.amountPaid.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="btn btn-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
