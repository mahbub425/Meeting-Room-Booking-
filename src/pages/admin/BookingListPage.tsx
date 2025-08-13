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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format, subMonths, startOfDay, endOfDay, parseISO } from "date-fns";
import { BookingForm } from "@/components/BookingForm";
import { BookingTable } from "@/components/admin/BookingTable";
import { BookingDetailsModal } from "@/components/admin/BookingDetailsModal";

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

  const [searchTerm, setSearchTerm] = useState("");
  const [filterRoomId, setFilterRoomId] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subMonths(new Date(), 5), // Default to last 6 months
    to: new Date(),
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [bookingsPerPage, setBookingsPerPage] = useState(10);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);

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
  }, [user, loading, navigate, searchTerm, filterRoomId, dateRange, currentPage, bookingsPerPage]);

  const fetchData = async () => {
    setIsFetching(true);

    // Fetch Meeting Rooms
    const { data: roomsData, error: roomsError } = await supabase
      .from('meeting_rooms')
      .select('*') // Changed to select all columns
      .order('name', { ascending: true });
    if (roomsError) {
      toast({ title: "Error fetching rooms", description: roomsError.message, variant: "destructive" });
      setMeetingRooms([]);
    } else {
      setMeetingRooms(roomsData || []);
    }

    // Fetch Profiles (for user names, pins, departments)
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*'); // Changed to select all columns
    if (profilesError) {
      toast({ title: "Error fetching profiles", description: profilesError.message, variant: "destructive" });
      setProfiles([]);
    } else {
      setProfiles(profilesData || []);
    }

    // Fetch Bookings
    let query = supabase
      .from('bookings')
      .select('*', { count: 'exact' });

    if (searchTerm) {
      query = query.or(`meeting_title.ilike.%${searchTerm}%`);
      // For searching by user name, pin, department, we need to join or fetch separately
      // For simplicity, we'll only search by meeting_title for now.
      // A more complex solution would involve RPC functions or client-side filtering after fetching all relevant data.
    }
    if (filterRoomId !== "all") {
      query = query.eq('room_id', filterRoomId);
    }
    if (dateRange.from) {
      query = query.gte('start_time', format(startOfDay(dateRange.from), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"));
    }
    if (dateRange.to) {
      query = query.lte('end_time', format(endOfDay(dateRange.to), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"));
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((currentPage - 1) * bookingsPerPage, currentPage * bookingsPerPage - 1);

    if (error) {
      toast({
        title: "Error fetching bookings",
        description: error.message,
        variant: "destructive",
      });
      setBookings([]);
      setTotalPages(1);
    } else {
      setBookings(data || []);
      setTotalPages(Math.ceil((count || 0) / bookingsPerPage));
    }
    setIsFetching(false);
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setIsFormOpen(true);
  };

  const handleViewBooking = (booking: Booking) => {
    setViewingBooking(booking);
    setIsDetailsModalOpen(true);
  };

  const handleDeleteBooking = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this booking?")) {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          title: "Error deleting booking",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Booking deleted.",
        });
        fetchData(); // Refresh the list
      }
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingBooking(null);
    fetchData(); // Refresh the list
    toast({
      title: "Success",
      description: editingBooking ? "Booking updated." : "Booking created.",
    });
  };

  const roomMap = new Map(meetingRooms.map(room => [room.id, room.name]));
  const profileMap = new Map(profiles.map(profile => [profile.id, profile]));

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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Booking List</h1>
          </div>

          <div className="flex flex-wrap gap-4 mb-4">
            <Input
              placeholder="Search by meeting title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm flex-1 min-w-[200px]"
            />
            <Select onValueChange={setFilterRoomId} value={filterRoomId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Room" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rooms</SelectItem>
                {meetingRooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[200px] justify-start text-left font-normal",
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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[200px] justify-start text-left font-normal",
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
            <Button onClick={fetchData}>Apply Filters</Button>
          </div>

          <BookingTable
            bookings={bookings}
            onEdit={handleEditBooking}
            onDelete={handleDeleteBooking}
            onView={handleViewBooking}
            meetingRoomsMap={roomMap}
            profilesMap={profileMap}
          />

          <div className="flex justify-between items-center mt-4">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              variant="outline"
            >
              Previous
            </Button>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {currentPage} of {totalPages}
              </span>
              <Select onValueChange={(value) => setBookingsPerPage(Number(value))} value={String(bookingsPerPage)}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Per Page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
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

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBooking ? "Edit Meeting Room Booking" : "Book New Meeting Room"}</DialogTitle>
            <DialogDescription>Fill in the details to book a meeting room.</DialogDescription>
          </DialogHeader>
          <BookingForm
            initialData={editingBooking}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>Detailed information about the selected booking.</DialogDescription>
          </DialogHeader>
          {viewingBooking && (
            <BookingDetailsModal
              booking={viewingBooking}
              meetingRoomsMap={roomMap}
              profilesMap={profileMap}
              onClose={() => setIsDetailsModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingListPage;