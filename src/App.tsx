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
import ProfilePage from "./pages/ProfilePage"; // New import
import UserManagementPage from "./pages/UserManagementPage"; // New import
import MeetingRoomGridPage from "./pages/MeetingRoomGridPage"; // New import
import FloorPlanPage from "./pages/FloorPlanPage"; // New import
import { SessionContextProvider } from "./components/SessionContextProvider";
import { DashboardLayoutProvider } from "./components/DashboardLayoutContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <SessionContextProvider>
          <DashboardLayoutProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/rooms" element={<MeetingRoomManagementPage />} />
              <Route path="/profile" element={<ProfilePage />} /> {/* New Route */}
              <Route path="/admin/users" element={<UserManagementPage />} /> {/* New Route */}
              <Route path="/spots" element={<MeetingRoomGridPage />} /> {/* New Route */}
              <Route path="/floor-plan" element={<FloorPlanPage />} /> {/* New Route */}
              <Route path="/room/:id" element={<RoomDetailsPage />} />
              <Route path="/force-password-reset" element={<ForcePasswordResetPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </DashboardLayoutProvider>
        </SessionContextProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;