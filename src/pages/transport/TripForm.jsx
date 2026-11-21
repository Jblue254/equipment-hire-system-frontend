
import { useEffect, useState } from "react";
import { X, Route } from "lucide-react";
import { toast } from "sonner";

import {
  createTrip,
  getLorries,
  getDrivers,
} from "../../services/transportService";

import { getBookings } from "../../services/bookingService";
import { getSales } from "../../services/salesService";

const getList = (data) =>
  Array.isArray(data) ? data : data?.results || [];

const initialForm = {
  transaction_type: "BOOKING",
  booking: "",
  sale: "",
  lorry: "",
  driver: "",
  pickup_location: "",
  destination: "",
  distance_km: "",
  transport_charge: "",
  scheduled_at: "",
  notes: "",
};

export default function TripForm({ onClose, onSuccess }) {
  const [form, setForm] = useState(initialForm);
  const [bookings, setBookings] = useState([]);
  const [sales, setSales] = useState([]);
  const [lorries, setLorries] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const results = await Promise.all([
          getBookings(),
          getSales(),
          getLorries(),
          getDrivers(),
        ]);

        setBookings(
          getList(results[0]).filter(
            (item) => item.transport_required === true
          )
        );

        setSales(
          getList(results[1]).filter(
            (item) => item.transport_required === true
          )
        );

        setLorries(
          getList(results[2]).filter(
            (item) => item.status === "AVAILABLE"
          )
        );

        setDrivers(
          getList(results[3]).filter(
            (item) => item.is_active === true
          )
        );
      } catch (error) {
        console.error("Trip form loading error:", error);
        toast.error("Could not load trip assignment options.");
      } finally {
        setLoadingData(false);
      }
    };

    loadOptions();
  }, []);

  const selectedTransaction =
    form.transaction_type === "BOOKING"
      ? bookings.find((item) => String(item.id) === form.booking)
      : sales.find((item) => String(item.id) === form.sale);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === "transaction_type") {
        updated.booking = "";
        updated.sale = "";
        updated.transport_charge = "";
      }

      return updated;
    });
  };

  const handleTransactionChange = (e) => {
    const value = e.target.value;

    const transaction =
      form.transaction_type === "BOOKING"
        ? bookings.find((item) => String(item.id) === value)
        : sales.find((item) => String(item.id) === value);

    setForm((prev) => ({
      ...prev,
      booking: prev.transaction_type === "BOOKING" ? value : "",
      sale: prev.transaction_type === "SALE" ? value : "",
      transport_charge: transaction?.transport_charge ?? "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.lorry || !form.driver) {
      toast.error("Select both a lorry and a driver.");
      return;
    }

    if (
      form.transaction_type === "BOOKING" && !form.booking ||
      form.transaction_type === "SALE" && !form.sale
    ) {
      toast.error("Select a booking or sale.");
      return;
    }

    if (!form.transport_charge || Number(form.transport_charge) <= 0) {
      toast.error("Enter a valid transport charge.");
      return;
    }

    if (form.distance_km && Number(form.distance_km) <= 0) {
      toast.error("Distance must be greater than zero.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        lorry: Number(form.lorry),
        driver: Number(form.driver),
        booking:
          form.transaction_type === "BOOKING"
            ? Number(form.booking)
            : null,
        sale:
          form.transaction_type === "SALE"
            ? Number(form.sale)
            : null,
        pickup_location: form.pickup_location.trim(),
        destination: form.destination.trim(),
        distance_km: form.distance_km
          ? Number(form.distance_km)
          : null,
        transport_charge: Number(form.transport_charge),
        scheduled_at: form.scheduled_at,
        notes: form.notes.trim(),
      };

      await createTrip(payload);

      toast.success("Trip assigned successfully.");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Trip assignment error:", error);

      const data = error.response?.data;
      const message =
        typeof data === "object" && data !== null
          ? Object.entries(data)
              .map(([key, value]) =>
                `${key}: ${Array.isArray(value) ? value.join(" ") : value}`
              )
              .join(" | ")
          : "Failed to assign trip.";

      toast.error(message || "Failed to assign trip.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="my-6 w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
              <Route size={22} />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Assign Transport Trip
              </h2>
              <p className="text-sm text-slate-500">
                Assign a lorry and driver to a booking or sale.
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

        {loadingData ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Loading bookings, sales, lorries and drivers...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 p-5">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-800">
                1. Transaction Details
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Transaction Type *
                  </label>
                  <select
                    name="transaction_type"
                    value={form.transaction_type}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                  >
                    <option value="BOOKING">Equipment Booking</option>
                    <option value="SALE">Material Sale</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    {form.transaction_type === "BOOKING"
                      ? "Select Booking *"
                      : "Select Material Sale *"}
                  </label>

                  <select
                    value={
                      form.transaction_type === "BOOKING"
                        ? form.booking
                        : form.sale
                    }
                    onChange={handleTransactionChange}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                  >
                    <option value="">Select transaction</option>

                    {form.transaction_type === "BOOKING"
                      ? bookings.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.booking_number} · {item.status}
                          </option>
                        ))
                      : sales.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.sale_number} · {item.customer_name}
                          </option>
                        ))}
                  </select>
                </div>
              </div>

              {selectedTransaction && (
                <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
                  <p className="font-semibold">
                    {form.transaction_type === "BOOKING"
                      ? selectedTransaction.booking_number
                      : selectedTransaction.sale_number}
                  </p>

                  <p className="mt-1">
                    Transport charge: KES{" "}
                    {Number(
                      selectedTransaction.transport_charge || 0
                    ).toLocaleString("en-KE")}
                  </p>

                  {selectedTransaction.customer_name && (
                    <p className="mt-1">
                      Customer: {selectedTransaction.customer_name}
                    </p>
                  )}
                </div>
              )}

              {form.transaction_type === "BOOKING" &&
                bookings.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600">
                    No bookings requiring transport were found.
                  </p>
                )}

              {form.transaction_type === "SALE" &&
                sales.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600">
                    No sales requiring transport were found.
                  </p>
                )}
            </div>

            <div className="border-t pt-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-800">
                2. Vehicle and Driver
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Available Lorry *
                  </label>

                  <select
                    name="lorry"
                    value={form.lorry}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                  >
                    <option value="">Select lorry</option>
                    {lorries.map((lorry) => (
                      <option key={lorry.id} value={lorry.id}>
                        {lorry.registration_number} · {lorry.capacity_tonnes} tonnes
                      </option>
                    ))}
                  </select>

                  {lorries.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600">
                      No available lorries.
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Active Driver *
                  </label>

                  <select
                    name="driver"
                    value={form.driver}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                  >
                    <option value="">Select driver</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.full_name} · {driver.phone_number}
                      </option>
                    ))}
                  </select>

                  {drivers.length === 0 && (
                    <p className="mt-1 text-xs text-amber-600">
                      No active drivers.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-800">
                3. Journey Details
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Pickup Location *
                  </label>
                  <input
                    name="pickup_location"
                    value={form.pickup_location}
                    onChange={handleChange}
                    required
                    placeholder="Enter pickup location"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Destination *
                  </label>
                  <input
                    name="destination"
                    value={form.destination}
                    onChange={handleChange}
                    required
                    placeholder="Enter destination"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Distance (KM)
                  </label>
                  <input
                    type="number"
                    name="distance_km"
                    value={form.distance_km}
                    onChange={handleChange}
                    min="0.1"
                    step="0.1"
                    placeholder="e.g. 25"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Transport Charge (KES) *
                  </label>
                  <input
                    type="number"
                    name="transport_charge"
                    value={form.transport_charge}
                    onChange={handleChange}
                    min="0.01"
                    step="0.01"
                    required
                    placeholder="Enter transport charge"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Scheduled Date and Time *
                  </label>
                  <input
                    type="datetime-local"
                    name="scheduled_at"
                    value={form.scheduled_at}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Notes
              </label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows="3"
                placeholder="Additional trip instructions..."
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
                disabled={
                  submitting ||
                  !lorries.length ||
                  !drivers.length ||
                  !(
                    form.transaction_type === "BOOKING"
                      ? bookings.length
                      : sales.length
                  )
                }
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? "Assigning..." : "Assign Trip"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
