
import {
  Package,
  CalendarDays,
  ShoppingCart,
  Wallet,
  Truck,
  AlertTriangle,
} from 'lucide-react'

const stats = [
  {
    title: 'Total Equipment',
    value: '48',
    description: 'Registered equipment',
    icon: Package,
    color: 'bg-blue-50 text-blue-600',
  },
  {
    title: 'Active Bookings',
    value: '12',
    description: 'Currently hired out',
    icon: CalendarDays,
    color: 'bg-purple-50 text-purple-600',
  },
  {
    title: 'Material Sales',
    value: 'KES 245,000',
    description: 'Sample sales total',
    icon: ShoppingCart,
    color: 'bg-emerald-50 text-emerald-600',
  },
  {
    title: 'Outstanding Payments',
    value: 'KES 68,500',
    description: 'Awaiting payment',
    icon: Wallet,
    color: 'bg-amber-50 text-amber-600',
  },
]

const activities = [
  { activity: 'Equipment booking created', reference: 'BKG-001', status: 'Pending' },
  { activity: 'Material sale confirmed', reference: 'SALE-001', status: 'Confirmed' },
  { activity: 'Equipment returned', reference: 'BKG-002', status: 'Completed' },
]

export default function Dashboard() {
  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Overview
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Monitor your equipment, bookings, sales and finances.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon

          return (
            <div
              key={stat.title}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  {stat.title}
                </p>
                <div className={`rounded-lg p-2 ${stat.color}`}>
                  <Icon size={20} />
                </div>
              </div>

              <h2 className="mt-4 text-2xl font-bold text-slate-900">
                {stat.value}
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {stat.description}
              </p>
            </div>
          )
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 xl:col-span-2">
          <div className="mb-5">
            <h2 className="font-semibold text-slate-900">
              Recent Activity
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Latest system transactions
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs text-slate-500">
                <tr>
                  <th className="pb-3 font-medium">Activity</th>
                  <th className="pb-3 font-medium">Reference</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>

              <tbody>
                {activities.map((item) => (
                  <tr key={item.reference} className="border-b border-slate-50">
                    <td className="py-4 text-slate-700">{item.activity}</td>
                    <td className="py-4 text-slate-500">{item.reference}</td>
                    <td className="py-4">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={20} />
            <h2 className="font-semibold text-slate-900">
              Quick Alerts
            </h2>
          </div>

          <div className="mt-5 space-y-4">
            <div className="rounded-lg bg-amber-50 p-3">
              <p className="text-sm font-medium text-amber-800">
                Low Stock
              </p>
              <p className="mt-1 text-xs text-amber-700">
                Materials requiring restocking.
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-3">
              <p className="text-sm font-medium text-blue-800">
                Equipment Returns
              </p>
              <p className="mt-1 text-xs text-blue-700">
                Monitor equipment due for return.
              </p>
            </div>

            <div className="rounded-lg bg-purple-50 p-3">
              <p className="text-sm font-medium text-purple-800">
                Maintenance
              </p>
              <p className="mt-1 text-xs text-purple-700">
                Check equipment under maintenance.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
