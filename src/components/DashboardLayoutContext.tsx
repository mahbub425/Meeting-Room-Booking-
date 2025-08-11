import React, { createContext, useContext, useState, ReactNode } from "react";
import { addDays } from "date-fns";

interface DashboardLayoutContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  viewMode: "weekly" | "daily";
  setViewMode: (mode: "weekly" | "daily") => void;
}

const DashboardLayoutContext = createContext<DashboardLayoutContextType | undefined>(undefined);

export const DashboardLayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"weekly" | "daily">("weekly");

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