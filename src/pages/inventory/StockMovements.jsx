
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  PackagePlus,
  PackageMinus,
  ClipboardList,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  getStockMovements,
  createStockMovement,
  getMaterials,
} from "../../services/inventoryService";

const initialForm = {
  material: "",
  movement_type: "STOCK_IN",
  quantity: "",
  reference: "",
  notes: "",
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString("en-KE")
    : "—";

export default function StockMovements() {
  const [movements, setMovements] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  const loadData = async () => {
    try {
      setLoading(true);

      const [movementData, materialData] = await Promise.all([
        getStockMovements(),
        getMaterials(),
      ]);

      setMovements(
        Array.isArray(movementData)
          ? movementData
          : movementData.results || []
      );

      setMaterials(
        Array.isArray(materialData)
          ? materialData
          : materialData.results || []
      );
    } catch (error) {
      console.error(error);
      toast.error("Failed to load stock movements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredMovements = useMemo(() => {
    return movements.filter((movement) => {
      const materialName =
        movement.material_name ||
        materials.find(
          (item) => item.id === movement.material
        )?.name ||
        "";

      const matchesSearch =
        materialName.toLowerCase().includes(search.toLowerCase()) ||
        (movement.reference || "")
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesType =
        typeFilter === "ALL" ||
        movement.movement_type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [movements, materials, search, typeFilter]);

  const totals = {
    stockIn: movements
      .filter((item) => item.movement_type === "STOCK_IN")
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0),

    stockOut: movements
      .filter((item) => item.movement_type === "STOCK_OUT")
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0),

    adjustments: movements.filter(
      (item) => item.movement_type === "ADJUSTMENT"
    ).length,
  };

  const handleChange = (e) => {
    setForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.material) {
      toast.error("Please select a material.");
      return;
    }

    if (Number(form.quantity) <= 0) {
      toast.error("Quantity must be greater than zero.");
      return;
    }

    try {
      setSaving(true);

      await createStockMovement({
        ...form,
        material: Number(form.material),
        quantity: Number(form.quantity),
      });

      toast.success("Stock movement recorded successfully.");

      setModalOpen(false);
      setForm(initialForm);

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
          : "Failed to record stock movement.";

      toast.error(message || "Failed to record stock movement.");
    } finally {
      setSaving(false);
    }
  };

  const getMovementStyle = (type) => {
    if (type === "STOCK_IN") {
      return "bg-green-100 text-green-700";
    }

    if (type === "STOCK_OUT") {
      return "bg-red-100 text-red-700";
    }

    return "bg-blue-100 text-blue-700";
  };

  const getMovementLabel = (type) => {
    if (type === "STOCK_IN") return "Stock In";
    if (type === "STOCK_OUT") return "Stock Out";
    return "Adjustment";
  };

  const getMaterialName = (movement) => {
    return (
      movement.material_name ||
      materials.find(
        (item) => item.id === movement.material
      )?.name ||
      `Material #${movement.material}`
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Stock Movements
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track material stock received, issued and adjusted.
          </p>
        </div>

        <button
          onClick={() => {
            setForm(initialForm);
            setModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Record Movement
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Total Stock In"
          value={totals.stockIn.toLocaleString()}
          icon={<PackagePlus size={22} />}
          color="green"
        />

        <SummaryCard
          title="Total Stock Out"
          value={totals.stockOut.toLocaleString()}
          icon={<PackageMinus size={22} />}
          color="red"
        />

        <SummaryCard
          title="Adjustments"
          value={totals.adjustments}
          icon={<ClipboardList size={22} />}
          color="blue"
        />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search material or reference..."
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
        >
          <option value="ALL">All Movements</option>
          <option value="STOCK_IN">Stock In</option>
          <option value="STOCK_OUT">Stock Out</option>
          <option value="ADJUSTMENT">Adjustment</option>
        </select>

        <button
          onClick={loadData}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Material</th>
                <th className="px-5 py-4">Movement</th>
                <th className="px-5 py-4">Quantity</th>
                <th className="px-5 py-4">Reference</th>
                <th className="px-5 py-4">Recorded By</th>
                <th className="px-5 py-4">Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    Loading stock movements...
                  </td>
                </tr>
              ) : filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    No stock movements found.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {getMaterialName(movement)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getMovementStyle(
                          movement.movement_type
                        )}`}
                      >
                        {getMovementLabel(movement.movement_type)}
                      </span>
                    </td>

                    <td className="px-5 py-4 font-medium text-slate-700">
                      {Number(movement.quantity).toLocaleString()}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {movement.reference || "—"}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {movement.recorded_by || "—"}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(movement.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <h2 className="text-lg font-semibold text-slate-800">
                Record Stock Movement
              </h2>

              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              <FormField label="Material">
                <select
                  name="material"
                  value={form.material}
                  onChange={handleChange}
                  required
                  className="form-input"
                >
                  <option value="">Select material</option>
                  {materials.map((material) => (
                    <option key={material.id} value={material.id}>
                      {material.name} (Current stock: {material.stock_quantity})
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Movement Type">
                <select
                  name="movement_type"
                  value={form.movement_type}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="STOCK_IN">Stock In</option>
                  <option value="STOCK_OUT">Stock Out</option>
                  <option value="ADJUSTMENT">Stock Adjustment</option>
                </select>
              </FormField>

              <FormField
                label={
                  form.movement_type === "ADJUSTMENT"
                    ? "New Physical Stock Balance"
                    : "Quantity"
                }
              >
                <input
                  type="number"
                  name="quantity"
                  min="0.01"
                  step="0.01"
                  value={form.quantity}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </FormField>

              {form.movement_type === "ADJUSTMENT" && (
                <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
                  Enter the actual stock quantity after physically counting
                  the material. This replaces the current stock balance.
                </p>
              )}

              <FormField label="Reference">
                <input
                  name="reference"
                  value={form.reference}
                  onChange={handleChange}
                  placeholder="e.g. Purchase invoice or delivery number"
                  className="form-input"
                />
              </FormField>

              <FormField label="Notes">
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Optional explanation..."
                  className="form-input"
                />
              </FormField>

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
                  {saving ? "Saving..." : "Record Movement"}
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
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    blue: "bg-blue-50 text-blue-600",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{title}</p>
        <div className={`rounded-lg p-2 ${colors[color]}`}>
          {icon}
        </div>
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
