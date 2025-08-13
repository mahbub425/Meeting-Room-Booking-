import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Calendar as CalendarIcon, Building, LogOut, User, ChevronLeft, ChevronRight, Users, LayoutList, BarChart2, ListChecks } from "lucide-react"; // Added ListChecks icon
import { cn } from "@/lib/utils";
import { useSession } from "@/components/SessionContextProvider";
import { signOut } from "@/integrations/supabase/auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDashboardLayout } from "@/components/DashboardLayoutContext";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format, addMonths, subMonths, startOfWeek, endOfWeek, addDays, isSameDay } from "date-fns";
import { MeetingRoom } from "@/types";
import { MeetingRoomCategory } from "@/pages/admin/MeetingRoomCategoryManagementPage";
import { DateRange } from "react-day-picker"; // Import DateRange type

export const Sidebar = () => {
  const { user, loading } = useSession();
  const { toast } = useToast();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const { selectedDateRange, setSelectedDateRange, viewMode, setViewMode, onCellClick } = useDashboardLayout();
  const [meetingRooms, setMeetingRooms] = useState<MeetingRoom[]>([]);
  const [categories, setCategories] = useState<MeetingRoomCategory[]>([]);

  // New state for the sidebar's mini-calendar selected date, initialized to today
  const [sidebarCalendarSelectedDate, setSidebarCalendarSelectedDate] = useState<Date>(new Date());
  // Initialize calendarMonth to today's date
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  useEffect(() => {
    const fetchUserRoleAndRooms = async () => {
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error("Error fetching user role:", profileError);
          setIsAdmin(false);
        } else if (profile) {
          setIsAdmin(profile.role === 'admin');
        }
      } else {
        setIsAdmin(false);
        setMeetingRooms([]);
        setCategories([]);
      }
    };

    if (!loading) {
      fetchUserRoleAndRooms();
    }
  }, [user, loading, toast]);

  // Effect to keep sidebarCalendarSelectedDate and calendarMonth in sync
  // with the main view's selectedDateRange and viewMode.
  useEffect(() => {
    const today = new Date();
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 0 });

    if (viewMode === "weekly") {
      // If main view is weekly, and it's the current week, highlight today in sidebar calendar
      if (isSameDay(selectedDateRange.from, startOfCurrentWeek)) {
        setSidebarCalendarSelectedDate(today);
        setCalendarMonth(today);
      } else {
        // If it's a different week, highlight the start of that week in sidebar calendar
        setSidebarCalendarSelectedDate(selectedDateRange.from);
        setCalendarMonth(selectedDateRange.from);
      }
    } else if (viewMode === "daily") {
      // If main view is daily, sidebar calendar should reflect that specific day
      setSidebarCalendarSelectedDate(selectedDateRange.from);
      setCalendarMonth(selectedDateRange.from);
    }
  }, [selectedDateRange, viewMode, user, loading, toast]);


  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Logged Out",
        description: "You have successfully logged out.",
      });
    } catch (error: any) {
      toast({
        title: "Logout Failed",
        description: error.message || "An error occurred during logout.",
        variant: "destructive",
      });
    }
  };

  const handleMonthChange = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCalendarMonth(subMonths(calendarMonth, 1));
    } else {
      setCalendarMonth(addMonths(calendarMonth, 1));
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSidebarCalendarSelectedDate(date); // Update sidebar's selected date
      setCalendarMonth(date); // Keep calendar month in sync

      // Update main dashboard view to daily for the selected date
      setSelectedDateRange({
        from: date,
        to: date,
      });
      setViewMode("daily"); // Switch to daily view

      onCellClick(undefined, date);
      toast({
        title: "Date Selected",
        description: `Booking form opened for ${format(date, 'PPP')}.`,
      });
    } else {
      // If nothing is selected (e.g., clearing selection), reset to current day
      const today = new Date();
      setSidebarCalendarSelectedDate(today);
      setCalendarMonth(today);
      setSelectedDateRange({
        from: today,
        to: today,
      });
      setViewMode("daily"); // Default to daily view when no date is selected
    }
  };

  return (
    <aside className="w-64 bg-sidebar dark:bg-sidebar-background text-sidebar-foreground dark:text-sidebar-foreground border-r border-sidebar-border dark:border-sidebar-border p-4 flex flex-col">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-sidebar-primary dark:text-sidebar-primary-foreground">OnnoRokom Meeting Booking System</h2>
      </div>
      <nav className="flex-1">
        {/* Month Selector */}
        <div className="flex items-center justify-between mb-2">
          <Button variant="ghost" size="icon" onClick={() => handleMonthChange("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h4 className="text-md font-semibold text-gray-900 dark:text-gray-50">
            {format(calendarMonth, "MMMM yyyy")}
          </h4>
          <Button variant="ghost" size="icon" onClick={() => handleMonthChange("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Mini-Calendar */}
        <div className="mb-6">
          <Calendar
            mode="single"
            selected={sidebarCalendarSelectedDate} // Use the new state for selection
            onSelect={handleDateSelect}
            className="rounded-md border w-full p-0 [&_td]:w-8 [&_td]:h-8 [&_th]:pb-1 [&_div]:space-x-0 [&_div]:gap-0"
            month={calendarMonth}
            onMonthChange={setCalendarMonth}
            classNames={{
              months: "flex flex-col sm:flex-row space-y-0 sm:space-x-0 sm:space-y-0",
              month: "space-y-0",
              caption: "hidden",
              nav: "hidden",
              table: "w-full border-collapse space-y-0",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
              row: "flex w-full mt-0",
              cell: "h-8 w-8 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-range-start)]:rounded-l-md [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: cn(
                "h-8 w-8 p-0 font-normal aria-selected:opacity-100",
                "hover:bg-accent hover:text-accent-foreground",
                "data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[selected]:hover:bg-primary data-[selected]:hover:text-primary-foreground",
                "data-[today]:bg-accent data-[today]:text-accent-foreground"
              ),
              day_range_end: "day-range-end",
              day_selected:
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside: "text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle:
                "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
          />
          <div className="text-center text-sm mt-2 text-gray-700 dark:text-gray-300">
            {sidebarCalendarSelectedDate ? ( // Display the sidebar's selected date
              format(sidebarCalendarSelectedDate, "MMM d, yyyy")
            ) : (
              "Select a date"
            )}
          </div>
        </div>

        {/* Layout Filter */}
        <div className="mt-6 pt-4 border-t border-sidebar-border dark:border-sidebar-border">
          <h4 className="text-md font-semibold mb-2 text-gray-900 dark:text-gray-50">Layout View</h4>
          <Select onValueChange={(value) => {
            setViewMode(value as "weekly" | "daily");
            const today = new Date();
            if (value === "weekly") {
              setSelectedDateRange({
                from: startOfWeek(today, { weekStartsOn: 0 }),
                to: endOfWeek(today, { weekStartsOn: 0 }),
              });
              setSidebarCalendarSelectedDate(today); // Keep today selected in sidebar calendar
              setCalendarMonth(today); // Keep calendar month in sync
            } else { // If switching to daily view
              setSelectedDateRange({
                from: today,
                to: today,
              });
              setSidebarCalendarSelectedDate(today); // Keep today selected in sidebar calendar
              setCalendarMonth(today); // Keep calendar month in sync
            }
          }} value={viewMode}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select layout" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Week</SelectItem>
              <SelectItem value="daily">Day</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Admin Navigation (if admin) */}
        {isAdmin && (
          <div className="mt-6 pt-4 border-t border-sidebar-border dark:border-sidebar-border">
            <h4 className="text-md font-semibold mb-2 text-gray-900 dark:text-gray-50">Admin Panel</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/admin/analytics"
                  className={cn(
                    "flex items-center p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground",
                    location.pathname.startsWith("/admin/analytics") && "bg-sidebar-accent text-sidebar-accent-foreground dark:bg-sidebar-accent dark:text-sidebar-accent-foreground"
                  )}
                >
                  <BarChart2 className="mr-3 h-5 w-5" />
                  Analytics
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/overview"
                  className={cn(
                    "flex items-center p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground",
                    location.pathname.startsWith("/admin/overview") && "bg-sidebar-accent text-sidebar-accent-foreground dark:bg-sidebar-accent dark:text-sidebar-accent-foreground"
                  )}
                >
                  <Building className="mr-3 h-5 w-5" />
                  Admin Overview
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/rooms"
                  className={cn(
                    "flex items-center p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground",
                    location.pathname.startsWith("/admin/rooms") && "bg-sidebar-accent text-sidebar-accent-foreground dark:bg-sidebar-accent dark:text-sidebar-accent-foreground"
                  )}
                >
                  <Building className="mr-3 h-5 w-5" />
                  Meeting Room Management
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/categories"
                  className={cn(
                    "flex items-center p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground",
                    location.pathname.startsWith("/admin/categories") && "bg-sidebar-accent text-sidebar-accent-foreground dark:bg-sidebar-accent dark:text-sidebar-accent-foreground"
                  )}
                >
                  <LayoutList className="mr-3 h-5 w-5" />
                  Meeting Room Categories
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/users"
                  className={cn(
                    "flex items-center p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground",
                    location.pathname.startsWith("/admin/users") && "bg-sidebar-accent text-sidebar-accent-foreground dark:bg-sidebar-accent dark:text-sidebar-accent-foreground"
                  )}
                >
                  <Users className="mr-3 h-5 w-5" />
                  User Management
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/bookings"
                  className={cn(
                    "flex items-center p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground",
                    location.pathname.startsWith("/admin/bookings") && "bg-sidebar-accent text-sidebar-accent-foreground dark:bg-sidebar-accent dark:text-sidebar-accent-foreground"
                  )}
                >
                  <ListChecks className="mr-3 h-5 w-5" /> {/* Icon for Booking List */}
                  Booking List
                </Link>
              </li>
            </ul>
          </div>
        )}
      </nav>
    </aside>
  );
};