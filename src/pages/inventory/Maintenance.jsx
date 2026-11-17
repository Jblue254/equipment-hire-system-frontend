
import { useEffect, useMemo, useState } from "react";
import {
  Wrench,
  Plus,
  Search,
  RefreshCw,
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import {
  getMaintenanceRecords,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  getEquipment,
  getEquipmentUnits,
} from "../../services/inventoryService";

const emptyForm = {
  equipment: "",
  unit: "",
  quantity_affected: 1,
  maintenance_type: "REPAIR",
  problem_reported: "",
  work_done: "",
  service_provider: "",
  repair_cost: "0",
  date_started: "",
  date_completed: "",
  next_service_date: "",
  status: "REPORTED",
  condition_cleared: false,
};

const unwrap = (data) =>
  Array.isArray(data) ? data : data?.results || [];

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "—";

const formatMoney = (value) =>
  `KES ${Number(value || 0).toLocaleString()}`;

export default function Maintenance() {
  const [records, setRecords] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [units, setUnits] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [form, setForm] = useState(emptyForm);

  const selectedEquipment = equipment.find(
    (item) => String(item.id) === String(form.equipment)
  );

  const individualTracking =
    selectedEquipment?.tracking_type === "INDIVIDUAL";

  const loadData = async () => {
    try {
      setLoading(true);

      const [maintenanceData, equipmentData, unitData] =
        await Promise.all([
          getMaintenanceRecords(),
          getEquipment(),
          getEquipmentUnits(),
        ]);

      setRecords(unwrap(maintenanceData));
      setEquipment(unwrap(equipmentData));
      setUnits(unwrap(unitData));
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
        "Failed to load maintenance records."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const searchText = [
        record.equipment_name,
        record.unit_asset_number,
        record.problem_reported,
        record.service_provider,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchText.includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || record.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [records, search, statusFilter]);

  const summary = {
    reported: records.filter((r) => r.status === "REPORTED").length,
    inProgress: records.filter((r) => r.status === "IN_PROGRESS").length,
    completed: records.filter((r) => r.status === "COMPLETED").length,
    cost: records.reduce(
      (total, record) => total + Number(record.repair_cost || 0),
      0
    ),
  };

  const availableUnits = units.filter(
    (unit) =>
      String(unit.equipment) === String(form.equipment) &&
      unit.status === "AVAILABLE"
  );

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const openModal = () => {
    setForm(emptyForm);
    setModalOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.equipment || !form.problem_reported.trim()) {
      toast.error("Select equipment and describe the problem.");
      return;
    }

    if (individualTracking && !form.unit) {
      toast.error("Select an available equipment unit.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        equipment: Number(form.equipment),
        unit: individualTracking ? Number(form.unit) : null,
        quantity_affected: individualTracking
          ? 1
          : Number(form.quantity_affected),
        maintenance_type: form.maintenance_type,
        problem_reported: form.problem_reported,
        work_done: form.work_done,
        service_provider: form.service_provider,
        repair_cost: Number(form.repair_cost || 0),
        date_started: form.date_started || null,
        date_completed: form.date_completed || null,
        next_service_date: form.next_service_date || null,
        status: form.status,
        condition_cleared: false,
      };

      await createMaintenanceRecord(payload);

      toast.success("Maintenance record created.");
      setModalOpen(false);
      setForm(emptyForm);
      await loadData();
    } catch (error) {
      const data = error.response?.data;
      const message =
        typeof data === "string"
          ? data
          : data?.detail ||
            Object.entries(data || {})
              .map(([key, value]) =>
                `${key}: ${Array.isArray(value) ? value.join(", ") : value}`
              )
              .join(" | ");

      toast.error(message || "Failed to create maintenance record.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (record) => {
    if (record.condition_cleared) {
      toast.error("This maintenance record is already cleared.");
      return;
    }

    const nextStatus = window.prompt(
      "Enter status: REPORTED, IN_PROGRESS, COMPLETED or CANCELLED",
      record.status
    );

    if (!nextStatus) return;

    const status = nextStatus.trim().toUpperCase();

    if (!["REPORTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].includes(status)) {
      toast.error("Invalid maintenance status.");
      return;
    }

    const workDone = window.prompt(
      "Enter work done (leave blank if not applicable):",
      record.work_done || ""
    );

    if (workDone === null) return;

    const repairCost = window.prompt(
      "Enter repair cost in KES:",
      String(record.repair_cost || 0)
    );

    if (repairCost === null) return;

    if (!Number.isFinite(Number(repairCost)) || Number(repairCost) < 0) {
      toast.error("Enter a valid repair cost.");
      return;
    }

    let conditionCleared = false;

    if (["COMPLETED", "CANCELLED"].includes(status)) {
      conditionCleared = window.confirm(
        "Has the equipment been inspected and confirmed ready for release? Click OK to clear it, or Cancel to keep it under maintenance."
      );
    }

    try {
      await updateMaintenanceRecord(record.id, {
        status,
        work_done: workDone,
        repair_cost: Number(repairCost),
        condition_cleared: conditionCleared,
      });

      toast.success(
        conditionCleared
          ? "Maintenance updated and equipment released."
          : "Maintenance record updated."
      );

      await loadData();
    } catch (error) {
      const data = error.response?.data;
      const message =
        data?.detail ||
        Object.entries(data || {})
          .map(([key, value]) =>
            `${key}: ${Array.isArray(value) ? value.join(", ") : value}`
          )
          .join(" | ");

      toast.error(message || "Failed to update maintenance.");
    }
  };

  const statusStyle = {
    REPORTED: "bg-amber-100 text-amber-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-emerald-100 text-emerald-700",
    CANCELLED: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Maintenance Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track equipment faults, servicing and repairs.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            onClick={openModal}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={17} />
            Report Maintenance
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Reported",
            value: summary.reported,
            icon: AlertTriangle,
            color: "text-amber-600 bg-amber-50",
          },
          {
            label: "In Progress",
            value: summary.inProgress,
            icon: Clock,
            color: "text-blue-600 bg-blue-50",
          },
          {
            label: "Completed",
            value: summary.completed,
            icon: CheckCircle,
            color: "text-emerald-600 bg-emerald-50",
          },
          {
            label: "Total Repair Cost",
            value: formatMoney(summary.cost),
            icon: Wrench,
            color: "text-violet-600 bg-violet-50",
          },
        ].map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{card.label}</p>
                <div className={`rounded-lg p-2 ${card.color}`}>
                  <Icon size={19} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search equipment, asset number or problem..."
              className="form-input pl-10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input sm:w-52"
          >
            <option value="ALL">All statuses</option>
            <option value="REPORTED">Reported</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Equipment</th>
                <th className="px-5 py-4">Problem</th>
                <th className="px-5 py-4">Type</th>
                <th className="px-5 py-4">Reported</th>
                <th className="px-5 py-4">Repair Cost</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Clearance</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center text-slate-500">
                    <Loader2 className="mx-auto mb-2 animate-spin" />
                    Loading maintenance records...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center text-slate-500">
                    No maintenance records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">
                        {record.equipment_name || `Equipment #${record.equipment}`}
                      </p>
                      <p className="text-xs text-slate-500">
                        {record.unit_asset_number || `Quantity: ${record.quantity_affected}`}
                      </p>
                    </td>

                    <td className="max-w-xs px-5 py-4">
                      <p className="truncate text-slate-700">
                        {record.problem_reported}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      {record.maintenance_type?.replaceAll("_", " ")}
                    </td>

                    <td className="px-5 py-4">
                      {formatDate(record.date_reported)}
                    </td>

                    <td className="px-5 py-4 font-medium">
                      {formatMoney(record.repair_cost)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          statusStyle[record.status] || "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {record.status?.replaceAll("_", " ")}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {record.condition_cleared ? (
                        <span className="text-xs font-medium text-emerald-600">
                          Cleared
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-amber-600">
                          Not cleared
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleUpdate(record)}
                        disabled={record.condition_cleared}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
          Showing {filteredRecords.length} maintenance records
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Report Equipment Maintenance
                </h2>
                <p className="text-xs text-slate-500">
                  Record a fault, repair or service.
                </p>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Equipment *
                  </label>
                  <select
                    name="equipment"
                    value={form.equipment}
                    onChange={(e) =>
                      setForm((previous) => ({
                        ...previous,
                        equipment: e.target.value,
                        unit: "",
                      }))
                    }
                    className="form-input"
                    required
                  >
                    <option value="">Select equipment</option>
                    {equipment.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.tracking_type})
                      </option>
                    ))}
                  </select>
                </div>

                {individualTracking ? (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Equipment Unit *
                    </label>
                    <select
                      name="unit"
                      value={form.unit}
                      onChange={handleChange}
                      className="form-input"
                      required
                    >
                      <option value="">Select available unit</option>
                      {availableUnits.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.asset_number}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      Quantity Affected *
                    </label>
                    <input
                      type="number"
                      name="quantity_affected"
                      min="1"
                      max={selectedEquipment?.available_quantity || undefined}
                      value={form.quantity_affected}
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Available: {selectedEquipment?.available_quantity ?? "—"}
                    </p>
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Maintenance Type *
                  </label>
                  <select
                    name="maintenance_type"
                    value={form.maintenance_type}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="REPAIR">Repair</option>
                    <option value="ROUTINE_SERVICE">Routine Service</option>
                    <option value="INSPECTION">Inspection</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Service Provider
                  </label>
                  <input
                    name="service_provider"
                    value={form.service_provider}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Mechanic or service company"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium">
                    Problem Reported *
                  </label>
                  <textarea
                    name="problem_reported"
                    value={form.problem_reported}
                    onChange={handleChange}
                    className="form-input"
                    rows="3"
                    required
                    placeholder="Describe the fault or service required..."
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Repair Cost (KES)
                  </label>
                  <input
                    type="number"
                    name="repair_cost"
                    min="0"
                    step="0.01"
                    value={form.repair_cost}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Initial Status
                  </label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="form-input"
                  >
                    <option value="REPORTED">Reported</option>
                    <option value="IN_PROGRESS">In Progress</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Date Started
                  </label>
                  <input
                    type="date"
                    name="date_started"
                    value={form.date_started}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Next Service Date
                  </label>
                  <input
                    type="date"
                    name="next_service_date"
                    value={form.next_service_date}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium">
                    Work Done
                  </label>
                  <textarea
                    name="work_done"
                    value={form.work_done}
                    onChange={handleChange}
                    className="form-input"
                    rows="3"
                    placeholder="Work carried out (if any)..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  Save Maintenance Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
