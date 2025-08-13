import React, { useEffect, useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { TopBar } from "@/components/TopBar";
import { Sidebar } from "@/components/Sidebar";
import { useSession } from "@/components/SessionContextProvider";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Booking, MeetingRoom, Profile } from "@/types";
import { BookingTable } from "@/components/admin/BookingTable";
import { BookingDetailsModal } from "@/components/admin/BookingDetailsModal";
import { BookingForm } from "@/components/BookingForm"; // Reusing existing BookingForm
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subMonths, startOfDay, endOfDay, parseISO } from "date-fns";

interface DateRange {
  from?: Date;
  to?: Date;
}

const BookingListPage = () => {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [meetingRooms, setMeetingRooms] = useState<MeetingRoom[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Filter states
  const [filterRoomId, setFilterRoomId] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subMonths(new Date(), 6), // Default to last 6 months
    to: new Date(),
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const bookingsPerPage = 10; // Default to 10 bookings per page

  // Maps for quick lookup in table
  const meetingRoomsMap = new Map(meetingRooms.map(room => [room.id, room.name]));
  const profilesMap = new Map(profiles.map(profile => [profile.id, profile]));

  useEffect(() => {
    const fetchAdminDataAndBookings = async () => {
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
        fetchData();
      } else if (!loading && !user) {
        navigate("/login");
      }
    };

    fetchAdminDataAndBookings();
  }, [user, loading, navigate, filterRoomId, dateRange, currentPage]);

  const fetchData = async () => {
    setIsFetching(true);
    try {
      // Fetch all meeting rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from('meeting_rooms')
        .select('*') // Changed to select all columns
        .order('name', { ascending: true });
      if (roomsError) throw roomsError;
      setMeetingRooms(roomsData || []);

      // Fetch all profiles (for user names, pins, departments)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*') // Changed to select all columns
        .order('name', { ascending: true });
      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      // Fetch bookings with filters and pagination
      let query = supabase
        .from('bookings')
        .select('*', { count: 'exact' });

      if (filterRoomId !== "all") {
        query = query.eq('room_id', filterRoomId);
      }

      const fromDateISO = dateRange.from ? format(startOfDay(dateRange.from), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx") : null;
      const toDateISO = dateRange.to ? format(endOfDay(dateRange.to), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx") : null;

      if (fromDateISO) query = query.gte('start_time', fromDateISO);
      if (toDateISO) query = query.lte('end_time', toDateISO);

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * bookingsPerPage, currentPage * bookingsPerPage - 1);

      if (error) throw error;

      setBookings(data || []);
      setTotalPages(Math.ceil((count || 0) / bookingsPerPage));

    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive",
      });
      setBookings([]);
      setMeetingRooms([]);
      setProfiles([]);
      setTotalPages(1);
    } finally {
      setIsFetching(false);
    }
  };

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsDetailsModalOpen(true);
  };

  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsEditFormOpen(true);
  };

  const handleDeleteBooking = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this booking?")) {
      try {
        const { error } = await supabase
          .from('bookings')
          .delete()
          .eq('id', id);

        if (error) throw error;

        toast({
          title: "Booking Deleted",
          description: "The booking has been successfully deleted.",
        });
        fetchData(); // Refresh the list
      } catch (error: any) {
        toast({
          title: "Deletion Failed",
          description: error.message || "An unexpected error occurred while deleting the booking.",
          variant: "destructive",
        });
      }
    }
  };

  const handleFormSuccess = () => {
    setIsEditFormOpen(false);
    setSelectedBooking(null);
    fetchData(); // Refresh the list
    toast({
      title: "Booking Updated",
      description: "The booking has been successfully updated.",
    });
  };

  if (loading || isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-50">Loading...</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Checking authentication status and fetching booking data.
          </p>
        </div>
      </div>
    );
  }

  if (!user || user.user_metadata?.role !== 'admin') {
    return null; // Redirect handled by useEffect
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <TopBar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">
          <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-50">Booking List</h1>
          <p className="text-gray-700 dark:text-gray-300 mb-8">
            View and manage all meeting room bookings.
          </p>

          {/* Filter Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="space-y-2">
              <Select onValueChange={setFilterRoomId} value={filterRoomId}>
                <SelectTrigger id="room-filter">
                  <SelectValue placeholder="Filter by Room" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rooms</SelectItem>
                  {meetingRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
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
                    {dateRange.from ? format(dateRange.from, "PPP") : <span>From Date</span>}
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
                    {dateRange.to ? format(dateRange.to, "PPP") : <span>To Date</span>}
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

          <BookingTable
            bookings={bookings}
            meetingRooms={meetingRoomsMap}
            users={profilesMap}
            onView={handleViewBooking}
            onEdit={handleEditBooking}
            onDelete={handleDeleteBooking}
          />

          <div className="flex justify-between items-center mt-4">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              variant="outline"
            >
              Previous
            </Button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              variant="outline"
            >
              Next
            </Button>
          </div>
        </main>
      </div>
      <MadeWithDyad />

      <BookingDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        booking={selectedBooking}
        meetingRooms={meetingRoomsMap}
        users={profilesMap}
      />

      <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Meeting Room Booking</DialogTitle>
            <DialogDescription>Modify the details of this meeting room booking.</DialogDescription>
          </DialogHeader>
          <BookingForm
            initialData={selectedBooking}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsEditFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingListPage;