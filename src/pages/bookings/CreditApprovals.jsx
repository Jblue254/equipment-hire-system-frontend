
import { useEffect, useState } from "react";
import {
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  ClipboardCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  getCreditApprovals,
  decideCreditApproval,
} from "../../services/bookingService";

const unwrap = (data) =>
  Array.isArray(data) ? data : data?.results || [];

const money = (value) =>
  `KES ${Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
  })}`;

export default function CreditApprovals() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [decision, setDecision] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const data = await getCreditApprovals();
      setApprovals(unwrap(data));
    } catch (error) {
      toast.error("Failed to load credit approvals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const openDecision = (approval, action) => {
    setSelected(approval);
    setDecision(action);
    setReviewNotes("");
  };

  const handleDecision = async (event) => {
    event.preventDefault();
    if (!selected) return;

    setSaving(true);
    try {
      await decideCreditApproval(selected.id, {
        decision,
        review_notes: reviewNotes,
      });

      toast.success(
        decision === "APPROVED"
          ? "Credit request approved."
          : "Credit request rejected."
      );

      setSelected(null);
      await loadApprovals();
    } catch (error) {
      const message =
        error.response?.data?.error ||
        "Unable to process this credit request.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = approvals.filter((approval) => {
    const booking = approval.booking_details || {};
    const term = search.toLowerCase();

    return (
      String(approval.booking_number || booking.booking_number || "")
        .toLowerCase()
        .includes(term) ||
      String(approval.customer_name || booking.customer_name || "")
        .toLowerCase()
        .includes(term) ||
      String(approval.status || "").toLowerCase().includes(term)
    );
  });

  const pending = approvals.filter(
    (a) => a.status === "PENDING"
  ).length;

  const approved = approvals.filter(
    (a) => a.status === "APPROVED"
  ).length;

  const rejected = approvals.filter(
    (a) => a.status === "REJECTED"
  ).length;

  const statusStyle = {
    PENDING: "bg-amber-100 text-amber-700",
    APPROVED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-red-100 text-red-700",
  };

  const getBooking = (approval) =>
    approval.booking_details || approval.booking || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Credit Approvals
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Review and manage customer credit requests.
          </p>
        </div>

        <button
          onClick={loadApprovals}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm hover:bg-slate-50"
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <Clock className="text-amber-600" size={21} />
          <p className="mt-3 text-sm text-slate-500">Pending Requests</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {pending}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <CheckCircle className="text-emerald-600" size={21} />
          <p className="mt-3 text-sm text-slate-500">Approved Requests</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {approved}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <XCircle className="text-red-600" size={21} />
          <p className="mt-3 text-sm text-slate-500">Rejected Requests</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {rejected}
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
            Loading credit requests...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardCheck
              size={36}
              className="mx-auto mb-3 text-slate-300"
            />
            <p className="font-medium text-slate-700">
              No credit requests found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Credit requests will appear here when bookings are submitted.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Booking</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Review notes</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filtered.map((approval) => {
                  const booking = getBooking(approval);
                  const bookingNumber =
                    approval.booking_number ||
                    booking.booking_number ||
                    (typeof approval.booking === "number"
                      ? `Booking #${approval.booking}`
                      : "—");

                  return (
                    <tr key={approval.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {bookingNumber}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">
                          {approval.customer_name ||
                            booking.customer_name ||
                            "—"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {approval.customer_phone ||
                            booking.customer_phone ||
                            ""}
                        </p>
                      </td>

                      <td className="px-5 py-4 font-medium">
                        {money(
                          approval.amount ??
                          approval.requested_amount ??
                          booking.total_amount
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            statusStyle[approval.status] ||
                            "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {approval.status || "Unknown"}
                        </span>
                      </td>

                      <td className="max-w-48 px-5 py-4 text-slate-500">
                        {approval.review_notes || "—"}
                      </td>

                      <td className="px-5 py-4">
                        {approval.status === "PENDING" ? (
                          <div className="flex gap-3">
                            <button
                              onClick={() =>
                                openDecision(approval, "APPROVED")
                              }
                              className="text-xs font-semibold text-emerald-700 hover:underline"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                openDecision(approval, "REJECTED")
                              }
                              className="text-xs font-semibold text-red-600 hover:underline"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Reviewed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <form
            onSubmit={handleDecision}
            className="w-full max-w-md rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="font-bold text-slate-900">
                  {decision === "APPROVED"
                    ? "Approve Credit Request"
                    : "Reject Credit Request"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add your review comments.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 p-5">
              <label className="block text-sm font-medium text-slate-700">
                Review notes
                <textarea
                  rows="4"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Enter reason or approval comments..."
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
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${
                  decision === "APPROVED"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {saving
                  ? "Processing..."
                  : decision === "APPROVED"
                    ? "Confirm Approval"
                    : "Confirm Rejection"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
