import React from "react";
import { Button } from "@/components/ui/button";
import { Menu, Share2, LogOut, User, MoreVertical, Bell, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "@/integrations/supabase/auth";
import { useDashboardLayout } from "@/components/DashboardLayoutContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/Sidebar";
import { format } from "date-fns";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";

export const TopBar = () => {
  const { toast } = useToast();
  const { selectedDate, setSelectedDate, toggleSidebar, isSidebarOpen, setViewMode } = useDashboardLayout();

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied!",
      description: "The current page link has been copied to your clipboard.",
    });
  };

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

  const handleTodayClick = () => {
    setSelectedDate(new Date());
    setViewMode("weekly"); // Reset to weekly view when "Today" is clicked
    toast({
      title: "Calendar Reset",
      description: "Calendar view reset to today's date in weekly mode.",
    });
  };

  const handleNotificationClick = () => {
    toast({
      title: "Notifications",
      description: "No new notifications.", // Placeholder
    });
  };

  const handleHelpClick = () => {
    // In a real app, this would open a modal or redirect to a tutorial page
    toast({
      title: "Help & Tutorial",
      description: "Help content coming soon!", // Placeholder
    });
  };

  return (
    <header className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center space-x-4">
        <Sheet open={isSidebarOpen} onOpenChange={toggleSidebar}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar />
          </SheetContent>
        </Sheet>
        <span className="text-lg font-semibold text-gray-900 dark:text-gray-50">OnnoRokom Meeting Booking System</span>
        {/* Three-Dot Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-4">
              <MoreVertical className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem asChild>
              <Link to="/dashboard">Calendar</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/admin/users">People</Link> {/* Assuming /admin/users for member list */}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/spots">Spots</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/floor-plan">Floor Plan</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center space-x-4">
        <Button variant="outline" className="text-gray-700 dark:text-gray-300" onClick={handleTodayClick}>
          Today
        </Button>
        <span className="text-gray-700 dark:text-gray-300 font-medium">
          {format(selectedDate, "EEEE, MMMM dd, yyyy")}
        </span>
        <Button variant="ghost" size="icon" onClick={handleShare}>
          <Share2 className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </Button>
        <span className="text-lg font-semibold text-gray-900 dark:text-gray-50 hidden md:block">OnnoRokom Group</span>
        {/* Notification Icon */}
        <Button variant="ghost" size="icon" onClick={handleNotificationClick}>
          <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          {/* Add notification count badge here if available */}
        </Button>
        {/* Help Icon */}
        <Button variant="ghost" size="icon" onClick={handleHelpClick}>
          <HelpCircle className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </Button>
        {/* Profile Icon Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/profile">Edit Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};