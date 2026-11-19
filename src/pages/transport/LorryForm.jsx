
import { useState } from "react";
import { X, Truck } from "lucide-react";
import { toast } from "sonner";
import { createLorry } from "../../services/transportService";

const initialForm = {
  registration_number: "",
  make: "",
  model: "",
  capacity_tonnes: "",
  status: "AVAILABLE",
  notes: "",
};

function LorryForm({ onClose, onSuccess }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.registration_number.trim()) {
      toast.error("Registration number is required");
      return;
    }

    if (!form.capacity_tonnes || Number(form.capacity_tonnes) <= 0) {
      toast.error("Enter a valid lorry capacity");
      return;
    }

    setLoading(true);

    try {
      await createLorry({
        ...form,
        registration_number: form.registration_number.trim().toUpperCase(),
        make: form.make.trim(),
        model: form.model.trim(),
        capacity_tonnes: Number(form.capacity_tonnes),
      });

      toast.success("Lorry registered successfully");
      onSuccess();
      onClose();
    } catch (error) {
      const data = error.response?.data;
      const message =
        typeof data === "object"
          ? Object.values(data).flat().join(" ")
          : "Failed to register lorry";

      toast.error(message || "Failed to register lorry");
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
              <Truck size={22} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Register New Lorry
              </h2>
              <p className="text-sm text-slate-500">
                Add a vehicle to your transport fleet
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
              Registration Number *
            </label>
            <input
              name="registration_number"
              value={form.registration_number}
              onChange={handleChange}
              placeholder="e.g. KDA 123A"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Make
              </label>
              <input
                name="make"
                value={form.make}
                onChange={handleChange}
                placeholder="e.g. Isuzu"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Model
              </label>
              <input
                name="model"
                value={form.model}
                onChange={handleChange}
                placeholder="e.g. FRR"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Capacity (Tonnes) *
              </label>
              <input
                type="number"
                name="capacity_tonnes"
                value={form.capacity_tonnes}
                onChange={handleChange}
                min="0.1"
                step="0.1"
                placeholder="e.g. 10"
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Initial Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="AVAILABLE">Available</option>
                <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
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
              placeholder="Additional vehicle information..."
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
              {loading ? "Registering..." : "Register Lorry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LorryForm;
