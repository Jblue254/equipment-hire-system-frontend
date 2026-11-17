
import { useEffect, useState } from "react";
import {
  Package,
  CalendarDays,
  ShoppingCart,
  Wallet,
  Truck,
  Wrench,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { getDashboardSummary } from "../../services/dashboardService";

function StatCard({ title, value, description, icon: Icon }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
          <Icon size={20} />
        </div>
      </div>

      <h3 className="mt-4 text-2xl font-bold text-slate-900">
        {value}
      </h3>

      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchDashboard = async () => {
    try {
      setError(false);
      const result = await getDashboardSummary();
      setData(result);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(true);
      toast.error("Unable to load dashboard statistics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <RefreshCw className="animate-spin text-blue-600" size={28} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
        <AlertTriangle className="mx-auto text-red-500" size={32} />
        <h2 className="mt-3 font-semibold text-slate-800">
          Dashboard unavailable
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          We couldn't retrieve your dashboard information.
        </p>
        <button
          onClick={fetchDashboard}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    );
  }

  const cards = [
    {
      title: "Total Equipment",
      value: data.equipment.total,
      description: `${data.equipment.available} available`,
      icon: Package,
    },
    {
      title: "Active Bookings",
      value: data.bookings.active,
      description: `${data.bookings.overdue} overdue`,
      icon: CalendarDays,
    },
    {
      title: "Total Materials",
      value: data.materials.total,
      description: `${data.materials.low_stock} low-stock items`,
      icon: ShoppingCart,
    },
    {
      title: "Payments Received",
      value: `KES ${Number(data.finance.payments_received).toLocaleString()}`,
      description: `${data.finance.pending_payments} pending payments`,
      icon: Wallet,
    },
    {
      title: "Sales",
      value: data.sales.total,
      description: `${data.sales.completed} completed`,
      icon: ShoppingCart,
    },
    {
      title: "Active Trips",
      value: data.transport.active_trips,
      description: `${data.transport.total_lorries} total lorries`,
      icon: Truck,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Dashboard Overview
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Here's what's happening in your business today.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">
            Booking Overview
          </h2>

          <div className="mt-5 space-y-4">
            {[
              ["Pending Approval", data.bookings.pending],
              ["Active Hire", data.bookings.active],
              ["Overdue", data.bookings.overdue],
              ["Completed", data.bookings.completed],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-slate-600">{label}</span>
                <span className="font-semibold text-slate-900">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">
            Inventory Overview
          </h2>

          <div className="mt-5 space-y-4">
            {[
              ["Available Equipment", data.equipment.available],
              ["Hired Out", data.equipment.hired_out],
              ["Under Maintenance", data.equipment.under_maintenance],
              ["Low Stock Materials", data.materials.low_stock],
              ["Out of Stock", data.materials.out_of_stock],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-slate-600">{label}</span>
                <span className="font-semibold text-slate-900">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={fetchDashboard}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Refresh statistics
        </button>
      </div>
    </div>
  );
}

export default Dashboard;
