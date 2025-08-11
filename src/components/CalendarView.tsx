import React from "react";
import { useDashboardLayout } from "@/components/DashboardLayoutContext";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DailyCalendarDisplay } from "@/components/calendar/DailyCalendarDisplay";
import { WeeklyCalendarDisplay } from "@/components/calendar/WeeklyCalendarDisplay";
import { MonthlyCalendarDisplay } from "@/components/calendar/MonthlyCalendarDisplay";

export const CalendarView = () => {
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

      {viewMode === "weekly" && <WeeklyCalendarDisplay />}
      {viewMode === "daily" && <DailyCalendarDisplay />}
      {viewMode === "monthly" && <MonthlyCalendarDisplay />}
    </div>
  );
};