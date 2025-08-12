import React from "react";
import { useDashboardLayout } from "@/components/DashboardLayoutContext";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailyCalendarDisplay } from "@/components/calendar/DailyCalendarDisplay";
import { WeeklyCalendarDisplay } from "@/components/calendar/WeeklyCalendarDisplay";
import { Booking } from "@/types";

interface CalendarViewProps {
  onCellClick: (roomId?: string, date?: Date, booking?: Booking) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onCellClick }) => {
  const { selectedDateRange, viewMode, setViewMode } = useDashboardLayout();

  return (
    <div className="flex-1 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
          {viewMode === "weekly" && `Weekly View for ${format(selectedDateRange.from, "PPP")} - ${format(selectedDateRange.to, "PPP")}`}
          {viewMode === "daily" && `Daily View for ${format(selectedDateRange.from, "PPP")}`}
        </h2>
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "weekly" | "daily")}>
          <TabsList>
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {viewMode === "weekly" && <WeeklyCalendarDisplay onCellClick={onCellClick} />}
      {viewMode === "daily" && <DailyCalendarDisplay onCellClick={onCellClick} />}
    </div>
  );
};