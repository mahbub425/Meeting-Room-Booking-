import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Calendar as CalendarIcon, Building, LogOut, User, ChevronLeft, ChevronRight, Users, LayoutList } from "lucide-react"; // Added LayoutList icon
import { cn } from "@/lib/utils";
import { useSession } from "@/components/SessionContextProvider";
import { signOut } from "@/integrations/supabase/auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDashboardLayout } from "@/components/DashboardLayoutContext";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format, addMonths, subMonths } from "date-fns";

export const Sidebar = () => {
  const { user, loading } = useSession();
  const { toast } = useToast();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const { selectedDate, setSelectedDate, viewMode, setViewMode, bookingStatusFilter, setBookingStatusFilter } = useDashboardLayout();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Error fetching user role:", error);
          setIsAdmin(false);
        } else if (profile) {
          setIsAdmin(profile.role === 'admin');
        }
      } else {
        setIsAdmin(false);
      }
    };

    if (!loading) {
      fetchUserRole();
    }
  }, [user, loading]);

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
      setSelectedDate(subMonths(selectedDate, 1));
    } else {
      setSelectedDate(addMonths(selectedDate, 1));
    }
  };

  const navItems = [
    { name: "Calendar", icon: CalendarIcon, path: "/dashboard" },
  ];

  if (isAdmin) {
    navItems.push(
      { name: "Admin Dashboard", icon: Building, path: "/admin" },
      { name: "Meeting Room Management", icon: Building, path: "/admin/rooms" },
      { name: "Meeting Room Categories", icon: LayoutList, path: "/admin/categories" }, // New link
      { name: "User Management", icon: Users, path: "/admin/users" },
    );
  }

  return (
    <aside className="w-64 bg-sidebar dark:bg-sidebar-background text-sidebar-foreground dark:text-sidebar-foreground border-r border-sidebar-border dark:border-sidebar-border p-4 flex flex-col">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-sidebar-primary dark:text-sidebar-primary-foreground">OnnoRokom Meeting Booking System</h2>
      </div>
      <nav className="flex-1">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                to={item.path}
                className={cn(
                  "flex items-center p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground",
                  location.pathname.startsWith(item.path) && "bg-sidebar-accent text-sidebar-accent-foreground dark:bg-sidebar-accent dark:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>

        {/* Mini Calendar in Sidebar */}
        <div className="mt-6 pt-4 border-t border-sidebar-border dark:border-sidebar-border">
          <div className="flex items-center justify-between mb-2">
            <Button variant="ghost" size="icon" onClick={() => handleMonthChange("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h4 className="text-md font-semibold text-gray-900 dark:text-gray-50">
              {format(selectedDate, "MMMM yyyy")}
            </h4>
            <Button variant="ghost" size="icon" onClick={() => handleMonthChange("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="rounded-md border w-full p-0 [&_td]:w-8 [&_td]:h-8 [&_th]:pb-1 [&_div]:space-x-0 [&_div]:gap-0" // Compact styling
            month={selectedDate}
            onMonthChange={setSelectedDate}
            classNames={{
              months: "flex flex-col sm:flex-row space-y-0 sm:space-x-0 sm:space-y-0",
              month: "space-y-0",
              caption: "hidden", // Hide default caption as we have custom navigation
              nav: "hidden", // Hide default nav buttons
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
        </div>

        {/* Layout Filter */}
        <div className="mt-6 pt-4 border-t border-sidebar-border dark:border-sidebar-border">
          <h4 className="text-md font-semibold mb-2 text-gray-900 dark:text-gray-50">Layout</h4>
          <Select onValueChange={(value) => setViewMode(value as "weekly" | "daily" | "monthly")} value={viewMode}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select layout" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Booking Status Filter */}
        <div className="mt-6 pt-4 border-t border-sidebar-border dark:border-sidebar-border">
          <h4 className="text-md font-semibold mb-2 text-gray-900 dark:text-gray-50">Booking Status</h4>
          <Select onValueChange={setBookingStatusFilter} value={bookingStatusFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bookings</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Profile Link - Moved to the end */}
        <div className="mt-6 pt-4 border-t border-sidebar-border dark:border-sidebar-border">
          <Link
            to="/profile"
            className={cn(
              "flex items-center p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground",
              location.pathname.startsWith("/profile") && "bg-sidebar-accent text-sidebar-accent-foreground dark:bg-sidebar-accent dark:text-sidebar-accent-foreground"
            )}
          >
            <User className="mr-3 h-5 w-5" />
            Profile
          </Link>
        </div>
      </nav>
      <div className="mt-auto pt-4 border-t border-sidebar-border dark:border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex items-center w-full p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  );
};