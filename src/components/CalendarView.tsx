import React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDashboardLayout } from "@/components/DashboardLayoutContext";
import { format, addMonths, subMonths } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Placeholder components for different views
const WeeklyCalendarDisplay = () => (
  <div className="text-gray-600 dark:text-gray-400">
    <p>This section will display meeting rooms and their availability for the selected week.</p>
    <p className="mt-2">Booking functionality will be implemented here.</p>
  </div>
);

const DailyCalendarDisplay = () => (
  <div className="text-gray-600 dark:text-gray-400">
    <p>This section will display meeting rooms and their availability for the selected day by time slots.</p>
    <p className="mt-2">Booking functionality will be implemented here.</p>
  </div>
);

const MonthlyCalendarDisplay = () => (
  <div className="text-gray-600 dark:text-gray-400">
    <p>This section will display a full calendar view of the selected month with booking summaries.</p>
    <p className="mt-2">Clicking a date will switch to Daily view for that date.</p>
  </div>
);

export const CalendarView = () => {
  const { selectedDate, setSelectedDate, viewMode, setViewMode } = useDashboardLayout();

  const handleMonthChange = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setSelectedDate(subMonths(selectedDate, 1));
    } else {
      setSelectedDate(addMonths(selectedDate, 1));
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left Sidebar - Calendar and Layout Filter */}
      <div className="w-full lg:w-1/3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={() => handleMonthChange("prev")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            {format(selectedDate, "MMMM yyyy")}
          </h3>
          <Button variant="ghost" size="icon" onClick={() => handleMonthChange("next")}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          className="rounded-md border w-full"
          month={selectedDate} // Control the displayed month
          onMonthChange={setSelectedDate} // Update selectedDate when month changes in calendar
        />
        <div className="mt-6">
          <h4 className="text-md font-semibold mb-2 text-gray-900 dark:text-gray-50">View Options</h4>
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "weekly" | "daily" | "monthly")} className="w-full">
            <TabsList className="grid w-full grid-cols-3"> {/* Updated to 3 columns */}
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger> {/* New Monthly tab */}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content - Meeting Room View */}
      <div className="flex-1 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-50">
          {viewMode === "weekly" && `Weekly View for ${format(selectedDate, "PPP")}`}
          {viewMode === "daily" && `Daily View for ${format(selectedDate, "PPP")}`}
          {viewMode === "monthly" && `Monthly View for ${format(selectedDate, "MMMM yyyy")}`}
        </h2>
        {viewMode === "weekly" && <WeeklyCalendarDisplay />}
        {viewMode === "daily" && <DailyCalendarDisplay />}
        {viewMode === "monthly" && <MonthlyCalendarDisplay />}
      </div>
    </div>
  );
};