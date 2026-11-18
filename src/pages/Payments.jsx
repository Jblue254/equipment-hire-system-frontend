
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Plus, Search, RefreshCw, Wallet, CheckCircle, X
} from "lucide-react";

import {
  getPayments,
  createPayment,
  verifyPayment,
  getBookingBalance,
  getSaleBalance,
} from "../services/financeService";

import { getBookings } from "../services/bookingService";
import { getSales } from "../services/salesService";

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const [form, setForm] = useState({
    transaction_type: "BOOKING",
    transaction_id: "",
    amount: "",
    method: "CASH",
    notes: "",
  });

  const money = (value) =>
    `KES ${Number(value || 0).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const unwrap = (data) =>
    Array.isArray(data) ? data : data?.results || [];

  const loadData = async () => {
    try {
      setLoading(true);

      const [paymentData, bookingData, salesData] = await Promise.all([
        getPayments(),
        getBookings(),
        getSales(),
      ]);

      setPayments(unwrap(paymentData));
      setBookings(unwrap(bookingData));
      setSales(unwrap(salesData));
    } catch (error) {
      toast.error("Failed to load payment information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const transactions =
    form.transaction_type === "BOOKING" ? bookings : sales;

  const selectedTransaction = transactions.find(
    (item) => String(item.id) === String(form.transaction_id)
  );

  const loadBalance = async (type, id) => {
    if (!id) {
      setBalance(null);
      return;
    }

    try {
      setBalanceLoading(true);
      const result =
        type === "BOOKING"
          ? await getBookingBalance(id)
          : await getSaleBalance(id);

      setBalance(result);
    } catch (error) {
      setBalance(null);
      toast.error("Could not retrieve the outstanding balance.");
    } finally {
      setBalanceLoading(false);
    }
  };

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleTransactionType = (value) => {
    setForm((prev) => ({
      ...prev,
      transaction_type: value,
      transaction_id: "",
      amount: "",
    }));
    setBalance(null);
  };

  const handleTransactionChange = (id) => {
    updateForm("transaction_id", id);
    updateForm("amount", "");
    loadBalance(form.transaction_type, id);
  };

  const resetForm = () => {
    setForm({
      transaction_type: "BOOKING",
      transaction_id: "",
      amount: "",
      method: "CASH",
      notes: "",
    });
    setBalance(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.transaction_id || Number(form.amount) <= 0) {
      toast.error("Select a transaction and enter a valid amount.");
      return;
    }

    const payload = {
      booking:
        form.transaction_type === "BOOKING"
          ? Number(form.transaction_id)
          : null,
      sale:
        form.transaction_type === "SALE"
          ? Number(form.transaction_id)
          : null,
      amount: Number(form.amount),
      payment_method: form.method,
      notes: form.notes,
    };

    try {
      setSaving(true);
      await createPayment(payload);

      toast.success("Payment recorded as pending verification.");
      setShowForm(false);
      resetForm();
      await loadData();
    } catch (error) {
      const data = error.response?.data;
      const message =
        data?.detail ||
        data?.message ||
        Object.values(data || {}).flat().join(" ") ||
        "Could not record payment.";

      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async (id) => {
    if (!window.confirm("Are you sure you want to verify this payment?")) {
      return;
    }

    try {
      await verifyPayment(id);
      toast.success("Payment verified successfully.");
      await loadData();
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
        "Payment verification failed."
      );
    }
  };

  const filteredPayments = payments.filter((payment) =>
    [
      payment.receipt_number,
      payment.transaction_reference,
      payment.booking_number,
      payment.sale_number,
      payment.method,
      payment.status,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const confirmedTotal = payments
    .filter((p) => p.status === "CONFIRMED")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const pendingTotal = payments
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const statusStyle = (status) => {
    const styles = {
      PENDING: "bg-amber-100 text-amber-700",
      CONFIRMED: "bg-green-100 text-green-700",
      FAILED: "bg-red-100 text-red-700",
      REVERSED: "bg-slate-100 text-slate-600",
    };

    return styles[status] || "bg-slate-100 text-slate-600";
  };

  const paymentReference = (payment) =>
    payment.booking_number ||
    payment.sale_number ||
    (payment.booking ? `Booking #${payment.booking}` : `Sale #${payment.sale}`);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
          <p className="mt-1 text-sm text-slate-500">
            Record, track and verify booking and sales payments.
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={18} /> Record Payment
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Total Records</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {payments.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Confirmed Payments</p>
          <p className="mt-2 text-xl font-bold text-green-700">
            {money(confirmedTotal)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Pending Verification</p>
          <p className="mt-2 text-xl font-bold text-amber-600">
            {money(pendingTotal)}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-3 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search receipt, reference or transaction..."
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 outline-none focus:border-blue-500"
          />
        </div>

        <button
          onClick={loadData}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm hover:bg-slate-50"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <p className="p-8 text-center text-slate-500">
            Loading payments...
          </p>
        ) : filteredPayments.length === 0 ? (
          <div className="p-10 text-center">
            <Wallet size={36} className="mx-auto text-slate-300" />
            <p className="mt-3 font-medium text-slate-700">
              No payment records found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Record a payment to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-3">Receipt</th>
                  <th className="px-5 py-3">Transaction</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {payment.receipt_number || `#${payment.id}`}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {paymentReference(payment)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {payment.payment_method}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {money(payment.amount)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {payment.created_at
                        ? new Date(payment.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {payment.status === "PENDING" ? (
                        <button
                          onClick={() => handleVerify(payment.id)}
                          title="Verify payment"
                          className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle size={16} /> Verify
                        </button>
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

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-6 w-full max-w-xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Record Payment
                </h2>
                <p className="text-sm text-slate-500">
                  Record a payment against a booking or sale.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Transaction type
                </label>
                <select
                  value={form.transaction_type}
                  onChange={(e) => handleTransactionType(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5"
                >
                  <option value="BOOKING">Equipment booking</option>
                  <option value="SALE">Material sale</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Select transaction
                </label>
                <select
                  required
                  value={form.transaction_id}
                  onChange={(e) => handleTransactionChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5"
                >
                  <option value="">Choose transaction</option>
                  {transactions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {form.transaction_type === "BOOKING"
                        ? item.booking_number
                        : item.sale_number}{" "}
                      — {item.customer_name} — {money(item.total_amount)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedTransaction && (
                <div className="rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="font-semibold text-slate-800">
                    {selectedTransaction.customer_name}
                  </p>
                  <p className="mt-1 text-slate-500">
                    {selectedTransaction.customer_phone}
                  </p>
                  <p className="mt-1 text-slate-500">
                    Status: {selectedTransaction.status}
                  </p>
                </div>
              )}

              {form.transaction_id && (
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">
                    Payment balance
                  </p>

                  {balanceLoading ? (
                    <p className="mt-2 text-sm text-slate-500">
                      Loading balance...
                    </p>
                  ) : balance ? (
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total amount</span>
                        <span>{money(balance.total_amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Confirmed</span>
                        <span>{money(balance.confirmed_amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Pending</span>
                        <span>{money(balance.pending_amount)}</span>
                      </div>
                      <div className="flex justify-between border-t border-blue-200 pt-2 font-bold">
                        <span>Outstanding</span>
                        <span>{money(balance.outstanding_amount)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">
                      Balance information unavailable.
                    </p>
                  )}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Amount (KES)
                  </label>
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => updateForm("amount", e.target.value)}
                    placeholder="Enter amount"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Payment method
                  </label>
                  <select
                    value={form.method}
                    onChange={(e) => updateForm("method", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5"
                  >
                    <option value="CASH">Cash</option>
                    <option value="MPESA">M-Pesa</option>
                    <option value="BANK">Bank</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Notes / Payment reference
                </label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => updateForm("notes", e.target.value)}
                  placeholder="Optional payment details..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5"
                />
              </div>

              <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                New payments are recorded as pending. They must be verified
                before they count as confirmed payments.
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || balanceLoading}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
