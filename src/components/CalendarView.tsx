import React from "react";
import { useDashboardLayout } from "@/components/DashboardLayoutContext";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailyCalendarDisplay } from "@/components/calendar/DailyCalendarDisplay";
import { WeeklyCalendarDisplay } from "@/components/calendar/WeeklyCalendarDisplay";
import { MonthlyCalendarDisplay } from "@/components/calendar/MonthlyCalendarDisplay";
import { Booking } from "@/types";

interface CalendarViewProps {
  onCellClick: (roomId?: string, date?: Date, booking?: Booking) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onCellClick }) => {
  const { selectedDate, viewMode, setViewMode } = useDashboardLayout();

  return (
    <div className="flex-1 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
          {viewMode === "weekly" && `Weekly View for ${format(selectedDate, "PPP")}`}
          {viewMode === "daily" && `Daily View for ${format(selectedDate, "PPP")}`}
          {viewMode === "monthly" && `Monthly View for ${format(selectedDate, "MMMM yyyy")}`}
        </h2>
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "weekly" | "daily" | "monthly")}>
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {viewMode === "weekly" && <WeeklyCalendarDisplay onCellClick={onCellClick} />}
      {viewMode === "daily" && <DailyCalendarDisplay onCellClick={onCellClick} />}
      {viewMode === "monthly" && <MonthlyCalendarDisplay onCellClick={onCellClick} />}
    </div>
  );
};