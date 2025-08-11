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
import { Building, Settings, Users, CalendarCheck, BarChart2 } from "lucide-react"; // Added BarChart2
import { useToast } from "@/hooks/use-toast";

const AdminDashboardPage = () => {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false); // Keep this state to control rendering
  const [stats, setStats] = useState({
    totalRooms: 0,
    pendingBookings: 0,
    totalUsers: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!loading && user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError || profile?.role !== 'admin') {
          // This case should ideally be handled by SessionContextProvider redirect
          // but keeping it here as a fallback for content rendering.
          navigate("/dashboard"); 
          return;
        }
        setIsAdmin(true);
        fetchStats();
      } else if (!loading && !user) {
        navigate("/login"); // Redirect unauthenticated users to login
      }
    };

    fetchAdminData();
  }, [user, loading, navigate, toast]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      // Fetch total meeting rooms
      const { count: roomsCount, error: roomsError } = await supabase
        .from('meeting_rooms')
        .select('*', { count: 'exact', head: true });
      if (roomsError) throw roomsError;

      // Fetch pending bookings
      const { count: pendingBookingsCount, error: bookingsError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (bookingsError) throw bookingsError;

      // Fetch total users (profiles)
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (usersError) throw usersError;

      setStats({
        totalRooms: roomsCount || 0,
        pendingBookings: pendingBookingsCount || 0,
        totalUsers: usersCount || 0,
      });
    } catch (error: any) {
      toast({
        title: "Error fetching dashboard stats",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setStatsLoading(false);
    }
  };

  if (loading || !isAdmin || statsLoading) {
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
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <TopBar />
        <main className="flex-1 p-6">
          <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-50">Super Admin Dashboard</h1>
          <p className="text-gray-700 dark:text-gray-300 mb-8">
            Welcome, Super Admin! Here you can manage all aspects of the meeting booking system.
          </p>

          {/* Overview Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Meeting Rooms</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRooms}</div>
                <p className="text-xs text-muted-foreground">
                  Currently active rooms
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingBookings}</div>
                <p className="text-xs text-muted-foreground">
                  Bookings awaiting approval
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Registered users in the system
                </p>
              </CardContent>
            </Card>
          </div>

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
                <CardTitle className="text-xl">Booking Approvals</CardTitle>
                <CardDescription>Review and approve/reject pending bookings.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full" variant="outline" disabled>
                  <Link to="#">
                    <CalendarCheck className="mr-2 h-4 w-4" /> Review Bookings (Coming Soon)
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default AdminDashboardPage;