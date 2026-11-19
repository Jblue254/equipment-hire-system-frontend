
import { useEffect, useState } from "react";
import {
  Truck,
  Users,
  Route,
  Wallet,
  RefreshCw,
  Plus,
  Search,
  Fuel,
  Wrench,
  MapPin,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import LorryForm from "./LorryForm";

import {
  getLorries,
  getDrivers,
  getTrips,
  getTripExpenses,
  getLorryExpenses,
} from "../../services/transportService";

const tabs = [
  { id: "overview", label: "Overview", icon: Route },
  { id: "lorries", label: "Lorries", icon: Truck },
  { id: "drivers", label: "Drivers", icon: Users },
  { id: "trips", label: "Trips", icon: MapPin },
  { id: "expenses", label: "Expenses", icon: Wallet },
];

const formatMoney = (amount) =>
  `KES ${Number(amount || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getList = (data) =>
  Array.isArray(data) ? data : data?.results || [];

const statusStyle = {
  AVAILABLE: "bg-emerald-50 text-emerald-700",
  ON_TRIP: "bg-blue-50 text-blue-700",
  UNDER_MAINTENANCE: "bg-amber-50 text-amber-700",
  INACTIVE: "bg-slate-100 text-slate-600",
  PENDING: "bg-amber-50 text-amber-700",
  ASSIGNED: "bg-blue-50 text-blue-700",
  IN_PROGRESS: "bg-indigo-50 text-indigo-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700",
};

const formatStatus = (value = "") =>
  value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) =>
    c.toUpperCase()
  );

function StatCard({ title, value, description, icon: Icon }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
          <Icon size={20} />
        </div>
      </div>
      <h3 className="mt-4 text-2xl font-bold text-slate-900">{value}</h3>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        statusStyle[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {formatStatus(status)}
    </span>
  );
}

export default function Transport() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [showLorryForm, setShowLorryForm] = useState(false);

  const [lorries, setLorries] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [tripExpenses, setTripExpenses] = useState([]);
  const [lorryExpenses, setLorryExpenses] = useState([]);

  const loadData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const results = await Promise.allSettled([
        getLorries(),
        getDrivers(),
        getTrips(),
        getTripExpenses(),
        getLorryExpenses(),
      ]);

      const setters = [
        setLorries,
        setDrivers,
        setTrips,
        setTripExpenses,
        setLorryExpenses,
      ];

      const labels = [
        "Lorries",
        "Drivers",
        "Trips",
        "Trip expenses",
        "Lorry expenses",
      ];

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          setters[index](getList(result.value));
        } else {
          console.error(`Failed to load ${labels[index]}:`, result.reason);
          toast.error(`Could not load ${labels[index].toLowerCase()}`);
        }
      });
    } catch (error) {
      console.error("Transport loading error:", error);
      toast.error("Failed to load transport data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const availableLorries = lorries.filter(
    (lorry) => lorry.status === "AVAILABLE"
  );

  const activeTrips = trips.filter((trip) =>
    ["PENDING", "ASSIGNED", "IN_PROGRESS"].includes(trip.status)
  );

  const totalExpenses = [...tripExpenses, ...lorryExpenses].reduce(
    (total, expense) => total + Number(expense.amount || 0),
    0
  );

  const filteredLorries = lorries.filter((lorry) =>
    `${lorry.registration_number} ${lorry.make} ${lorry.model}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const filteredDrivers = drivers.filter((driver) =>
    `${driver.full_name} ${driver.phone_number} ${driver.licence_number}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const filteredTrips = trips.filter((trip) =>
    `${trip.lorry_registration} ${trip.driver_name} ${
      trip.booking_number || ""
    } ${trip.sale_number || ""} ${trip.destination || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const pageTitle = tabs.find((tab) => tab.id === activeTab)?.label;

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <RefreshCw className="animate-spin text-blue-600" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Transport Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage lorries, drivers, trips and transport expenses.
          </p>
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Lorries"
          value={lorries.length}
          description={`${availableLorries.length} currently available`}
          icon={Truck}
        />
        <StatCard
          title="Active Drivers"
          value={drivers.filter((driver) => driver.is_active).length}
          description={`${drivers.length} registered drivers`}
          icon={Users}
        />
        <StatCard
          title="Active Trips"
          value={activeTrips.length}
          description={`${trips.length} total trips recorded`}
          icon={Route}
        />
        <StatCard
          title="Transport Expenses"
          value={formatMoney(totalExpenses)}
          description="Recorded trip and lorry expenses"
          icon={Wallet}
        />
      </div>

      {/* Navigation tabs */}
      <div className="overflow-x-auto border-b border-slate-200">
        <div className="flex min-w-max gap-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearch("");
                }}
                className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-semibold transition ${
                  active
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon size={17} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab heading and search */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {pageTitle}
          </h2>
          <p className="text-sm text-slate-500">
            {activeTab === "overview"
              ? "Transport activity and fleet summary."
              : `Manage your ${pageTitle.toLowerCase()} records.`}
          </p>
        </div>

        {activeTab !== "overview" && (
          <div className="relative w-full sm:max-w-xs">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${pageTitle.toLowerCase()}...`}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        )}
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-900">Fleet availability</h3>
            <div className="mt-5 space-y-4">
              {[
                {
                  label: "Available",
                  count: lorries.filter((l) => l.status === "AVAILABLE").length,
                  color: "bg-emerald-500",
                },
                {
                  label: "On trip",
                  count: lorries.filter((l) => l.status === "ON_TRIP").length,
                  color: "bg-blue-500",
                },
                {
                  label: "Under maintenance",
                  count: lorries.filter(
                    (l) => l.status === "UNDER_MAINTENANCE"
                  ).length,
                  color: "bg-amber-500",
                },
                {
                  label: "Inactive",
                  count: lorries.filter((l) => l.status === "INACTIVE").length,
                  color: "bg-slate-400",
                },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="font-semibold text-slate-900">
                      {item.count}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{
                        width: `${
                          lorries.length
                            ? (item.count / lorries.length) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-900">Recent trips</h3>
            {trips.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">
                No trips have been recorded yet.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-slate-100">
                {trips.slice(0, 5).map((trip) => (
                  <div
                    key={trip.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {trip.lorry_registration || "Lorry"} ·{" "}
                        {trip.driver_name || "Driver"}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {trip.destination}
                      </p>
                    </div>
                    <StatusBadge status={trip.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lorries */}
      {activeTab === "lorries" && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <div>
              <h3 className="font-semibold text-slate-900">Registered lorries</h3>
              <p className="text-xs text-slate-500">
                {filteredLorries.length} records
              </p>
            </div>
            <button
              onClick={() => setShowLorryForm(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={16} /> Add lorry
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Registration</th>
                  <th className="px-5 py-3">Make / Model</th>
                  <th className="px-5 py-3">Capacity</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLorries.map((lorry) => (
                  <tr key={lorry.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {lorry.registration_number}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {[lorry.make, lorry.model].filter(Boolean).join(" ") || "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {lorry.capacity_tonnes} tonnes
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={lorry.status} />
                    </td>
                  </tr>
                ))}
                {filteredLorries.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-5 py-10 text-center text-slate-500">
                      No lorries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Drivers */}
      {activeTab === "drivers" && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <div>
              <h3 className="font-semibold text-slate-900">Registered drivers</h3>
              <p className="text-xs text-slate-500">
                {filteredDrivers.length} records
              </p>
            </div>
            <button
              onClick={() =>
                toast.info("Driver registration form is the next step.")
              }
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={16} /> Add driver
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Driver</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Licence number</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDrivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {driver.full_name}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {driver.phone_number}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {driver.licence_number}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge
                        status={driver.is_active ? "AVAILABLE" : "INACTIVE"}
                      />
                    </td>
                  </tr>
                ))}
                {filteredDrivers.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-5 py-10 text-center text-slate-500">
                      No drivers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trips */}
      {activeTab === "trips" && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <div>
              <h3 className="font-semibold text-slate-900">Transport trips</h3>
              <p className="text-xs text-slate-500">
                {filteredTrips.length} records
              </p>
            </div>
            <button
              onClick={() =>
                toast.info("Trip assignment form is the next step.")
              }
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={16} /> Assign trip
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Lorry</th>
                  <th className="px-5 py-3">Driver</th>
                  <th className="px-5 py-3">Destination</th>
                  <th className="px-5 py-3">Distance</th>
                  <th className="px-5 py-3">Charge</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTrips.map((trip) => (
                  <tr key={trip.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {trip.lorry_registration || "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {trip.driver_name || "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {trip.destination}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {trip.distance_km ? `${trip.distance_km} km` : "—"}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {formatMoney(trip.transport_charge)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={trip.status} />
                    </td>
                  </tr>
                ))}
                {filteredTrips.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-5 py-10 text-center text-slate-500">
                      No trips found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expenses */}
      {activeTab === "expenses" && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                <Fuel size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Trip expenses</h3>
                <p className="text-xs text-slate-500">
                  {tripExpenses.length} recorded expenses
                </p>
              </div>
            </div>
            <p className="mt-5 text-2xl font-bold text-slate-900">
              {formatMoney(
                tripExpenses.reduce(
                  (total, item) => total + Number(item.amount || 0),
                  0
                )
              )}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Fuel, parking, tolls and other trip costs
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-50 p-2.5 text-amber-600">
                <Wrench size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Lorry expenses</h3>
                <p className="text-xs text-slate-500">
                  {lorryExpenses.length} recorded expenses
                </p>
              </div>
            </div>
            <p className="mt-5 text-2xl font-bold text-slate-900">
              {formatMoney(
                lorryExpenses.reduce(
                  (total, item) => total + Number(item.amount || 0),
                  0
                )
              )}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Repairs, servicing, tyres, insurance and other costs
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 xl:col-span-2">
            <h3 className="font-bold text-slate-900">Recent expenses</h3>
            {[...tripExpenses, ...lorryExpenses]
              .sort(
                (a, b) =>
                  new Date(b.expense_date) - new Date(a.expense_date)
              )
              .slice(0, 8)
              .map((expense, index) => (
                <div
                  key={`${expense.id}-${index}`}
                  className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-0"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {formatStatus(expense.expense_type)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {expense.expense_date} ·{" "}
                      {expense.trip_reference
                        ? `Trip #${expense.trip_reference}`
                        : expense.lorry_registration || "Lorry expense"}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    {formatMoney(expense.amount)}
                  </p>
                </div>
              ))}

            {tripExpenses.length + lorryExpenses.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">
                No expenses recorded yet.
              </p>
            )}
          </div>
        </div>
      )}

      {showLorryForm && (
        <LorryForm
          onClose={() => setShowLorryForm(false)}
          onSuccess={() => loadData(true)}
        />
      )}
    </div>
  );
}
