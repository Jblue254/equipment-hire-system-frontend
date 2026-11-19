
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";

import Dashboard from "./pages/dashboard/Dashboard";
import Login from "./pages/auth/Login";

import Equipment from "./pages/inventory/Equipment";
import Materials from "./pages/inventory/Materials";
import MaterialCategories from "./pages/inventory/MaterialCategories";
import StockMovements from "./pages/inventory/StockMovements";
import Maintenance from "./pages/inventory/Maintenance";
import EquipmentCategories from "./pages/inventory/EquipmentCategories";

import Bookings from "./pages/bookings/Bookings";
import CreditApprovals from "./pages/bookings/CreditApprovals";
import Dispatch from "./pages/bookings/Dispatch";
import Returns from "./pages/bookings/Returns";

import Sales from "./pages/Sales";
import Payments from "./pages/Payments";
import Transport from "./pages/transport/Transport";

function AppRoutes() {
  const { user } = useAuth();

  const protectedPage = (page) => (
    <ProtectedRoute>
      <DashboardLayout>{page}</DashboardLayout>
    </ProtectedRoute>
  );

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />

      <Route path="/" element={protectedPage(<Dashboard />)} />

      <Route path="/inventory" element={protectedPage(<Equipment />)} />
      <Route path="/materials" element={protectedPage(<Materials />)} />
      <Route
        path="/material-categories"
        element={protectedPage(<MaterialCategories />)}
      />
      <Route
        path="/stock-movements"
        element={protectedPage(<StockMovements />)}
      />
      <Route
        path="/maintenance"
        element={protectedPage(<Maintenance />)}
      />
      <Route
        path="/equipment-categories"
        element={protectedPage(<EquipmentCategories />)}
      />

      <Route path="/bookings" element={protectedPage(<Bookings />)} />
      <Route
        path="/credit-approvals"
        element={protectedPage(<CreditApprovals />)}
      />
      <Route path="/dispatch" element={protectedPage(<Dispatch />)} />
      <Route path="/returns" element={protectedPage(<Returns />)} />

      <Route path="/sales" element={protectedPage(<Sales />)} />
      <Route path="/payments" element={protectedPage(<Payments />)} />
      <Route path="/transport" element={protectedPage(<Transport />)} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
