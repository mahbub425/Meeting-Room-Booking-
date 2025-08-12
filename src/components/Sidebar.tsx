import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Calendar as CalendarIcon, Building, LogOut, User, ChevronLeft, ChevronRight, Users, LayoutList, Plus } from "lucide-react"; // Added Plus icon
import { cn } from "@/lib/utils";
import { useSession } from "@/components/SessionContextProvider";
import { signOut } from "@/integrations/supabase/auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDashboardLayout } from "@/components/DashboardLayoutContext";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format, addMonths, subMonths, startOfWeek, endOfWeek, addDays } from "date-fns";
import { MeetingRoom } from "@/types";
import { MeetingRoomCategory } from "@/pages/admin/MeetingRoomCategoryManagementPage";

export const Sidebar = () => {
  const { user, loading } = useSession();
  const { toast } = useToast();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const { selectedDate, setSelectedDate, viewMode, setViewMode, bookingStatusFilter, setBookingStatusFilter } = useDashboardLayout();
  const [meetingRooms, setMeetingRooms] = useState<MeetingRoom[]>([]);
  const [categories, setCategories] = useState<MeetingRoomCategory[]>([]);

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

        const { data: roomsData, error: roomsError } = await supabase
          .from('meeting_rooms')
          .select('*')
          .eq('is_enabled', true)
          .order('name', { ascending: true });

        if (roomsError) {
          toast({
            title: "Error fetching meeting rooms",
            description: roomsError.message,
            variant: "destructive",
          });
          setMeetingRooms([]);
        } else {
          setMeetingRooms(roomsData || []);
        }

        const { data: categoriesData, error: categoriesError } = await supabase
          .from('meeting_room_categories')
          .select('*')
          .order('name', { ascending: true });

        if (categoriesError) {
          toast({
            title: "Error fetching categories",
            description: categoriesError.message,
            variant: "destructive",
          });
          setCategories([]);
        } else {
          setCategories(categoriesData || []);
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

  const getCategoryColor = (categoryId: string | null) => {
    if (!categoryId) return "#ccc"; // Default grey
    const category = categories.find(cat => cat.id === categoryId);
    return category?.color || "#ccc";
  };

  const startOfSelectedWeek = startOfWeek(selectedDate, { weekStartsOn: 0 }); // Sunday as start of week
  const endOfSelectedWeek = endOfWeek(selectedDate, { weekStartsOn: 0 }); // Saturday as end of week

  return (
    <aside className="w-64 bg-sidebar dark:bg-sidebar-background text-sidebar-foreground dark:text-sidebar-foreground border-r border-sidebar-border dark:border-sidebar-border p-4 flex flex-col">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-sidebar-primary dark:text-sidebar-primary-foreground">OnnoRokom Meeting Booking System</h2>
      </div>
      <nav className="flex-1">
        {/* Mini Calendar in Sidebar */}
        <div className="mb-6">
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
          <div className="text-center text-sm mt-2 text-gray-700 dark:text-gray-300">
            {format(startOfSelectedWeek, "MMM d, yyyy")} - {format(endOfSelectedWeek, "MMM d, yyyy")}
          </div>
        </div>

        {/* Layout Filter */}
        <div className="mt-6 pt-4 border-t border-sidebar-border dark:border-sidebar-border">
          <h4 className="text-md font-semibold mb-2 text-gray-900 dark:text-gray-50">Layout View</h4>
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

        {/* Meeting Room List */}
        <div className="mt-6 pt-4 border-t border-sidebar-border dark:border-sidebar-border">
          <h4 className="text-md font-semibold mb-2 text-gray-900 dark:text-gray-50">Meeting Rooms</h4>
          <ul className="space-y-2">
            {meetingRooms.map((room) => (
              <li key={room.id} className="flex items-center p-2 rounded-md text-sidebar-foreground">
                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: getCategoryColor(room.category_id) }}></span>
                {room.name}
              </li>
            ))}
          </ul>
        </div>

        {/* Admin Navigation (if admin) */}
        {isAdmin && (
          <div className="mt-6 pt-4 border-t border-sidebar-border dark:border-sidebar-border">
            <h4 className="text-md font-semibold mb-2 text-gray-900 dark:text-gray-50">Admin Panel</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/admin/dashboard"
                  className={cn(
                    "flex items-center p-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:hover:bg-sidebar-accent dark:hover:text-sidebar-accent-foreground",
                    location.pathname.startsWith("/admin/dashboard") && "bg-sidebar-accent text-sidebar-accent-foreground dark:bg-sidebar-accent dark:text-sidebar-accent-foreground"
                  )}
                >
                  <Building className="mr-3 h-5 w-5" />
                  Admin Dashboard
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
            </ul>
          </div>
        )}
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