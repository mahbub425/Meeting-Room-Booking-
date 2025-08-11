import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Calendar, Users, Building, LogOut, User, LayoutGrid, Map } from "lucide-react"; // Added LayoutGrid, Map icons
import { cn } from "@/lib/utils";
import { useSession } from "@/components/SessionContextProvider";
import { signOut } from "@/integrations/supabase/auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDashboardLayout } from "@/components/DashboardLayoutContext"; // Import useDashboardLayout

export const Sidebar = () => {
  const { user, loading } = useSession();
  const { toast } = useToast();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const { bookingStatusFilter, setBookingStatusFilter } = useDashboardLayout(); // Use bookingStatusFilter from context

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

  const navItems = [
    { name: "Calendar", icon: Calendar, path: "/dashboard" },
    { name: "Profile", icon: User, path: "/profile" },
    { name: "People", icon: Users, path: "/admin/users" }, // Link to User Management for all users to view
    { name: "Spots", icon: LayoutGrid, path: "/spots" }, // Link to Meeting Room Grid
    { name: "Floor Plan", icon: Map, path: "/floor-plan" }, // Link to Floor Plan
  ];

  if (isAdmin) {
    // Admin specific links are already covered by the general links if they are also accessible to admins
    // If there are admin-exclusive features, they would be added here.
    // For now, "User Management" and "Meeting Room Management" are covered by "People" and "Spots"
    // but I'll keep the explicit admin links for clarity as per previous request.
    navItems.push(
      { name: "Admin Dashboard", icon: Building, path: "/admin" }, // General admin dashboard
      // { name: "User Management", icon: Users, path: "/admin/users" }, // Already in general navItems
      // { name: "Meeting Room Management", icon: Building, path: "/admin/rooms" }, // Already in general navItems
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