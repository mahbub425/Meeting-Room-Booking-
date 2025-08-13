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
import { BookingTable } from "@/components/admin/BookingTable";
import { Booking, Profile, MeetingRoom } from "@/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subMonths, startOfDay, endOfDay, parseISO } from "date-fns"; // Added parseISO
import { BookingForm } from "@/components/BookingForm"; // Reusing BookingForm for edit/view
import { Label } from "@/components/ui/label"; // Added Label import

interface DateRange {
  from?: Date;
  to?: Date;
}

const BookingListPage = () => {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null); // For view mode
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [meetingRooms, setMeetingRooms] = useState<MeetingRoom[]>([]);
  const [filterRoomId, setFilterRoomId] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subMonths(new Date(), 5), // Default to last 6 months
    to: new Date(),
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const bookingsPerPage = 10;

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
        fetchMeetingRooms();
        fetchBookings();
      } else if (!loading && !user) {
        navigate("/login");
      }
    };

    fetchAdminDataAndBookings();

    // Set up real-time subscription for bookings
    const bookingSubscription = supabase
      .channel('public:bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, payload => {
        console.log('Booking change received!', payload);
        fetchBookings(); // Re-fetch data on any change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(bookingSubscription);
    };
  }, [user, loading, navigate, filterRoomId, dateRange, currentPage]);

  const fetchMeetingRooms = async () => {
    const { data, error } = await supabase
      .from('meeting_rooms')
      .select('*') // Changed to select all fields to match MeetingRoom type
      .order('name', { ascending: true });

    if (error) {
      toast({
        title: "Error fetching rooms",
        description: error.message,
        variant: "destructive",
      });
      setMeetingRooms([]);
    } else {
      const allRoomsOption: MeetingRoom = {
        id: "all",
        name: "All Rooms",
        capacity: null, facilities: null, available_time_limit: null, image_url: null, is_enabled: true,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(), category_id: null,
      };
      setMeetingRooms([allRoomsOption, ...(data || [])]);
    }
  };

  const fetchBookings = async () => {
    setIsFetching(true);
    let query = supabase
      .from('bookings')
      .select(`
        *,
        profiles (name, pin, department, designation)
      `, { count: 'exact' });

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
      // Map the data to include profile details directly in the booking object
      const formattedBookings = data?.map(booking => ({
        ...booking,
        user_name: (booking.profiles as Profile)?.name || 'N/A',
        user_pin: (booking.profiles as Profile)?.pin || 'N/A',
        user_department: (booking.profiles as Profile)?.department || 'N/A',
        user_designation: (booking.profiles as Profile)?.designation || 'N/A',
      })) as Booking[] || [];
      setBookings(formattedBookings);
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
    setIsViewModalOpen(true);
  };

  const handleDeleteBooking = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this booking?")) {
      return;
    }
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
      fetchBookings();
    } catch (error: any) {
      toast({
        title: "Deletion Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingBooking(null);
    fetchBookings();
    toast({
      title: "Success",
      description: "Booking updated successfully.",
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
    return null;
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

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="space-y-2">
              <Label htmlFor="room-filter">Filter by Room</Label>
              <Select onValueChange={setFilterRoomId} value={filterRoomId}>
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

          <BookingTable
            bookings={bookings}
            onEdit={handleEditBooking}
            onDelete={handleDeleteBooking}
            onView={handleViewBooking}
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

      {/* Edit Booking Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Meeting Room Booking</DialogTitle>
            <DialogDescription>Modify the details of the meeting room booking.</DialogDescription>
          </DialogHeader>
          <BookingForm
            initialData={editingBooking}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* View Booking Dialog */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>Details of the selected meeting room booking.</DialogDescription>
          </DialogHeader>
          {viewingBooking && (
            <div className="space-y-4 p-4">
              <div>
                <Label className="font-semibold">Meeting Title:</Label>
                <p>{viewingBooking.meeting_title}</p>
              </div>
              <div>
                <Label className="font-semibold">Booked By:</Label>
                <p>{viewingBooking.user_name} (PIN: {viewingBooking.user_pin})</p>
              </div>
              <div>
                <Label className="font-semibold">Department:</Label>
                <p>{viewingBooking.user_department}</p>
              </div>
              <div>
                <Label className="font-semibold">Designation:</Label>
                <p>{viewingBooking.user_designation}</p>
              </div>
              <div>
                <Label className="font-semibold">Room ID:</Label>
                <p>{viewingBooking.room_id}</p>
              </div>
              <div>
                <Label className="font-semibold">Meeting Time:</Label>
                <p>{format(parseISO(viewingBooking.start_time), "PPP p")} - {format(parseISO(viewingBooking.end_time), "p")}</p>
              </div>
              <div>
                <Label className="font-semibold">Status:</Label>
                <p className="capitalize">{viewingBooking.status}</p>
              </div>
              <div>
                <Label className="font-semibold">Repeat Type:</Label>
                <p className="capitalize">{viewingBooking.repeat_type.replace('_', ' ')}</p>
              </div>
              {viewingBooking.recurrence_rule && (
                <div>
                  <Label className="font-semibold">Recurrence Rule:</Label>
                  <p>{viewingBooking.recurrence_rule}</p>
                </div>
              )}
              {viewingBooking.recurrence_end_date && (
                <div>
                  <Label className="font-semibold">Recurrence End Date:</Label>
                  <p>{format(parseISO(viewingBooking.recurrence_end_date), "PPP")}</p>
                </div>
              )}
              <div>
                <Label className="font-semibold">Remarks:</Label>
                <p>{viewingBooking.remarks || "N/A"}</p>
              </div>
              <div>
                <Label className="font-semibold">Guests Allowed:</Label>
                <p>{viewingBooking.is_guest_allowed ? "Yes" : "No"}</p>
              </div>
              {viewingBooking.is_guest_allowed && viewingBooking.guest_emails && viewingBooking.guest_emails.length > 0 && (
                <div>
                  <Label className="font-semibold">Guest Emails:</Label>
                  <p>{viewingBooking.guest_emails.join(", ")}</p>
                </div>
              )}
              <div>
                <Label className="font-semibold">Created At:</Label>
                <p>{format(parseISO(viewingBooking.created_at), "PPP p")}</p>
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2 mt-4">
            <Button onClick={() => setIsViewModalOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingListPage;