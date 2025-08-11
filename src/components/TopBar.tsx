import React from "react";
import { Button } from "@/components/ui/button";
import { Menu, Share2, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "@/integrations/supabase/auth";

export const TopBar = () => {
  const { toast } = useToast();
  const today = new Date();
  const monthName = today.toLocaleString('default', { month: 'long' });
  const year = today.getFullYear();

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

  return (
    <header className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-800 dark:border-gray-700">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
        </Button>
        <span className="text-lg font-semibold text-gray-900 dark:text-gray-50">Meeting Room Booking</span>
      </div>
      <div className="flex items-center space-x-4">
        <Button variant="outline" className="text-gray-700 dark:text-gray-300">
          Today
        </Button>
        <span className="text-gray-700 dark:text-gray-300">
          {monthName} {year}
        </span>
        <Button variant="ghost" size="icon" onClick={handleShare}>
          <Share2 className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </Button>
      </div>
    </header>
  );
};