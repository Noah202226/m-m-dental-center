"use client";

import { useState } from "react";

export default function NewPatientModal() {
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const patientData = {
      name: formData.get("name"),
      age: formData.get("age"),
      gender: formData.get("gender"),
      contact: formData.get("contact"),
    };

    console.log("New patient:", patientData);
    setIsOpen(false);
  };

  return (
    <>
      {/* Open Button */}
      <button
        className="btn bg-yellow-400 text-black hover:bg-yellow-500"
        onClick={() => setIsOpen(true)}
      >
        + New Patient
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="modal modal-open">
          <div className="modal-box relative bg-black border border-gray-800 text-gray-200">
            {/* Close Button */}
            <button
              className="btn btn-sm btn-circle absolute right-2 top-2 bg-gray-800 text-yellow-400 hover:bg-yellow-600"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>

            {/* Title */}
            <h3 className="text-lg font-bold mb-4 text-yellow-400">
              Add New Patient
            </h3>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label text-gray-300">Name</label>
                <input
                  type="text"
                  name="name"
                  className="input input-bordered bg-gray-900 border-gray-700 text-gray-100"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label text-gray-300">Age</label>
                <input
                  type="number"
                  name="age"
                  className="input input-bordered bg-gray-900 border-gray-700 text-gray-100"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label text-gray-300">Gender</label>
                <select
                  name="gender"
                  className="select select-bordered bg-gray-900 border-gray-700 text-gray-100"
                  required
                >
                  <option disabled value="">
                    Select Gender
                  </option>
                  <option value="Male" className="text-black">
                    Male
                  </option>
                  <option value="Female" className="text-black">
                    Female
                  </option>
                </select>
              </div>

              <div className="form-control">
                <label className="label text-gray-300">Contact</label>
                <input
                  type="text"
                  name="contact"
                  className="input input-bordered bg-gray-900 border-gray-700 text-gray-100"
                  required
                />
              </div>

              {/* Actions */}
              <div className="modal-action">
                <button
                  type="submit"
                  className="btn bg-yellow-400 text-black hover:bg-yellow-500"
                >
                  Save
                </button>
                <button
                  type="button"
                  className="btn bg-gray-800 text-gray-200 hover:bg-gray-700"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
