
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  createLorryExpense,
  getLorries,
} from "../../services/transportService";

const expenseTypes = [
  { value: "FUEL", label: "Fuel" },
  { value: "REPAIR", label: "Repair" },
  { value: "SERVICE", label: "Service" },
  { value: "TYRES", label: "Tyres" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "LICENCE", label: "Licence" },
  { value: "OTHER", label: "Other" },
];

const getToday = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getList = (response) => {
  if (Array.isArray(response)) return response;
  return response?.results || [];
};

export default function LorryExpenseForm({ onClose, onSuccess }) {
  const [lorries, setLorries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    lorry: "",
    expense_type: "FUEL",
    amount: "",
    expense_date: getToday(),
    description: "",
  });

  useEffect(() => {
    const loadLorries = async () => {
      try {
        setLoading(true);
        const response = await getLorries();
        setLorries(getList(response));
      } catch (error) {
        toast.error("Failed to load lorries.");
      } finally {
        setLoading(false);
      }
    };

    loadLorries();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.lorry || !form.amount || !form.expense_date) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (Number(form.amount) <= 0) {
      toast.error("Amount must be greater than zero.");
      return;
    }

    try {
      setSaving(true);

      await createLorryExpense({
        ...form,
        lorry: Number(form.lorry),
        amount: Number(form.amount),
      });

      toast.success("Lorry expense recorded successfully.");
      onSuccess?.();
      onClose?.();
    } catch (error) {
      const data = error.response?.data;
      const message =
        typeof data === "string"
          ? data
          : data
            ? Object.values(data).flat().join(" ")
            : "Failed to record lorry expense.";

      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Add Lorry Expense
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Record an expense against a lorry.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-gray-400 hover:text-gray-700"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Select Lorry *
            </label>
            <select
              name="lorry"
              value={form.lorry}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
            >
              <option value="">
                {loading ? "Loading lorries..." : "Select a lorry"}
              </option>

              {lorries.map((lorry) => (
                <option key={lorry.id} value={lorry.id}>
                  {lorry.registration_number}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Expense Type *
            </label>
            <select
              name="expense_type"
              value={form.expense_type}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
            >
              {expenseTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Amount (KES) *
            </label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              min="0.01"
              step="0.01"
              required
              placeholder="Enter amount"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Expense Date *
            </label>
            <input
              type="date"
              name="expense_date"
              value={form.expense_date}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description / Notes
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="3"
              placeholder="Enter additional details..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving || loading || lorries.length === 0}
              className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
