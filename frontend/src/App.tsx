import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import VerifyOTP from "./pages/auth/VerifyOTP";
import ResetPassword from "./pages/auth/ResetPassword";

import AdminDashboard from "./pages/admin/AdminDashboard";
import UserApproval from "./pages/admin/UserApproval";
import ManageTickets from "./pages/admin/ManageTickets";
import UserAudit from "./pages/admin/UserAudit";
import RedemptionRequests from "./pages/admin/RedemptionRequests";

import UserDashboard from "./pages/user/UserDashboard";
import RaiseTicket from "./pages/user/RaiseTicket";
import MyRewards from "./pages/user/MyRewards";
import Transactions from "./pages/user/Transactions";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/user-approval"
          element={
            <ProtectedRoute allowedRole="admin">
              <UserApproval />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/manage-tickets"
          element={
            <ProtectedRoute allowedRole="admin">
              <ManageTickets />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/user-audit"
          element={
            <ProtectedRoute allowedRole="admin">
              <UserAudit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/redemptions"
          element={
            <ProtectedRoute allowedRole="admin">
              <RedemptionRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/redemption-requests"
          element={<Navigate to="/admin/redemptions" replace />}
        />

        {/* Protected User Routes */}
        <Route
          path="/user/dashboard"
          element={
            <ProtectedRoute allowedRole="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/raise-ticket"
          element={
            <ProtectedRoute allowedRole="user">
              <RaiseTicket />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/my-rewards"
          element={
            <ProtectedRoute allowedRole="user">
              <MyRewards />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/transaction"
          element={
            <ProtectedRoute allowedRole="user">
              <Transactions />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
