
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Package,
  RefreshCw,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  getEquipment,
  getEquipmentCategories,
  createEquipment,
  updateEquipment,
  deleteEquipment,
} from "../../services/inventoryService";

const initialForm = {
  category: "",
  name: "",
  tracking_type: "INDIVIDUAL",
  identification_number: "",
  total_quantity: 1,
  hourly_rate: "",
  daily_rate: "",
  weekly_rate: "",
  monthly_rate: "",
  description: "",
  condition_notes: "",
};

const statusStyles = {
  AVAILABLE: "bg-green-100 text-green-700",
  RESERVED: "bg-yellow-100 text-yellow-700",
  HIRED_OUT: "bg-blue-100 text-blue-700",
  UNDER_MAINTENANCE: "bg-orange-100 text-orange-700",
  DAMAGED: "bg-red-100 text-red-700",
  RETIRED: "bg-slate-200 text-slate-600",
};

const formatStatus = (status) =>
  status?.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) =>
    char.toUpperCase()
  );

function Equipment() {
  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);

  const loadData = async () => {
    try {
      setLoading(true);

      const [equipmentData, categoryData] = await Promise.all([
        getEquipment(),
        getEquipmentCategories(),
      ]);

      setEquipment(Array.isArray(equipmentData) ? equipmentData : equipmentData.results || []);
      setCategories(Array.isArray(categoryData) ? categoryData : categoryData.results || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load equipment.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredEquipment = useMemo(() => {
    return equipment.filter((item) => {
      const matchesSearch =
        item.name?.toLowerCase().includes(search.toLowerCase()) ||
        item.identification_number?.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [equipment, search, statusFilter]);

  const openCreateModal = () => {
    setEditingItem(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setForm({
      category: String(item.category),
      name: item.name || "",
      tracking_type: item.tracking_type,
      identification_number: item.identification_number || "",
      total_quantity: item.total_quantity ?? 1,
      hourly_rate: item.hourly_rate ?? "",
      daily_rate: item.daily_rate ?? "",
      weekly_rate: item.weekly_rate ?? "",
      monthly_rate: item.monthly_rate ?? "",
      description: item.description || "",
      condition_notes: item.condition_notes || "",
    });
    setShowModal(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      category: Number(form.category),
      total_quantity:
        form.tracking_type === "INDIVIDUAL"
          ? 1
          : Number(form.total_quantity),
      hourly_rate: form.hourly_rate || null,
      daily_rate: form.daily_rate || null,
      weekly_rate: form.weekly_rate || null,
      monthly_rate: form.monthly_rate || null,
    };

    if (form.tracking_type === "QUANTITY") {
      payload.identification_number = "";
    }

    try {
      if (editingItem) {
        await updateEquipment(editingItem.id, payload);
        toast.success("Equipment updated successfully.");
      } else {
        await createEquipment(payload);
        toast.success("Equipment registered successfully.");
      }

      setShowModal(false);
      setForm(initialForm);
      setEditingItem(null);
      await loadData();
    } catch (error) {
      console.error(error.response?.data || error);
      const errors = error.response?.data;
      const message =
        errors?.detail ||
        Object.entries(errors || {})
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
          .join(" | ");

      toast.error(message || "Failed to save equipment.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete ${item.name}?`)) return;

    try {
      await deleteEquipment(item.id);
      toast.success("Equipment deleted successfully.");
      await loadData();
    } catch (error) {
      console.error(error.response?.data || error);
      toast.error("Unable to delete this equipment.");
    }
  };

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Equipment Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Register, monitor and manage your hire equipment.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Equipment
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          ["Total Equipment", equipment.length],
          ["Available", equipment.filter((item) => item.status === "AVAILABLE").length],
          ["Hired Out", equipment.filter((item) => item.status === "HIRED_OUT").length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search equipment or identification number..."
            className={`${inputClass} pl-10`}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className={`${inputClass} sm:w-52`}
        >
          <option value="ALL">All statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="RESERVED">Reserved</option>
          <option value="HIRED_OUT">Hired Out</option>
          <option value="UNDER_MAINTENANCE">Under Maintenance</option>
          <option value="DAMAGED">Damaged</option>
          <option value="RETIRED">Retired</option>
        </select>

        <button
          onClick={loadData}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Equipment</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Tracking</th>
                <th className="px-5 py-4">Quantity</th>
                <th className="px-5 py-4">Daily Rate</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-slate-500">
                    Loading equipment...
                  </td>
                </tr>
              ) : filteredEquipment.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-slate-500">
                    <Package className="mx-auto mb-2 text-slate-400" size={28} />
                    No equipment found.
                  </td>
                </tr>
              ) : (
                filteredEquipment.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">{item.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.identification_number || "No asset number"}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {item.category_name || item.category}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {item.tracking_type === "INDIVIDUAL" ? "Individual" : "Quantity"}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {item.available_quantity} / {item.total_quantity}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {item.daily_rate ? `KES ${Number(item.daily_rate).toLocaleString()}` : "—"}
                    </td>

                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[item.status] || "bg-slate-100 text-slate-600"}`}>
                        {formatStatus(item.status)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                          title="Edit equipment"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() => handleDelete(item)}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          title="Delete equipment"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingItem ? "Edit Equipment" : "Register Equipment"}
              </h2>

              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Equipment Name *
                  </label>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className={inputClass}
                    placeholder="e.g. Wheelbarrow"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Tracking Type *
                  </label>
                  <select
                    name="tracking_type"
                    value={form.tracking_type}
                    onChange={handleChange}
                    disabled={Boolean(editingItem)}
                    className={inputClass}
                  >
                    <option value="INDIVIDUAL">Individual</option>
                    <option value="QUANTITY">Quantity-based</option>
                  </select>
                </div>

                {form.tracking_type === "INDIVIDUAL" ? (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Identification Number *
                    </label>
                    <input
                      name="identification_number"
                      value={form.identification_number}
                      onChange={handleChange}
                      required
                      className={inputClass}
                      placeholder="e.g. WB-001"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Total Quantity *
                    </label>
                    <input
                      type="number"
                      name="total_quantity"
                      min="1"
                      value={form.total_quantity}
                      onChange={handleChange}
                      required
                      disabled={Boolean(editingItem)}
                      className={inputClass}
                    />
                  </div>
                )}

                {[
                  ["hourly_rate", "Hourly Rate"],
                  ["daily_rate", "Daily Rate"],
                  ["weekly_rate", "Weekly Rate"],
                  ["monthly_rate", "Monthly Rate"],
                ].map(([name, label]) => (
                  <div key={name}>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      {label} (KES)
                    </label>
                    <input
                      type="number"
                      name={name}
                      min="0"
                      step="0.01"
                      value={form[name]}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                ))}

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows="2"
                    className={inputClass}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Condition Notes
                  </label>
                  <textarea
                    name="condition_notes"
                    value={form.condition_notes}
                    onChange={handleChange}
                    rows="2"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingItem ? "Update Equipment" : "Register Equipment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Equipment;
