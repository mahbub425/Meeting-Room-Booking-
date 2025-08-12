import React, { createContext, useContext, useState, ReactNode } from "react";
import { startOfWeek, endOfWeek } from "date-fns";

interface DashboardLayoutContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  selectedDateRange: { from: Date; to: Date }; // Changed to range
  setSelectedDateRange: (range: { from: Date; to: Date }) => void; // Setter for range
  viewMode: "weekly" | "daily"; // Changed options to only 'weekly' and 'daily'
  setViewMode: (mode: "weekly" | "daily") => void; // Setter for view mode
  bookingStatusFilter: "all" | "upcoming" | "past";
  setBookingStatusFilter: (status: "all" | "upcoming" | "past") => void;
}

const DashboardLayoutContext = createContext<DashboardLayoutContextType | undefined>(undefined);

export const DashboardLayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const today = new Date();
  const initialWeekStart = startOfWeek(today, { weekStartsOn: 0 }); // Sunday as start of week
  const initialWeekEnd = endOfWeek(today, { weekStartsOn: 0 }); // Saturday as end of week

  const [selectedDateRange, setSelectedDateRange] = useState<{ from: Date; to: Date }>({
    from: initialWeekStart,
    to: initialWeekEnd,
  });
  const [viewMode, setViewMode] = useState<"weekly" | "daily">("weekly"); // Default to weekly
  const [bookingStatusFilter, setBookingStatusFilter] = useState<"all" | "upcoming" | "past">("all");

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <DashboardLayoutContext.Provider
      value={{
        isSidebarOpen,
        toggleSidebar,
        selectedDateRange,
        setSelectedDateRange,
        viewMode,
        setViewMode,
        bookingStatusFilter,
        setBookingStatusFilter,
      }}
    >
      {children}
    </DashboardLayoutContext.Provider>
  );
};

export const useDashboardLayout = () => {
  const context = useContext(DashboardLayoutContext);
  if (context === undefined) {
    throw new Error("useDashboardLayout must be used within a DashboardLayoutProvider");
  }
  return context;
};