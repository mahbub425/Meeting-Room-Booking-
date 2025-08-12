import React, { createContext, useContext, useState, ReactNode } from "react";
import { startOfWeek, endOfWeek, addDays } from "date-fns";
import { Booking } from "@/types"; // Import Booking type

interface DashboardLayoutContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  selectedDateRange: { from: Date; to: Date }; // Changed to range
  setSelectedDateRange: (range: { from: Date; to: Date }) => void; // Setter for range
  viewMode: "weekly" | "daily"; // Changed options to only 'weekly' and 'daily'
  setViewMode: (mode: "weekly" | "daily") => void; // Setter for view mode
  bookingStatusFilter: "all" | "upcoming" | "past";
  setBookingStatusFilter: (status: "all" | "upcoming" | "past") => void;
  onCellClick: (roomId?: string, date?: Date, booking?: Booking) => void; // New: Function to open booking form
}

const DashboardLayoutContext = createContext<DashboardLayoutContextType | undefined>(undefined);

export const DashboardLayoutProvider: React.FC<{ children: ReactNode; onCellClick: (roomId?: string, date?: Date, booking?: Booking) => void }> = ({ children, onCellClick }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const today = new Date();
  const initialStartDate = today;
  const initialEndDate = addDays(today, 6); // Today + 6 days = 7 days total

  const [selectedDateRange, setSelectedDateRange] = useState<{ from: Date; to: Date }>({
    from: initialStartDate,
    to: initialEndDate,
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
        onCellClick, // Pass the onCellClick function
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