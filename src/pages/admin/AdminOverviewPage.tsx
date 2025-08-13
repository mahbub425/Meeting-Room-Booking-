import React from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { TopBar } from "@/components/TopBar";
import { Sidebar } from "@/components/Sidebar";
import { useSession } from "@/components/SessionContextProvider";
import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, Settings, Users, CalendarCheck, BarChart2, LayoutList } from "lucide-react"; // Added LayoutList

const AdminOverviewPage = () => {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false); // Keep this state to control rendering

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!loading && user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError || profile?.role !== 'admin') {
          navigate("/dashboard"); 
          return;
        }
        setIsAdmin(true);
      } else if (!loading && !user) {
        navigate("/login"); // Redirect unauthenticated users to login
      }
    };

    fetchAdminData();
  }, [user, loading, navigate]);

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-50">Loading...</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Checking authentication status and loading admin data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <TopBar />
      <div className="flex flex-1"> {/* This div now contains Sidebar and main content */}
        <Sidebar />
        <main className="flex-1 p-6">
          <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-50">Admin Overview</h1>
          <p className="text-gray-700 dark:text-gray-300 mb-8">
            Welcome, Admin! Here you can navigate to various management sections.
          </p>

          {/* Management Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Analytics Dashboard</CardTitle>
                <CardDescription>View booking trends and room usage statistics.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link to="/admin/analytics">
                    <BarChart2 className="mr-2 h-4 w-4" /> View Analytics
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Meeting Room Management</CardTitle>
                <CardDescription>Add, edit, or remove meeting rooms.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link to="/admin/rooms">
                    <Building className="mr-2 h-4 w-4" /> Manage Rooms
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Meeting Room Categories</CardTitle>
                <CardDescription>Manage categories for meeting rooms.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link to="/admin/categories">
                    <LayoutList className="mr-2 h-4 w-4" /> Manage Categories
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Organization Settings</CardTitle>
                <CardDescription>Configure global settings for your organization.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link to="/admin/organization-profile">
                    <Settings className="mr-2 h-4 w-4" /> Edit Settings
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">User Management</CardTitle>
                <CardDescription>Manage user accounts and roles.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link to="/admin/users">
                    <Users className="mr-2 h-4 w-4" /> Manage Users
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Booking List</CardTitle>
                <CardDescription>Review and manage all bookings.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link to="/admin/bookings">
                    <CalendarCheck className="mr-2 h-4 w-4" /> View All Bookings
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default AdminOverviewPage;