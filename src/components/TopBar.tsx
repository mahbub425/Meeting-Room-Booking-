import React from "react";
import { Button } from "@/components/ui/button";
import { Menu, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
      </div>
    </header>
  );
};