
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/layout/DashboardLayout'
import Dashboard from './pages/dashboard/Dashboard'
import Login from './pages/auth/Login'
import Equipment from "./pages/inventory/Equipment";
import Materials from "./pages/inventory/Materials";
import MaterialCategories from "./pages/inventory/MaterialCategories";
import StockMovements from "./pages/inventory/StockMovements";
import Maintenance from "./pages/inventory/Maintenance";
import Bookings from "./pages/bookings/Bookings";
import EquipmentCategories from "./pages/inventory/EquipmentCategories";
import CreditApprovals from "./pages/bookings/CreditApprovals";




function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />}/>
      <Route path="/" element={ <ProtectedRoute> <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/inventory"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Equipment />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
  path="/materials"
  element={
    <ProtectedRoute>
      <DashboardLayout>
        <Materials />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>

<Route
  path="/material-categories"
  element={
    <ProtectedRoute>
      <DashboardLayout>
        <MaterialCategories />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>

<Route
  path="/stock-movements"
  element={
    <ProtectedRoute>
      <DashboardLayout>
        <StockMovements />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>

<Route
  path="/maintenance"
  element={
    <ProtectedRoute>
      <DashboardLayout>
        <Maintenance />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>

<Route
  path="/bookings"
  element={
    <ProtectedRoute>
      <DashboardLayout>
        <Bookings />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>
<Route
  path="/equipment-categories"
  element={
    <ProtectedRoute>
      <DashboardLayout>
        <EquipmentCategories />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>
<Route
  path="/credit-approvals"
  element={
    <ProtectedRoute>
      <DashboardLayout>
        <CreditApprovals />
      </DashboardLayout>
    </ProtectedRoute>
  }
/>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
