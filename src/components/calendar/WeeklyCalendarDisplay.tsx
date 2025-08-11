import React, { useEffect, useState } from "react";
import { useDashboardLayout } from "@/components/DashboardLayoutContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isPast, isToday, parseISO } from "date-fns";
import { MeetingRoom, Booking } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export const WeeklyCalendarDisplay: React.FC = () => {
  const { selectedDate, bookingStatusFilter } = useDashboardLayout();
  const { toast } = useToast();
  const [meetingRooms, setMeetingRooms] = useState<MeetingRoom[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const startOfSelectedWeek = startOfWeek(selectedDate, { weekStartsOn: 0 }); // Sunday as start of week
  const endOfSelectedWeek = endOfWeek(selectedDate, { weekStartsOn: 0 }); // Saturday as end of week
  const daysOfWeek = eachDayOfInterval({ start: startOfSelectedWeek, end: endOfSelectedWeek });

  useEffect(() => {
    const fetchRoomsAndBookings = async () => {
      setLoading(true);
      const { data: roomsData, error: roomsError } = await supabase
        .from('meeting_rooms')
        .select('*')
        .eq('is_enabled', true)
        .order('name', { ascending: true });

      if (roomsError) {
        toast({
          title: "Error fetching meeting rooms",
          description: roomsError.message,
          variant: "destructive",
        });
        setMeetingRooms([]);
      } else {
        setMeetingRooms(roomsData || []);
      }

      const startOfWeekISO = format(startOfSelectedWeek, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
      const endOfWeekISO = format(endOfSelectedWeek, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");

      let query = supabase
        .from('bookings')
        .select('*')
        .gte('start_time', startOfWeekISO)
        .lte('end_time', endOfWeekISO);

      if (bookingStatusFilter === 'upcoming') {
        query = query.gte('start_time', new Date().toISOString());
      } else if (bookingStatusFilter === 'past') {
        query = query.lt('end_time', new Date().toISOString());
      }

      const { data: bookingsData, error: bookingsError } = await query;

      if (bookingsError) {
        toast({
          title: "Error fetching bookings",
          description: bookingsError.message,
          variant: "destructive",
        });
        setBookings([]);
      } else {
        setBookings(bookingsData || []);
      }
      setLoading(false);
    };

    fetchRoomsAndBookings();

    // Set up real-time subscription for bookings
    const bookingSubscription = supabase
      .channel('public:bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, payload => {
        console.log('Change received!', payload);
        fetchRoomsAndBookings(); // Re-fetch data on any change
      })
      .subscribe();

    // Set up real-time subscription for meeting_rooms
    const roomsSubscription = supabase
      .channel('public:meeting_rooms')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meeting_rooms' }, payload => {
        console.log('Change received!', payload);
        fetchRoomsAndBookings(); // Re-fetch data on any change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(bookingSubscription);
      supabase.removeChannel(roomsSubscription);
    };
  }, [selectedDate, bookingStatusFilter, toast]);

  const getCellStatus = (roomId: string, date: Date): { status: 'available' | 'booked' | 'past' | 'pending' | 'rejected' | 'cancelled', booking?: Booking } => {
    const now = new Date();
    const isDayPast = isPast(date) && !isSameDay(date, now);

    for (const booking of bookings) {
      const bookingStart = parseISO(booking.start_time);
      const bookingEnd = parseISO(booking.end_time);

      if (booking.room_id === roomId && isSameDay(bookingStart, date)) {
        if (isDayPast || isPast(bookingEnd)) {
          return { status: 'past', booking };
        }
        return { status: booking.status, booking };
      }
    }

    if (isDayPast) {
      return { status: 'past' };
    }

    return { status: 'available' };
  };

  const getCellClasses = (status: ReturnType<typeof getCellStatus>['status']) => {
    switch (status) {
      case 'available':
        return "bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 cursor-pointer";
      case 'booked':
      case 'approved':
        return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 cursor-pointer";
      case 'pending':
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 cursor-pointer";
      case 'past':
        return "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed";
      case 'rejected':
        return "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 cursor-not-allowed";
      case 'cancelled':
        return "bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 cursor-not-allowed";
      default:
        return "";
    }
  };

  const handleCellClick = (roomId: string, date: Date, status: ReturnType<typeof getCellStatus>['status'], booking?: Booking) => {
    if (status === 'available') {
      toast({
        title: "Book Room",
        description: `You clicked on an available slot for room ${roomId} on ${format(date, 'PPP')}. (Booking form will open here)`,
      });
      // TODO: Open booking form
    } else if (booking) {
      toast({
        title: "Booking Details",
        description: `Meeting: ${booking.meeting_title} | Status: ${booking.status} | Date: ${format(parseISO(booking.start_time), 'PPP')}`,
      });
      // TODO: Open booking details popup
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (meetingRooms.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No enabled meeting rooms found. Please add rooms in Admin Management.
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-200px)] w-full">
      <Table className="min-w-full table-fixed">
        <TableHeader className="sticky top-0 bg-white dark:bg-gray-800 z-10">
          <TableRow>
            <TableHead className="w-[120px] sticky left-0 bg-white dark:bg-gray-800 z-20">Room</TableHead>
            {daysOfWeek.map((day) => (
              <TableHead key={day.toISOString()} className={`text-center w-[150px] min-w-[150px] ${isSameDay(day, new Date()) ? "text-blue-600 dark:text-blue-400 font-bold" : ""}`}>
                {format(day, "EEE, MMM dd")}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {meetingRooms.map((room) => (
            <TableRow key={room.id}>
              <TableCell className="font-medium sticky left-0 bg-white dark:bg-gray-800 z-10">{room.name}</TableCell>
              {daysOfWeek.map((day) => {
                const { status, booking } = getCellStatus(room.id, day);
                return (
                  <TableCell
                    key={`${room.id}-${day.toISOString()}`}
                    className={`border p-2 text-xs h-24 ${getCellClasses(status)}`}
                    onClick={() => handleCellClick(room.id, day, status, booking)}
                  >
                    {booking && (
                      <div className="truncate">
                        {booking.meeting_title}
                        {status === 'past' && " (Past)"}
                        {status === 'pending' && " (Pending)"}
                        {status === 'rejected' && " (Rejected)"}
                        {status === 'cancelled' && " (Cancelled)"}
                      </div>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};