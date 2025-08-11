import React, { useEffect, useState } from "react";
import { useDashboardLayout } from "@/components/DashboardLayoutContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isPast, isToday, getDay, addDays } from "date-fns";
import { Booking } from "@/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const MonthlyCalendarDisplay: React.FC = () => {
  const { selectedDate, setSelectedDate, setViewMode, bookingStatusFilter } = useDashboardLayout();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const startOfCurrentMonth = startOfMonth(selectedDate);
  const endOfCurrentMonth = endOfMonth(selectedDate);
  const daysInMonth = eachDayOfInterval({ start: startOfCurrentMonth, end: endOfCurrentMonth });

  // Pad the start of the month to align with the first day of the week (Sunday = 0)
  const firstDayOfWeek = getDay(startOfCurrentMonth); // 0 for Sunday, 1 for Monday, etc.
  const paddedDays = Array.from({ length: firstDayOfWeek }, (_, i) => null).concat(daysInMonth);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      const startOfMonthISO = format(startOfCurrentMonth, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
      const endOfMonthISO = format(endOfCurrentMonth, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");

      let query = supabase
        .from('bookings')
        .select('*')
        .gte('start_time', startOfMonthISO)
        .lte('end_time', endOfMonthISO);

      if (bookingStatusFilter === 'upcoming') {
        query = query.gte('start_time', new Date().toISOString());
      } else if (bookingStatusFilter === 'past') {
        query = query.lt('end_time', new Date().toISOString());
      }

      const { data, error } = await query;

      if (error) {
        toast({
          title: "Error fetching bookings",
          description: error.message,
          variant: "destructive",
        });
        setBookings([]);
      } else {
        setBookings(data || []);
      }
      setLoading(false);
    };

    fetchBookings();

    // Set up real-time subscription for bookings
    const bookingSubscription = supabase
      .channel('public:bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, payload => {
        console.log('Change received!', payload);
        fetchBookings(); // Re-fetch data on any change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(bookingSubscription);
    };
  }, [selectedDate, bookingStatusFilter, toast]);

  const getBookingsForDay = (date: Date) => {
    return bookings.filter(booking => isSameDay(parseISO(booking.start_time), date));
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setViewMode("daily");
    toast({
      title: "Switched to Daily View",
      description: `Now showing bookings for ${format(date, 'PPP')}.`,
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const daysOfWeekNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="p-4">
      <div className="grid grid-cols-7 gap-2 mb-4 text-center font-semibold text-gray-700 dark:text-gray-300">
        {daysOfWeekNames.map(day => (
          <div key={day}>{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {paddedDays.map((day, index) => (
          <div
            key={index}
            className={`border rounded-lg p-2 h-32 flex flex-col ${day ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-900"}`}
          >
            {day ? (
              <>
                <div className={`text-right font-bold mb-2 ${isToday(day) ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-gray-50"}`}>
                  {format(day, "d")}
                </div>
                <div className="flex-1 overflow-y-auto text-xs text-gray-600 dark:text-gray-400">
                  {getBookingsForDay(day).length > 0 ? (
                    <ul className="space-y-1">
                      {getBookingsForDay(day).slice(0, 2).map((booking) => (
                        <li key={booking.id} className={`truncate ${isPast(parseISO(booking.end_time)) ? "text-gray-500" : "text-blue-600 dark:text-blue-400"}`}>
                          {booking.meeting_title}
                        </li>
                      ))}
                      {getBookingsForDay(day).length > 2 && (
                        <li className="text-gray-500">+{getBookingsForDay(day).length - 2} more</li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-gray-400 dark:text-gray-600">No bookings</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => handleDayClick(day)}
                >
                  View Day
                </Button>
              </>
            ) : (
              <div className="text-gray-400 dark:text-gray-600 text-center flex items-center justify-center h-full">
                &nbsp;
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};