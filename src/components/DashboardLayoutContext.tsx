import React, { createContext, useContext, useState, ReactNode } from "react";
import { addDays } from "date-fns";

interface DashboardLayoutContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  viewMode: "weekly" | "daily" | "monthly"; // Added 'monthly'
  setViewMode: (mode: "weekly" | "daily" | "monthly") => void; // Added 'monthly'
  bookingStatusFilter: "all" | "upcoming" | "past"; // New state for booking status filter
  setBookingStatusFilter: (status: "all" | "upcoming" | "past") => void; // Setter for booking status filter
}

const DashboardLayoutContext = createContext<DashboardLayoutContextType | undefined>(undefined);

export const DashboardLayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"weekly" | "daily" | "monthly">("weekly"); // Default to weekly
  const [bookingStatusFilter, setBookingStatusFilter] = useState<"all" | "upcoming" | "past">("all"); // Default to all

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <DashboardLayoutContext.Provider
      value={{
        isSidebarOpen,
        toggleSidebar,
        selectedDate,
        setSelectedDate,
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