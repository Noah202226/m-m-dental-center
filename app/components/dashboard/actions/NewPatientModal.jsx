"use client";

export default function NewPatientModal({ openDialog }) {
  return (
    <>
      {/* Open Button */}
      <button
        className="btn bg-yellow-400 text-black hover:bg-yellow-500 rounded-lg shadow-md"
        onClick={() => openDialog()}
      >
        + New Patient
      </button>
    </>
  );
}
