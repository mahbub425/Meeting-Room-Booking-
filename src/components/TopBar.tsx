import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Share2, LogOut, User, Bell, HelpCircle, BarChart2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "@/integrations/supabase/auth";
import { useDashboardLayout } from "@/components/DashboardLayoutContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/Sidebar";
import { format, startOfWeek, endOfWeek } from "date-fns"; // Import startOfWeek, endOfWeek
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { useSession } from "@/components/SessionContextProvider";
import { ReportsModal } from "@/components/admin/ReportsModal";

export const TopBar = () => {
  const { toast } = useToast();
  const { selectedDateRange, setSelectedDateRange, toggleSidebar, isSidebarOpen, setViewMode } = useDashboardLayout();
  const { user } = useSession();
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);

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
    const today = new Date();
    setSelectedDateRange({
      from: startOfWeek(today, { weekStartsOn: 0 }),
      to: endOfWeek(today, { weekStartsOn: 0 }),
    });
    setViewMode("weekly");
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
    toast({
      title: "Help & Tutorial",
      description: "Help content coming soon!",
    });
  };

  const isAdmin = user?.user_metadata?.role === 'admin';

  return (
    <header className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-800 dark:border-gray-700">
      {/* Left Section: Sidebar Trigger, Logo, Today Button + Month/Year */}
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
        {/* Main Logo/Title */}
        <span className="text-lg font-semibold text-gray-900 dark:text-gray-50">OnnoRokom Group</span>

        {/* Today Button and Month/Year */}
        <div className="flex items-center space-x-2 ml-4">
          <Button variant="outline" className="text-gray-700 dark:text-gray-300" onClick={handleTodayClick}>
            Today
          </Button>
          <span className="text-gray-700 dark:text-gray-300 font-medium">
            {format(selectedDateRange.from, "PPP")} {/* Changed to display full date */}
          </span>
        </div>
      </div>

      {/* Right Section: Share, Admin Reports, Notifications, Help, User Dropdown */}
      <div className="flex items-center space-x-4">
        {/* Share Button */}
        <Button variant="ghost" onClick={handleShare}>
          <Share2 className="mr-2 h-5 w-5 text-gray-700 dark:text-gray-300" />
          Share
        </Button>
        {/* Report Icon - Only for Admins */}
        {isAdmin && (
          <Button variant="ghost" size="icon" onClick={() => setIsReportsModalOpen(true)}>
            <BarChart2 className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={handleNotificationClick}>
          <Bell className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleHelpClick}>
          <HelpCircle className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/profile">Edit Personal Profile</Link>
            </DropdownMenuItem>
            {isAdmin && (
              <>
                <DropdownMenuItem asChild>
                  <Link to="/admin/organization-profile">Edit Organization Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/admin/users">User Management</Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {isAdmin && (
        <ReportsModal
          isOpen={isReportsModalOpen}
          onClose={() => setIsReportsModalOpen(false)}
        />
      )}
    </header>
  );
};