import React from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { TopBar } from "@/components/TopBar";

const DashboardPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <TopBar />
      <main className="flex-1 p-6 flex items-center justify-center">
        {/* Removed the h1 and p tags as requested */}
      </main>
      <MadeWithDyad />
    </div>
  );
};

export default DashboardPage;