import React from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { TopBar } from "@/components/TopBar";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSession } from "@/components/SessionContextProvider";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const FloorPlanPage = () => {
  const { user, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login"); // Redirect unauthenticated
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-50">Loading...</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Checking authentication status.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirect handled by useEffect
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <TopBar />
        <main className="flex-1 p-6">
          <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-50">Floor Plan</h1>
          <Card>
            <CardHeader>
              <CardTitle>Office Floor Layout</CardTitle>
              <CardDescription>Visualize meeting room distribution across different floors.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center h-96 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-500 dark:text-gray-300">
                <p className="text-lg">Floor plan visualization coming soon!</p>
                <p className="text-sm mt-2">This section will display interactive floor plans with room locations.</p>
              </div>
            </CardContent>
          </Card>
        </main>
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default FloorPlanPage;