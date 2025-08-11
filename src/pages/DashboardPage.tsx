import React from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { TopBar } from "@/components/TopBar";
import { Sidebar } from "@/components/Sidebar";

const DashboardPage = () => {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <TopBar />
        <main className="flex-1 p-6">
          <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-50">Dashboard Overview</h1>
          <p className="text-gray-700 dark:text-gray-300">
            Welcome to your meeting room booking system.
            Here you will see the calendar view and manage your bookings.
          </p>
          {/* Calendar view will go here */}
        </main>
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default DashboardPage;