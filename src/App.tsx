import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import RoomDetailsPage from "./pages/RoomDetailsPage";
import ForcePasswordResetPage from "./pages/ForcePasswordResetPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import MeetingRoomManagementPage from "./pages/admin/MeetingRoomManagementPage";
import ProfilePage from "./pages/ProfilePage";
import OrganizationProfilePage from "./pages/admin/OrganizationProfilePage";
import AnalyticsDashboardPage from "./pages/admin/AnalyticsDashboardPage";
import UserManagementPage from "./pages/admin/UserManagementPage";
import MeetingRoomCategoryManagementPage from "./pages/admin/MeetingRoomCategoryManagementPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import { SessionContextProvider } from "./components/SessionContextProvider";
// import { DashboardLayoutProvider } from "./components/DashboardLayoutContext"; // Removed as it's now used within DashboardPage

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <SessionContextProvider>
          {/* DashboardLayoutProvider is now used within DashboardPage */}
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<AdminLoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/rooms" element={<MeetingRoomManagementPage />} />
            <Route path="/admin/categories" element={<MeetingRoomCategoryManagementPage />} />
            <Route path="/admin/organization-profile" element={<OrganizationProfilePage />} />
            <Route path="/admin/analytics" element={<AnalyticsDashboardPage />} />
            <Route path="/admin/users" element={<UserManagementPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/room/:id" element={<RoomDetailsPage />} />
            <Route path="/force-password-reset" element={<ForcePasswordResetPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;