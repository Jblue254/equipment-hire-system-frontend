
import { useState } from "react";
import { X, UserRound } from "lucide-react";
import { toast } from "sonner";
import { createDriver } from "../../services/transportService";

const initialForm = {
  full_name: "",
  phone_number: "",
  licence_number: "",
  licence_expiry_date: "",
  is_active: true,
  notes: "",
};

export default function DriverForm({ onClose, onSuccess }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.full_name.trim() || !form.phone_number.trim() || !form.licence_number.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      await createDriver({
        ...form,
        full_name: form.full_name.trim(),
        phone_number: form.phone_number.trim(),
        licence_number: form.licence_number.trim().toUpperCase(),
        licence_expiry_date: form.licence_expiry_date || null,
      });

      toast.success("Driver registered successfully");
      onSuccess();
      onClose();
    } catch (error) {
      const data = error.response?.data;
      const message =
        typeof data === "object" && data !== null
          ? Object.values(data).flat().join(" ")
          : "Failed to register driver";

      toast.error(message || "Failed to register driver");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
              <UserRound size={22} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Register New Driver
              </h2>
              <p className="text-sm text-slate-500">
                Add a driver to your transport team
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Full Name *
            </label>
            <input
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Enter driver's full name"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone_number"
                value={form.phone_number}
                onChange={handleChange}
                placeholder="e.g. 0712345678"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Licence Number *
              </label>
              <input
                name="licence_number"
                value={form.licence_number}
                onChange={handleChange}
                placeholder="Enter licence number"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Licence Expiry Date
            </label>
            <input
              type="date"
              name="licence_expiry_date"
              value={form.licence_expiry_date}
              onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
            <input
              id="is_active"
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
              className="h-4 w-4 accent-blue-600"
            />
            <label
              htmlFor="is_active"
              className="text-sm font-medium text-slate-700"
            >
              Driver is active
            </label>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Notes
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Additional driver information..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Registering..." : "Register Driver"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
