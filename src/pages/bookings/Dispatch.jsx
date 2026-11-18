
import { useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  Truck,
  PackageCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  getBookings,
  dispatchBooking,
} from "../../services/bookingService";

const unwrap = (data) =>
  Array.isArray(data) ? data : data?.results || [];

const money = (value) =>
  `KES ${Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
  })}`;

export default function Dispatch() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await getBookings();
      setBookings(unwrap(data));
    } catch {
      toast.error("Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleDispatch = async (event) => {
    event.preventDefault();
    if (!selected) return;

    if (
      !window.confirm(
        `Confirm dispatch of booking ${selected.booking_number}?`
      )
    ) return;

    setSaving(true);
    try {
      await dispatchBooking(selected.id, { notes });
      toast.success("Equipment dispatched successfully.");
      setSelected(null);
      setNotes("");
      await loadBookings();
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
        "Dispatch failed. Check approval and payment status."
      );
    } finally {
      setSaving(false);
    }
  };

  const eligible = bookings.filter(
    (booking) => booking.status === "APPROVED"
  );

  const filtered = eligible.filter((booking) => {
    const term = search.toLowerCase();
    return (
      booking.booking_number?.toLowerCase().includes(term) ||
      booking.customer_name?.toLowerCase().includes(term) ||
      booking.customer_phone?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Equipment Dispatch
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Dispatch approved bookings after payment or credit clearance.
          </p>
        </div>

        <button
          onClick={loadBookings}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm hover:bg-slate-50"
        >
          <RefreshCw size={17} /> Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <Truck size={22} className="text-blue-600" />
          <p className="mt-3 text-sm text-slate-500">
            Awaiting Dispatch
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {eligible.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <PackageCheck size={22} className="text-emerald-600" />
          <p className="mt-3 text-sm text-slate-500">
            Currently Active Hires
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {bookings.filter((b) => b.status === "ACTIVE").length}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-4">
          <div className="relative max-w-md">
            <Search
              size={17}
              className="absolute left-3 top-3 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search booking or customer..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            Loading approved bookings...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Truck
              size={36}
              className="mx-auto mb-3 text-slate-300"
            />
            <p className="font-medium text-slate-700">
              No bookings awaiting dispatch
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Approved bookings will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Booking</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Hire period</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Payment arrangement</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filtered.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {booking.booking_number}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">
                        {booking.customer_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {booking.customer_phone}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {booking.start_date} – {booking.expected_return_date}
                    </td>
                    <td className="px-5 py-4 font-medium">
                      {money(booking.total_amount)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {booking.payment_arrangement?.replaceAll("_", " ")}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => {
                          setSelected(booking);
                          setNotes("");
                        }}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                      >
                        Dispatch
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <form
            onSubmit={handleDispatch}
            className="w-full max-w-md rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="font-bold text-slate-900">
                  Confirm Equipment Dispatch
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Booking: {selected.booking_number}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Customer</p>
                <p className="font-semibold text-slate-800">
                  {selected.customer_name}
                </p>
                <p className="mt-2 text-sm text-slate-500">Booking total</p>
                <p className="font-semibold text-slate-800">
                  {money(selected.total_amount)}
                </p>
              </div>

              <label className="block text-sm font-medium text-slate-700">
                Dispatch notes (optional)
                <textarea
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter dispatch details..."
                  className="mt-2 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-blue-500"
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t p-5">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg border px-4 py-2.5 text-sm"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Dispatching..." : "Confirm Dispatch"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
