
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  AlertTriangle,
  X,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import {
  getMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getMaterialCategories,
} from "../../services/inventoryService";

const initialForm = {
  category: "",
  name: "",
  unit: "TONNE",
  reorder_level: "0",
  buying_price: "",
  selling_price: "",
  description: "",
  is_active: true,
};

const units = [
  { value: "TONNE", label: "Tonne" },
  { value: "TRIP", label: "Trip" },
  { value: "LORRY_LOAD", label: "Lorry Load" },
  { value: "CUBIC_METRE", label: "Cubic Metre" },
  { value: "BAG", label: "Bag" },
  { value: "PIECE", label: "Piece" },
];

const money = (value) =>
  `KES ${Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [stockFilter, setStockFilter] = useState("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);

      const [materialData, categoryData] = await Promise.all([
        getMaterials(),
        getMaterialCategories(),
      ]);

      setMaterials(
        Array.isArray(materialData)
          ? materialData
          : materialData.results || []
      );

      setCategories(
        Array.isArray(categoryData)
          ? categoryData
          : categoryData.results || []
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to load materials.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredMaterials = useMemo(() => {
    return materials.filter((material) => {
      const matchesSearch =
        material.name.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        categoryFilter === "ALL" ||
        String(material.category) === categoryFilter;

      const stock = Number(material.stock_quantity || 0);
      const reorder = Number(material.reorder_level || 0);

      const matchesStock =
        stockFilter === "ALL" ||
        (stockFilter === "OUT" && stock <= 0) ||
        (stockFilter === "LOW" && stock > 0 && stock <= reorder) ||
        (stockFilter === "AVAILABLE" && stock > reorder);

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [materials, search, categoryFilter, stockFilter]);

  const totalMaterials = materials.length;

  const lowStock = materials.filter((item) => {
    const stock = Number(item.stock_quantity || 0);
    const reorder = Number(item.reorder_level || 0);
    return stock > 0 && stock <= reorder;
  }).length;

  const outOfStock = materials.filter(
    (item) => Number(item.stock_quantity || 0) <= 0
  ).length;

  const openAddModal = () => {
    setEditingMaterial(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEditModal = (material) => {
    setEditingMaterial(material);

    setForm({
      category: String(material.category || ""),
      name: material.name || "",
      unit: material.unit || "TONNE",
      reorder_level: String(material.reorder_level ?? 0),
      buying_price: String(material.buying_price ?? ""),
      selling_price: String(material.selling_price ?? ""),
      description: material.description || "",
      is_active: material.is_active,
    });

    setModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.category) {
      toast.error("Please select a material category.");
      return;
    }

    if (!form.name.trim()) {
      toast.error("Material name is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...form,
        category: Number(form.category),
        reorder_level: Number(form.reorder_level),
        buying_price: Number(form.buying_price),
        selling_price: Number(form.selling_price),
      };

      if (editingMaterial) {
        await updateMaterial(editingMaterial.id, payload);
        toast.success("Material updated successfully.");
      } else {
        await createMaterial(payload);
        toast.success("Material created successfully.");
      }

      setModalOpen(false);
      setForm(initialForm);
      setEditingMaterial(null);
      await loadData();
    } catch (error) {
      console.error(error);

      const errors = error.response?.data;
      const message =
        typeof errors === "object"
          ? Object.entries(errors)
              .map(([key, value]) =>
                `${key}: ${Array.isArray(value) ? value.join(", ") : value}`
              )
              .join(" | ")
          : "Failed to save material.";

      toast.error(message || "Failed to save material.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (material) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${material.name}?`
    );

    if (!confirmed) return;

    try {
      await deleteMaterial(material.id);
      toast.success("Material deleted successfully.");
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.detail || "Unable to delete this material."
      );
    }
  };

  const getStockStatus = (material) => {
    const stock = Number(material.stock_quantity || 0);
    const reorder = Number(material.reorder_level || 0);

    if (stock <= 0) {
      return {
        label: "Out of Stock",
        style: "bg-red-100 text-red-700",
      };
    }

    if (stock <= reorder) {
      return {
        label: "Low Stock",
        style: "bg-amber-100 text-amber-700",
      };
    }

    return {
      label: "In Stock",
      style: "bg-green-100 text-green-700",
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Materials Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage construction materials, prices and stock levels.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Material
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Total Materials"
          value={totalMaterials}
          icon={<Package size={22} />}
          color="blue"
        />

        <SummaryCard
          title="Low Stock"
          value={lowStock}
          icon={<AlertTriangle size={22} />}
          color="amber"
        />

        <SummaryCard
          title="Out of Stock"
          value={outOfStock}
          icon={<AlertTriangle size={22} />}
          color="red"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search materials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
        >
          <option value="ALL">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
        >
          <option value="ALL">All Stock Levels</option>
          <option value="AVAILABLE">In Stock</option>
          <option value="LOW">Low Stock</option>
          <option value="OUT">Out of Stock</option>
        </select>

        <button
          onClick={loadData}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Materials table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Material</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Stock</th>
                <th className="px-5 py-4">Unit</th>
                <th className="px-5 py-4">Buying Price</th>
                <th className="px-5 py-4">Selling Price</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    Loading materials...
                  </td>
                </tr>
              ) : filteredMaterials.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    No materials found.
                  </td>
                </tr>
              ) : (
                filteredMaterials.map((material) => {
                  const status = getStockStatus(material);

                  return (
                    <tr key={material.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-medium text-slate-800">
                        {material.name}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {material.category_name || "Uncategorized"}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-700">
                        {Number(material.stock_quantity || 0).toLocaleString()}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {material.unit?.replaceAll("_", " ")}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {money(material.buying_price)}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-800">
                        {money(material.selling_price)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${status.style}`}
                        >
                          {status.label}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(material)}
                            title="Edit material"
                            className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            onClick={() => handleDelete(material)}
                            title="Delete material"
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {editingMaterial ? "Edit Material" : "Add Material"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Enter material details and pricing.
                </p>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Material Name">
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Ballast"
                    className="form-input"
                  />
                </FormField>

                <FormField label="Category">
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                    className="form-input"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Measurement Unit">
                  <select
                    name="unit"
                    value={form.unit}
                    onChange={handleChange}
                    className="form-input"
                  >
                    {units.map((unit) => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Reorder Level">
                  <input
                    type="number"
                    name="reorder_level"
                    min="0"
                    step="0.01"
                    value={form.reorder_level}
                    onChange={handleChange}
                    className="form-input"
                  />
                </FormField>

                <FormField label="Buying Price (KES)">
                  <input
                    type="number"
                    name="buying_price"
                    min="0"
                    step="0.01"
                    value={form.buying_price}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </FormField>

                <FormField label="Selling Price (KES)">
                  <input
                    type="number"
                    name="selling_price"
                    min="0"
                    step="0.01"
                    value={form.selling_price}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </FormField>
              </div>

              <FormField label="Description">
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Optional material description..."
                  className="form-input"
                />
              </FormField>

              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                  className="h-4 w-4 accent-blue-600"
                />
                Active material
              </label>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingMaterial
                      ? "Update Material"
                      : "Save Material"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, value, icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}</p>
        <div className={`rounded-lg p-2 ${colors[color]}`}>{icon}</div>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <label className="block space-y-2 text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}
