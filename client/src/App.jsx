import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoutes";

import HRDashboard from "./Pages/HRDashboard";
import LoginPage from "./Pages/Login";
import EmployeeDashboard from "./Pages/EmployeeDashboard";
import EmployeeManagementDashboard from "./Pages/ManagerDashboard";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />


        {/* Protected HR routes */}
        <Route
          path="/dashboard-hr"
          element={
            <ProtectedRoute requiredRole="hr">
              <HRDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard-employee"
          element={
            <ProtectedRoute requiredRole="employee">
              <EmployeeDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard-manager"
          element={
            <ProtectedRoute requiredRole="manager">
              <EmployeeManagementDashboard />
            </ProtectedRoute>
          }
        />

        {/* Redirect to login for root path */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Catch-all route for unknown paths */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
