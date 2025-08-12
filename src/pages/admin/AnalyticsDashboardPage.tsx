import React, { useEffect, useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { TopBar } from "@/components/TopBar";
import { Sidebar } from "@/components/Sidebar";
import { useSession } from "@/components/SessionContextProvider";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, Users, Building } from "lucide-react"; // Added Users, Building icons
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, eachMonthOfInterval, addMonths, subMonths } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { MeetingRoom, Booking } from "@/types";

interface DateRange {
  from?: Date;
  to?: Date;
}

const AnalyticsDashboardPage = () => {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [meetingRooms, setMeetingRooms] = useState<MeetingRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [monthlyBookingData, setMonthlyBookingData] = useState<any[]>([]);
  const [roomBookingData, setRoomBookingData] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [totalRooms, setTotalRooms] = useState(0);

  useEffect(() => {
    const fetchAdminData = async () => {
      if (!loading && user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError || profile?.role !== 'admin') {
          navigate("/dashboard"); // Redirect non-admins
          return;
        }
        setIsAdmin(true);
        fetchMeetingRooms(); // Fetch rooms first, then analytics data
        fetchAnalyticsData();
      } else if (!loading && !user) {
        navigate("/login"); // Redirect unauthenticated users to login
      }
    };

    fetchAdminData();
  }, [user, loading, navigate, toast, dateRange, selectedRoomId]);

  const fetchMeetingRooms = async () => {
    const { data, error } = await supabase
      .from('meeting_rooms')
      .select('id, name, capacity, facilities, available_time_limit, image_url, is_enabled, created_at, updated_at, category_id') // Select all fields
      .order('name', { ascending: true });

    if (error) {
      toast({
        title: "Error fetching rooms",
        description: error.message,
        variant: "destructive",
      });
      setMeetingRooms([]);
    } else {
      // Ensure the 'All Rooms' object conforms to MeetingRoom interface
      const allRoomsOption: MeetingRoom = {
        id: "all",
        name: "All Rooms",
        capacity: null,
        facilities: null,
        available_time_limit: null,
        image_url: null,
        is_enabled: true,
        created_at: new Date().toISOString(), // Provide default values
        updated_at: new Date().toISOString(), // Provide default values
        category_id: null,
      };
      setMeetingRooms([allRoomsOption, ...(data as MeetingRoom[] || [])]); // Cast data to MeetingRoom[]
    }
  };

  const fetchAnalyticsData = async () => {
    setStatsLoading(true);
    try {
      const fromDate = dateRange.from ? format(dateRange.from, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx") : null;
      const toDate = dateRange.to ? format(dateRange.to, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx") : null;

      // Fetch total users
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      if (usersError) throw usersError;
      setTotalUsers(usersCount || 0);

      // Fetch total rooms
      const { count: roomsCount, error: roomsError } = await supabase
        .from('meeting_rooms')
        .select('*', { count: 'exact', head: true });
      if (roomsError) throw roomsError;
      setTotalRooms(roomsCount || 0);

      // Fetch total bookings (filtered by date range and room)
      let bookingsQuery = supabase
        .from('bookings')
        .select('*', { count: 'exact', head: false });

      if (fromDate) bookingsQuery = bookingsQuery.gte('start_time', fromDate);
      if (toDate) bookingsQuery = bookingsQuery.lte('end_time', toDate);
      if (selectedRoomId !== "all") bookingsQuery = bookingsQuery.eq('room_id', selectedRoomId);

      const { data: bookingsData, count: bookingsCount, error: bookingsError } = await bookingsQuery;
      if (bookingsError) throw bookingsError;
      setTotalBookings(bookingsCount || 0);

      // Prepare data for Monthly Booking Growth Rate (Line Chart)
      const monthlyCounts: { [key: string]: number } = {};
      if (dateRange.from && dateRange.to) {
        eachMonthOfInterval({ start: startOfMonth(dateRange.from), end: endOfMonth(dateRange.to) }).forEach(month => {
          monthlyCounts[format(month, "yyyy-MM")] = 0;
        });
      }

      bookingsData?.forEach((booking: Booking) => {
        const monthKey = format(parseISO(booking.start_time), "yyyy-MM");
        monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
      });

      const formattedMonthlyData = Object.keys(monthlyCounts).sort().map(key => ({
        month: format(parseISO(`${key}-01`), "MMM yy"),
        bookings: monthlyCounts[key],
      }));
      setMonthlyBookingData(formattedMonthlyData);

      // Prepare data for Room-wise Booking (Bar Chart)
      const roomCounts: { [key: string]: number } = {};
      bookingsData?.forEach((booking: Booking) => {
        const roomName = meetingRooms.find(room => room.id === booking.room_id)?.name || "Unknown";
        roomCounts[roomName] = (roomCounts[roomName] || 0) + 1;
      });

      const formattedRoomData = Object.keys(roomCounts).map(roomName => ({
        room: roomName,
        bookings: roomCounts[roomName],
      }));
      setRoomBookingData(formattedRoomData);

    } catch (error: any) {
      toast({
        title: "Error fetching analytics data",
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
            Checking authentication status and loading analytics data.
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
          <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-50">Analytics Dashboard</h1>
          <p className="text-gray-700 dark:text-gray-300 mb-8">
            Gain insights into meeting room usage and user activity.
          </p>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="space-y-2">
              <Label htmlFor="room-filter">Filter by Room</Label>
              <Select onValueChange={setSelectedRoomId} value={selectedRoomId}>
                <SelectTrigger id="room-filter">
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  {meetingRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-range-from">Date Range (From)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? format(dateRange.from, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, from: date || undefined }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-range-to">Date Range (To)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? format(dateRange.to, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => setDateRange(prev => ({ ...prev, to: date || undefined }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Overview Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Registered users in the system
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalBookings}</div>
                <p className="text-xs text-muted-foreground">
                  Bookings in selected period
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Meeting Rooms</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalRooms}</div>
                <p className="text-xs text-muted-foreground">
                  Currently active rooms
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Booking Growth Rate</CardTitle>
                <CardDescription>Bookings over time for the selected period.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={monthlyBookingData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="bookings" stroke="#8884d8" activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Room-wise Booking Count</CardTitle>
                <CardDescription>Number of bookings per meeting room.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={roomBookingData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="room" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="bookings" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default AnalyticsDashboardPage;