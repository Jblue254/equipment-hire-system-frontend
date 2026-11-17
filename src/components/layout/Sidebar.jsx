
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Wrench,
  CalendarDays,
  ShoppingCart,
  Wallet,
  Truck,
  Users,
  BarChart3,
  Settings,
  HardHat,
  X,
} from 'lucide-react'

const menuGroups = [
  {
    title: 'OVERVIEW',
    items: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    ],
  },
  {
    title: 'OPERATIONS',
    items: [
      { name: 'Inventory', path: '/inventory', icon: Package },
      { name: 'Maintenance', path: '/maintenance', icon: Wrench },
      { name: 'Bookings', path: '/bookings', icon: CalendarDays },
      { name: 'Sales', path: '/sales', icon: ShoppingCart },
      { name: 'Transport', path: '/transport', icon: Truck },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { name: 'Finance', path: '/finance', icon: Wallet },
      { name: 'Customers', path: '/customers', icon: Users },
      { name: 'Reports', path: '/reports', icon: BarChart3 },
      { name: 'Settings', path: '/settings', icon: Settings },
    ],
  },
]

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col
        border-r border-slate-200 bg-white transition-transform
        duration-200 lg:static lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-600 p-2 text-white">
              <HardHat size={22} />
            </div>
            <div>
              <h1 className="font-bold text-slate-900">Equipment Hire</h1>
              <p className="text-xs text-slate-500">Management System</p>
            </div>
          </div>

          <button onClick={onClose} className="lg:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-6">
          {menuGroups.map((group) => (
            <div key={group.title}>
              <p className="mb-3 px-3 text-xs font-semibold tracking-wider text-slate-400">
                {group.title}
              </p>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/'}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                          isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`
                      }
                    >
                      <Icon size={18} />
                      {item.name}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <p className="text-xs text-slate-400">Equipment Hire System</p>
          <p className="mt-1 text-xs font-medium text-slate-600">
            Version 1.0
          </p>
        </div>
      </aside>
    </>
  )
}
