import React from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { TopBar } from "@/components/TopBar";

const DashboardPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <TopBar />
      <main className="flex-1 p-6 flex items-center justify-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">User Dashboard</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mt-4">
          Content removed as per request.
        </p>
      </main>
      <MadeWithDyad />
    </div>
  );
};

export default DashboardPage;