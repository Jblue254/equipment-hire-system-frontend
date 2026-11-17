
import { useEffect, useState } from "react";
import {
  Plus, Search, RefreshCw, CalendarDays,
  ClipboardList, X, Trash2
} from "lucide-react";
import { toast } from "sonner";
import {
  getBookings,
  createBooking,
  decideBooking,
} from "../../services/bookingService";
import {
  getEquipment,
  getEquipmentUnits,
} from "../../services/inventoryService";

const emptyItem = () => ({
  equipment: "",
  equipment_unit: "",
  quantity: 1,
  rate_period: "DAILY",
  duration_units: 1,
});

const emptyForm = {
  customer_name: "",
  customer_phone: "",
  customer_email: "",
  customer_address: "",
  start_date: "",
  expected_return_date: "",
  payment_arrangement: "FULL_PAYMENT",
  transport_required: false,
  transport_charge: "0",
  notes: "",
  items: [emptyItem()],
};

const unwrap = (data) =>
  Array.isArray(data) ? data : data?.results || [];

const money = (value) =>
  `KES ${Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
  })}`;

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState(emptyForm);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingData, equipmentData, unitData] =
        await Promise.all([
          getBookings(),
          getEquipment(),
          getEquipmentUnits(),
        ]);

      setBookings(unwrap(bookingData));
      setEquipment(unwrap(equipmentData));
      setUnits(unwrap(unitData));
    } catch (error) {
      toast.error("Failed to load booking information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateItem = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: value,
              ...(field === "equipment"
                ? { equipment_unit: "", quantity: 1 }
                : {}),
            }
          : item
      ),
    }));
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, emptyItem()],
    }));
  };

  const removeItem = (index) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const selectedEquipment = (id) =>
    equipment.find((item) => String(item.id) === String(id));

  const availableUnits = (equipmentId) =>
    units.filter(
      (unit) =>
        String(unit.equipment) === String(equipmentId) &&
        unit.status === "AVAILABLE"
    );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.items.length || form.items.some((item) => !item.equipment)) {
      toast.error("Select equipment for every booking item.");
      return;
    }

    if (
      form.items.some(
        (item) =>
          selectedEquipment(item.equipment)?.tracking_type === "INDIVIDUAL" &&
          !item.equipment_unit
      )
    ) {
      toast.error("Select an available unit for individual equipment.");
      return;
    }

    if (
      form.transport_required &&
      Number(form.transport_charge) <= 0
    ) {
      toast.error("Enter a valid transport charge.");
      return;
    }

    const payload = {
      ...form,
      transport_charge: form.transport_required
        ? form.transport_charge
        : "0",
      items: form.items.map((item) => ({
        equipment: Number(item.equipment),
        equipment_unit: item.equipment_unit
          ? Number(item.equipment_unit)
          : null,
        quantity: Number(item.quantity),
        rate_period: item.rate_period,
        duration_units: Number(item.duration_units),
      })),
    };

    setSaving(true);

    try {
      await createBooking(payload);
      toast.success("Booking created successfully.");
      setShowModal(false);
      setForm(emptyForm);
      await loadData();
    } catch (error) {
      const data = error.response?.data;
      const message =
        data?.error ||
        Object.values(data || {}).flat().join(" ") ||
        "Could not create booking.";
      toast.error(String(message));
    } finally {
      setSaving(false);
    }
  };

  const handleDecision = async (booking, decision) => {
    if (!window.confirm(
      `${decision === "APPROVE" ? "Approve" : "Reject"} booking ${booking.booking_number}?`
    )) return;

    try {
      await decideBooking(booking.id, { decision });
      toast.success(`Booking ${decision.toLowerCase()}d successfully.`);
      await loadData();
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Booking decision failed."
      );
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    const term = search.toLowerCase();

    const matchesSearch =
      booking.booking_number?.toLowerCase().includes(term) ||
      booking.customer_name?.toLowerCase().includes(term) ||
      booking.customer_phone?.toLowerCase().includes(term);

    return (
      matchesSearch &&
      (!statusFilter || booking.status === statusFilter)
    );
  });

  const statusStyle = {
    PENDING: "bg-amber-100 text-amber-700",
    APPROVED: "bg-blue-100 text-blue-700",
    REJECTED: "bg-red-100 text-red-700",
    ACTIVE: "bg-emerald-100 text-emerald-700",
    OVERDUE: "bg-red-100 text-red-700",
    COMPLETED: "bg-slate-100 text-slate-700",
    CANCELLED: "bg-slate-100 text-slate-500",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage equipment hire bookings and customer requests.
          </p>
        </div>

        <button
          onClick={() => {
            setForm(emptyForm);
            setShowModal(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} /> New Booking
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          ["Total Bookings", bookings.length],
          ["Pending Review", bookings.filter(b => b.status === "PENDING").length],
          ["Active Hires", bookings.filter(b => ["ACTIVE", "OVERDUE"].includes(b.status)).length],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div className="relative min-w-52 flex-1">
            <Search size={17} className="absolute left-3 top-3 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search booking or customer..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
          >
            <option value="">All statuses</option>
            {["PENDING", "APPROVED", "REJECTED", "ACTIVE", "OVERDUE", "COMPLETED", "CANCELLED"].map(status => (
              <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
            ))}
          </select>

          <button
            onClick={loadData}
            className="rounded-lg border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw size={17} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading bookings...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="mx-auto mb-3 text-slate-300" size={36} />
            <p className="font-medium text-slate-700">No bookings found</p>
            <p className="mt-1 text-sm text-slate-500">Create a booking to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Booking</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Hire period</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4 font-semibold text-slate-800">
                      {booking.booking_number}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-800">{booking.customer_name}</p>
                      <p className="text-xs text-slate-500">{booking.customer_phone}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {booking.start_date} – {booking.expected_return_date}
                    </td>
                    <td className="px-4 py-4 font-medium">{money(booking.total_amount)}</td>
                    <td className="px-4 py-4 text-slate-600">
                      {booking.payment_arrangement?.replaceAll("_", " ")}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle[booking.status] || "bg-slate-100 text-slate-600"}`}>
                        {booking.status?.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {booking.status === "PENDING" &&
                       booking.payment_arrangement !== "CREDIT" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDecision(booking, "APPROVE")}
                            className="text-xs font-semibold text-emerald-700 hover:underline"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleDecision(booking, "REJECT")}
                            className="text-xs font-semibold text-red-600 hover:underline"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-4">
          <form
            onSubmit={handleSubmit}
            className="my-6 w-full max-w-4xl rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Create Booking</h2>
                <p className="text-sm text-slate-500">Enter customer and equipment details.</p>
              </div>
              <button type="button" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-5">
              <section>
                <h3 className="mb-3 font-semibold text-slate-800">Customer details</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input required placeholder="Customer name" value={form.customer_name} onChange={e => updateField("customer_name", e.target.value)} className="rounded-lg border p-3 text-sm" />
                  <input required placeholder="Phone number" value={form.customer_phone} onChange={e => updateField("customer_phone", e.target.value)} className="rounded-lg border p-3 text-sm" />
                  <input type="email" placeholder="Email (optional)" value={form.customer_email} onChange={e => updateField("customer_email", e.target.value)} className="rounded-lg border p-3 text-sm" />
                  <input placeholder="Address (optional)" value={form.customer_address} onChange={e => updateField("customer_address", e.target.value)} className="rounded-lg border p-3 text-sm" />
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800">Equipment items</h3>
                  <button type="button" onClick={addItem} className="flex items-center gap-1 text-sm font-medium text-blue-600">
                    <Plus size={16} /> Add item
                  </button>
                </div>

                <div className="space-y-4">
                  {form.items.map((item, index) => {
                    const selected = selectedEquipment(item.equipment);
                    const individual = selected?.tracking_type === "INDIVIDUAL";

                    return (
                      <div key={index} className="rounded-xl border border-slate-200 p-4">
                        <div className="mb-3 flex justify-between">
                          <p className="text-sm font-semibold">Item {index + 1}</p>
                          {form.items.length > 1 && (
                            <button type="button" onClick={() => removeItem(index)} className="text-red-500">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <select required value={item.equipment} onChange={e => updateItem(index, "equipment", e.target.value)} className="rounded-lg border p-3 text-sm">
                            <option value="">Select equipment</option>
                            {equipment.filter(e => e.is_active).map(e => (
                              <option key={e.id} value={e.id}>
                                {e.name} ({e.tracking_type === "INDIVIDUAL" ? "Individual" : `Available: ${e.available_quantity}`})
                              </option>
                            ))}
                          </select>

                          {individual ? (
                            <select required value={item.equipment_unit} onChange={e => updateItem(index, "equipment_unit", e.target.value)} className="rounded-lg border p-3 text-sm">
                              <option value="">Select available unit</option>
                              {availableUnits(item.equipment).map(unit => (
                                <option key={unit.id} value={unit.id}>{unit.asset_number}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="number"
                              min="1"
                              max={selected?.available_quantity || undefined}
                              required
                              value={item.quantity}
                              onChange={e => updateItem(index, "quantity", e.target.value)}
                              placeholder="Quantity"
                              className="rounded-lg border p-3 text-sm"
                            />
                          )}

                          <select value={item.rate_period} onChange={e => updateItem(index, "rate_period", e.target.value)} className="rounded-lg border p-3 text-sm">
                            {["HOURLY", "DAILY", "WEEKLY", "MONTHLY"].map(rate => (
                              <option key={rate} value={rate}>{rate}</option>
                            ))}
                          </select>

                          <input type="number" min="1" required value={item.duration_units} onChange={e => updateItem(index, "duration_units", e.target.value)} placeholder="Duration" className="rounded-lg border p-3 text-sm" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="mb-3 font-semibold text-slate-800">Booking details</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm text-slate-600">
                    Start date
                    <input type="date" required value={form.start_date} onChange={e => updateField("start_date", e.target.value)} className="mt-1 w-full rounded-lg border p-3" />
                  </label>
                  <label className="text-sm text-slate-600">
                    Expected return date
                    <input type="date" required value={form.expected_return_date} onChange={e => updateField("expected_return_date", e.target.value)} className="mt-1 w-full rounded-lg border p-3" />
                  </label>
                  <select value={form.payment_arrangement} onChange={e => updateField("payment_arrangement", e.target.value)} className="rounded-lg border p-3 text-sm">
                    <option value="FULL_PAYMENT">Full payment</option>
                    <option value="CREDIT">Credit (Admin approval required)</option>
                  </select>
                  <textarea rows="2" placeholder="Booking notes (optional)" value={form.notes} onChange={e => updateField("notes", e.target.value)} className="rounded-lg border p-3 text-sm" />
                </div>

                <div className="mt-4 rounded-lg bg-slate-50 p-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <input type="checkbox" checked={form.transport_required} onChange={e => updateField("transport_required", e.target.checked)} />
                    Customer requires transportation
                  </label>
                  {form.transport_required && (
                    <input type="number" min="0.01" step="0.01" required value={form.transport_charge} onChange={e => updateField("transport_charge", e.target.value)} placeholder="Transport charge (KES)" className="mt-3 w-full rounded-lg border p-3 text-sm sm:max-w-xs" />
                  )}
                </div>
              </section>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 p-5">
              <button type="button" onClick={() => setShowModal(false)} className="rounded-lg border px-4 py-2.5 text-sm">
                Cancel
              </button>
              <button disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                {saving ? "Creating..." : "Create Booking"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
