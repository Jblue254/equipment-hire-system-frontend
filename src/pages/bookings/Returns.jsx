
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  RotateCcw,
  Plus,
  X,
  ClipboardCheck,
  CheckCircle,
  AlertTriangle,
  Package,
} from "lucide-react";
import { toast } from "sonner";

import {
  getReturns,
  createReturn,
  getBookings,
} from "../../services/bookingService";

const unwrap = (response) => {
  if (Array.isArray(response)) return response;
  return response?.results || response?.data || [];
};

const money = (value) =>
  `KES ${Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString("en-KE", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

const conditionStyles = {
  GOOD: "bg-green-100 text-green-700",
  DAMAGED: "bg-orange-100 text-orange-700",
  MISSING: "bg-red-100 text-red-700",
};

const emptyItem = () => ({
  booking_item: "",
  quantity_returned: 1,
  condition: "GOOD",
  damage_charge: "0",
  notes: "",
});

export default function Returns() {
  const [returns, setReturns] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    booking: "",
    return_date: new Date().toISOString().slice(0, 16),
    notes: "",
    items: [emptyItem()],
  });

  const loadData = async () => {
    setLoading(true);

    try {
      const [returnResponse, bookingResponse] = await Promise.all([
        getReturns(),
        getBookings(),
      ]);

      setReturns(unwrap(returnResponse));
      setBookings(unwrap(bookingResponse));
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Failed to load return records."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const eligibleBookings = useMemo(
    () =>
      bookings.filter((booking) =>
        ["ACTIVE", "OVERDUE"].includes(booking.status)
      ),
    [bookings]
  );

  const selectedBooking = eligibleBookings.find(
    (booking) => String(booking.id) === String(form.booking)
  );

  const getOutstanding = (bookingItem) => {
    const previous = returns
      .flatMap((record) => record.items || [])
      .filter(
        (item) =>
          String(item.booking_item) === String(bookingItem.id)
      )
      .reduce(
        (total, item) => total + Number(item.quantity_returned || 0),
        0
      );

    return Math.max(
      Number(bookingItem.quantity || 0) - previous,
      0
    );
  };

  const availableItems = selectedBooking
    ? (selectedBooking.items || [])
        .map((item) => ({
          ...item,
          outstanding: getOutstanding(item),
        }))
        .filter((item) => item.outstanding > 0)
    : [];

  const updateItem = (index, field, value) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, [field]: value }
          : item
      ),
    }));
  };

  const addItem = () => {
    setForm((current) => ({
      ...current,
      items: [...current.items, emptyItem()],
    }));
  };

  const removeItem = (index) => {
    setForm((current) => ({
      ...current,
      items:
        current.items.length === 1
          ? current.items
          : current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const openModal = () => {
    setForm({
      booking: "",
      return_date: new Date().toISOString().slice(0, 16),
      notes: "",
      items: [emptyItem()],
    });
    setShowModal(true);
  };

  const handleBookingChange = (bookingId) => {
    setForm((current) => ({
      ...current,
      booking: bookingId,
      items: [emptyItem()],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedBooking) {
      toast.error("Select an active or overdue booking.");
      return;
    }

    const selectedItems = form.items.filter(
      (item) => item.booking_item
    );

    if (!selectedItems.length) {
      toast.error("Add at least one equipment item.");
      return;
    }

    const seen = new Set();

    for (const item of selectedItems) {
      const bookingItem = availableItems.find(
        (entry) => String(entry.id) === String(item.booking_item)
      );

      if (!bookingItem) {
        toast.error("One of the selected items is no longer outstanding.");
        return;
      }

      if (seen.has(String(item.booking_item))) {
        toast.error("An equipment item can only appear once per return.");
        return;
      }

      seen.add(String(item.booking_item));

      const quantity = Number(item.quantity_returned);

      if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > bookingItem.outstanding
      ) {
        toast.error(
          `Enter a valid quantity for ${bookingItem.equipment_name}. Maximum: ${bookingItem.outstanding}.`
        );
        return;
      }

      if (
        bookingItem.equipment_unit &&
        quantity !== 1
      ) {
        toast.error("Individual equipment must be returned one unit at a time.");
        return;
      }
    }

    const payload = {
      booking: Number(form.booking),
      return_date: new Date(form.return_date).toISOString(),
      notes: form.notes,
      items: selectedItems.map((item) => ({
        booking_item: Number(item.booking_item),
        quantity_returned: Number(item.quantity_returned),
        condition: item.condition,
        damage_charge: Number(item.damage_charge || 0),
        notes: item.notes,
      })),
    };

    setSaving(true);

    try {
      await createReturn(payload);
      toast.success("Equipment return recorded successfully.");
      setShowModal(false);
      await loadData();
    } catch (error) {
      const data = error.response?.data;
      const message =
        typeof data === "string"
          ? data
          : data?.error ||
            data?.detail ||
            data?.items?.[0] ||
            "Failed to record equipment return.";

      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const filteredReturns = returns.filter((record) => {
    const query = search.toLowerCase();

    return (
      record.booking_number?.toLowerCase().includes(query) ||
      record.booking?.toString().includes(query) ||
      record.notes?.toLowerCase().includes(query) ||
      record.received_by?.toLowerCase().includes(query)
    );
  });

  const totalReturns = returns.length;

  const damagedCount = returns
    .flatMap((record) => record.items || [])
    .filter((item) => item.condition === "DAMAGED").length;

  const missingCount = returns
    .flatMap((record) => record.items || [])
    .filter((item) => item.condition === "MISSING").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Equipment Returns
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Receive hired equipment and record its condition.
          </p>
        </div>

        <button
          onClick={openModal}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Record Return
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Return Records</p>
            <ClipboardCheck className="text-blue-600" size={21} />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-800">
            {totalReturns}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Damaged Items</p>
            <AlertTriangle className="text-orange-500" size={21} />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-800">
            {damagedCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Missing Items</p>
            <Package className="text-red-500" size={21} />
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-800">
            {missingCount}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-4 sm:flex-row">
          <div className="relative w-full sm:max-w-sm">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search returns..."
              className="form-input w-full pl-10"
            />
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Booking</th>
                <th className="px-5 py-3">Return Date</th>
                <th className="px-5 py-3">Items Returned</th>
                <th className="px-5 py-3">Received By</th>
                <th className="px-5 py-3">Notes</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-5 py-10 text-center text-slate-500">
                    Loading returns...
                  </td>
                </tr>
              ) : filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-10 text-center text-slate-500">
                    No return records found.
                  </td>
                </tr>
              ) : (
                filteredReturns.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {record.booking_number ||
                        record.booking_details?.booking_number ||
                        `Booking #${record.booking}`}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatDate(record.return_date)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {record.items?.reduce(
                        (total, item) =>
                          total + Number(item.quantity_returned || 0),
                        0
                      ) || 0}{" "}
                      unit(s)
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {record.received_by || "—"}
                    </td>
                    <td className="max-w-xs truncate px-5 py-4 text-slate-500">
                      {record.notes || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6">
          <div className="flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Record Equipment Return
                </h2>
                <p className="text-xs text-slate-500">
                  Record the items received and their condition.
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5 overflow-y-auto p-5"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Booking *
                  </label>
                  <select
                    required
                    value={form.booking}
                    onChange={(event) =>
                      handleBookingChange(event.target.value)
                    }
                    className="form-input w-full"
                  >
                    <option value="">Select booking</option>
                    {eligibleBookings.map((booking) => (
                      <option key={booking.id} value={booking.id}>
                        {booking.booking_number} — {booking.customer_name} (
                        {booking.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Return Date *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={form.return_date}
                    onChange={(event) =>
                      setForm({ ...form, return_date: event.target.value })
                    }
                    className="form-input w-full"
                  />
                </div>
              </div>

              {selectedBooking && (
                <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                  <p className="font-semibold">
                    {selectedBooking.customer_name}
                  </p>
                  <p>{selectedBooking.customer_phone}</p>
                  <p className="mt-1 text-xs">
                    {availableItems.length} outstanding booking item(s)
                  </p>
                </div>
              )}

              {form.items.map((item, index) => {
                const selectedItem = availableItems.find(
                  (entry) =>
                    String(entry.id) === String(item.booking_item)
                );

                return (
                  <div
                    key={index}
                    className="space-y-4 rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-800">
                        Returned Item {index + 1}
                      </h3>
                      {form.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          Equipment *
                        </label>
                        <select
                          required
                          disabled={!selectedBooking}
                          value={item.booking_item}
                          onChange={(event) =>
                            updateItem(index, "booking_item", event.target.value)
                          }
                          className="form-input w-full"
                        >
                          <option value="">Select equipment</option>
                          {availableItems.map((entry) => (
                            <option key={entry.id} value={entry.id}>
                              {entry.equipment_name} — Outstanding:{" "}
                              {entry.outstanding}
                              {entry.asset_number
                                ? ` — ${entry.asset_number}`
                                : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          Quantity Returned *
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={selectedItem?.outstanding || 1}
                          required
                          value={item.quantity_returned}
                          onChange={(event) =>
                            updateItem(
                              index,
                              "quantity_returned",
                              event.target.value
                            )
                          }
                          className="form-input w-full"
                        />
                        {selectedItem && (
                          <p className="mt-1 text-xs text-slate-500">
                            Outstanding: {selectedItem.outstanding}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          Condition *
                        </label>
                        <select
                          value={item.condition}
                          onChange={(event) =>
                            updateItem(index, "condition", event.target.value)
                          }
                          className="form-input w-full"
                        >
                          <option value="GOOD">Good</option>
                          <option value="DAMAGED">Damaged</option>
                          <option value="MISSING">Missing</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                          Damage / Loss Charge (KES)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.damage_charge}
                          onChange={(event) =>
                            updateItem(index, "damage_charge", event.target.value)
                          }
                          className="form-input w-full"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-700">
                        Item Notes
                      </label>
                      <textarea
                        rows="2"
                        value={item.notes}
                        onChange={(event) =>
                          updateItem(index, "notes", event.target.value)
                        }
                        placeholder="Describe damage, missing parts or other observations..."
                        className="form-input w-full"
                      />
                    </div>

                    {item.condition === "DAMAGED" && (
                      <p className="text-xs text-orange-700">
                        <AlertTriangle size={14} className="mr-1 inline" />
                        Damaged equipment will be sent for maintenance.
                      </p>
                    )}

                    {item.condition === "MISSING" && (
                      <p className="text-xs text-red-700">
                        <AlertTriangle size={14} className="mr-1 inline" />
                        Missing equipment will remain unavailable.
                      </p>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={addItem}
                disabled={!selectedBooking || availableItems.length === 0}
                className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                <Plus size={17} />
                Add Another Item
              </button>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  General Return Notes
                </label>
                <textarea
                  rows="3"
                  value={form.notes}
                  onChange={(event) =>
                    setForm({ ...form, notes: event.target.value })
                  }
                  placeholder="Additional observations about this return..."
                  className="form-input w-full"
                />
              </div>

              <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-100 pt-4 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || !selectedBooking}
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  <CheckCircle size={17} />
                  {saving ? "Saving..." : "Record Return"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
