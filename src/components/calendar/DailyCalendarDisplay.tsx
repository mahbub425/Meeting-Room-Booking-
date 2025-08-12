import React, { useEffect, useState } from "react";
import { useDashboardLayout } from "@/components/DashboardLayoutContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, setHours, setMinutes, isPast, isToday, isBefore, isAfter } from "date-fns"; // Added isBefore, isAfter
import { MeetingRoom, Booking } from "@/types"; // Import MeetingRoom from types
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react"; // Import Plus icon

interface DailyCalendarDisplayProps {
  onCellClick: (roomId?: string, date?: Date, booking?: Booking) => void;
}

const generateTimeSlots = (startHour: number, endHour: number, intervalMinutes: number) => {
  const slots = [];
  let currentTime = setMinutes(setHours(new Date(), startHour), 0);
  const endTime = setMinutes(setHours(new Date(), endHour), 0);

  while (currentTime <= endTime) {
    slots.push(format(currentTime, "HH:mm"));
    currentTime = setMinutes(currentTime, currentTime.getMinutes() + intervalMinutes);
  }
  return slots;
};

const timeSlots = generateTimeSlots(8, 20, 30); // 8 AM to 8 PM, 30-minute intervals

export const DailyCalendarDisplay: React.FC<DailyCalendarDisplayProps> = ({ onCellClick }) => {
  const { selectedDateRange, bookingStatusFilter } = useDashboardLayout(); // Changed selectedDate to selectedDateRange
  const { toast } = useToast();
  const [meetingRooms, setMeetingRooms] = useState<MeetingRoom[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Use the 'from' date of the range for the daily view
  const selectedDay = selectedDateRange.from;

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

      const startOfDayISO = format(startOfDay(selectedDay), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
      const endOfDayISO = format(endOfDay(selectedDay), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");

      let query = supabase
        .from('bookings')
        .select('*')
        .gte('start_time', startOfDayISO)
        .lte('end_time', endOfDayISO);

      if (bookingStatusFilter === 'upcoming') {
        query = query.gte('start_time', new Date().toISOString());
      } else if (bookingStatusFilter === 'past') {
        query = query.lt('end_time', new Date().toISOString());
      }

      const { data: bookingsData, error: bookingsError } = await query; // Corrected variable name

      if (bookingsError) {
        toast({
          title: "Error fetching bookings",
          description: bookingsError.message,
          variant: "destructive",
        });
        setBookings([]);
      } else {
        setBookings(bookingsData || []); // Corrected variable name
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
  }, [selectedDay, bookingStatusFilter, toast]); // Depend on selectedDay

  const getCellStatus = (roomId: string, timeSlot: string): { status: 'available' | 'booked' | 'past' | 'pending' | 'rejected' | 'cancelled' | 'approved', booking?: Booking } => { // Added 'approved'
    const slotStart = parseISO(`${format(selectedDay, "yyyy-MM-dd")}T${timeSlot}:00`);
    const slotEnd = setMinutes(slotStart, slotStart.getMinutes() + 30); // 30-minute slot

    const now = new Date();
    const isSlotPast = isPast(slotEnd) && !isToday(selectedDay); // If the date is today, only past if the time slot itself is past. If not today, the whole day is past.

    for (const booking of bookings) {
      const bookingStart = parseISO(booking.start_time);
      const bookingEnd = parseISO(booking.end_time);

      // Check for overlap
      const overlaps = isWithinInterval(slotStart, { start: bookingStart, end: bookingEnd }) ||
                       isWithinInterval(slotEnd, { start: bookingStart, end: bookingEnd }) ||
                       (isBefore(bookingStart, slotStart) && isAfter(bookingEnd, slotEnd));

      if (booking.room_id === roomId && overlaps) {
        if (isSlotPast || isPast(bookingEnd)) {
          return { status: 'past', booking };
        }
        return { status: booking.status, booking };
      }
    }

    if (isSlotPast) {
      return { status: 'past' };
    }

    return { status: 'available' };
  };

  const getCellClasses = (status: ReturnType<typeof getCellStatus>['status']) => {
    switch (status) {
      case 'available':
        return "bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 cursor-pointer"; // Light blue for available
      case 'booked':
      case 'approved': // Handled 'approved' status
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

  const handleCellClick = (roomId: string, timeSlot: string, status: ReturnType<typeof getCellStatus>['status'], booking?: Booking) => {
    if (status === 'available') {
      const clickedDate = parseISO(`${format(selectedDay, "yyyy-MM-dd")}T${timeSlot}:00`);
      onCellClick(roomId, clickedDate);
    } else if (booking) {
      onCellClick(roomId, parseISO(booking.start_time), booking);
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
            <TableHead className="w-[80px] sticky left-0 bg-white dark:bg-gray-800 z-20">Time</TableHead>
            {meetingRooms.map((room) => (
              <TableHead key={room.id} className="text-center w-[150px] min-w-[150px]">{room.name}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {timeSlots.map((timeSlot) => (
            <TableRow key={timeSlot}>
              <TableCell className="font-medium sticky left-0 bg-white dark:bg-gray-800 z-10">{timeSlot}</TableCell>
              {meetingRooms.map((room) => {
                const { status, booking } = getCellStatus(room.id, timeSlot);
                return (
                  <TableCell
                    key={`${room.id}-${timeSlot}`}
                    className={`border p-2 text-xs h-12 flex items-center justify-center ${getCellClasses(status)}`}
                    onClick={() => handleCellClick(room.id, timeSlot, status, booking)}
                  >
                    {status === 'available' ? (
                      <Plus className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                    ) : (
                      booking && (
                        <div className="truncate text-center">
                          {booking.meeting_title}
                          {status === 'past' && " (Past)"}
                          {status === 'pending' && " (Pending)"}
                          {status === 'rejected' && " (Rejected)"}
                          {status === 'cancelled' && " (Cancelled)"}
                        </div>
                      )
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