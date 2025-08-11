import React from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { TopBar } from "@/components/TopBar";
import { Sidebar } from "@/components/Sidebar";
import { useSession } from "@/components/SessionContextProvider";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const AdminDashboardPage = () => {
  const { user, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      // Assuming 'role' is part of user_metadata or fetched profile
      // For now, we'll check if the user's email is 'admin@example.com' as a temporary admin check
      // In a real scenario, you'd fetch the profile and check the 'role' column.
      // For this FRS, we've added a 'role' column to profiles.
      // We'll assume the admin user's profile 'role' will be manually set to 'admin' in Supabase.
      if (user.user_metadata?.role !== 'admin') {
        navigate("/dashboard"); // Redirect non-admins to regular dashboard
      }
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

  if (!user || user.user_metadata?.role !== 'admin') {
    return null; // Or show an access denied message, but redirect is handled by useEffect
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <TopBar />
        <main className="flex-1 p-6">
          <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-50">Admin Dashboard</h1>
          <p className="text-gray-700 dark:text-gray-300">
            Welcome, Super Admin! Here you can manage users and meeting rooms.
          </p>
          {/* Admin management components will go here */}
        </main>
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default AdminDashboardPage;