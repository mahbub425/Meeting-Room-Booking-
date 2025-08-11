import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, setHours, setMinutes, isBefore, isAfter, addDays, startOfDay, endOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@/components/SessionContextProvider";
import { MeetingRoom, Booking } from "@/types";

const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  return format(setMinutes(setHours(new Date(), hour), minute), "HH:mm");
});

const repeatTypeSchema = z.enum(["no_repeat", "daily", "weekly", "custom"]);

const formSchema = z.object({
  meeting_title: z.string().min(1, "Meeting title is required.").max(100, "Meeting title must be at most 100 characters."),
  room_id: z.string().min(1, "Meeting room is required."),
  date_range: z.object({
    from: z.date({ required_error: "Start date is required." }),
    to: z.date({ required_error: "End date is required." }),
  }).refine(data => data.from <= data.to, {
    message: "End date cannot be before start date.",
    path: ["to"],
  }),
  start_time: z.string().min(1, "Start time is required."),
  end_time: z.string().min(1, "End time is required."),
  repeat_type: repeatTypeSchema,
  recurrence_rule: z.string().optional(), // For custom repeats (e.g., "FREQ=DAILY;INTERVAL=2")
  recurrence_end_date: z.date().nullable().optional(), // For custom repeats
  remarks: z.string().max(500, "Note must be at most 500 characters.").optional().or(z.literal("")),
  is_guest_allowed: z.boolean().default(false),
  guest_emails: z.string().optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  const startDateTime = parseISO(format(data.date_range.from, "yyyy-MM-dd") + "T" + data.start_time);
  const endDateTime = parseISO(format(data.date_range.to, "yyyy-MM-dd") + "T" + data.end_time);

  if (isAfter(startDateTime, endDateTime)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "End time cannot be before start time.",
      path: ["end_time"],
    });
  }

  if (data.is_guest_allowed && data.guest_emails) {
    const emails = data.guest_emails.split(',').map(email => email.trim()).filter(Boolean);
    const invalidEmails = emails.filter(email => !z.string().email().safeParse(email).success);
    if (invalidEmails.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid guest email(s): ${invalidEmails.join(', ')}`,
        path: ["guest_emails"],
      });
    }
  }

  if (data.repeat_type === "custom" && !data.recurrence_rule) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Recurrence rule is required for custom repeat.",
      path: ["recurrence_rule"],
    });
  }
  if (data.repeat_type !== "no_repeat" && !data.recurrence_end_date) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Recurrence end date is required for repeating bookings.",
      path: ["recurrence_end_date"],
    });
  }
});

type BookingFormValues = z.infer<typeof formSchema>;

interface BookingFormProps {
  initialData?: Booking | null;
  preselectedRoomId?: string;
  preselectedDate?: Date;
  onSuccess: () => void;
  onCancel: () => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({ initialData, preselectedRoomId, preselectedDate, onSuccess, onCancel }) => {
  const { toast } = useToast();
  const { user } = useSession();
  const [meetingRooms, setMeetingRooms] = useState<MeetingRoom[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      meeting_title: initialData?.meeting_title || "",
      room_id: initialData?.room_id || preselectedRoomId || "",
      date_range: {
        from: initialData?.start_time ? parseISO(initialData.start_time) : preselectedDate || new Date(),
        to: initialData?.end_time ? parseISO(initialData.end_time) : preselectedDate || new Date(),
      },
      start_time: initialData?.start_time ? format(parseISO(initialData.start_time), "HH:mm") : "09:00",
      end_time: initialData?.end_time ? format(parseISO(initialData.end_time), "HH:mm") : "10:00",
      repeat_type: initialData?.repeat_type || "no_repeat",
      recurrence_rule: initialData?.recurrence_rule || "",
      recurrence_end_date: initialData?.recurrence_end_date ? parseISO(initialData.recurrence_end_date) : null,
      remarks: initialData?.remarks || "",
      is_guest_allowed: initialData?.is_guest_allowed ?? false,
      guest_emails: initialData?.guest_emails?.join(", ") || "",
    },
  });

  const repeatType = form.watch("repeat_type");
  const isGuestAllowed = form.watch("is_guest_allowed");

  useEffect(() => {
    const fetchMeetingRooms = async () => {
      const { data, error } = await supabase
        .from('meeting_rooms')
        .select('*')
        .eq('is_enabled', true)
        .order('name', { ascending: true });

      if (error) {
        toast({
          title: "Error fetching rooms",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setMeetingRooms(data || []);
      }
    };
    fetchMeetingRooms();
  }, [toast]);

  const checkBookingConflicts = async (
    roomId: string,
    startTime: string,
    endTime: string,
    startDate: Date,
    endDate: Date,
    repeatType: BookingFormValues['repeat_type'],
    recurrenceRule: string | undefined,
    recurrenceEndDate: Date | null | undefined,
    excludeBookingId?: string
  ): Promise<boolean> => {
    // This is a simplified conflict check. A full implementation would involve
    // generating all recurring instances and checking each one.
    // For now, we'll just check the initial date range.
    const startISO = format(startOfDay(startDate), "yyyy-MM-dd") + "T" + startTime + ":00";
    const endISO = format(endOfDay(endDate), "yyyy-MM-dd") + "T" + endTime + ":00";

    let query = supabase
      .from('bookings')
      .select('id, start_time, end_time')
      .eq('room_id', roomId)
      .neq('status', 'rejected') // Do not consider rejected bookings as conflicts
      .neq('status', 'cancelled') // Do not consider cancelled bookings as conflicts
      .lt('start_time', endISO)
      .gt('end_time', startISO);

    if (excludeBookingId) {
      query = query.neq('id', excludeBookingId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error checking conflicts:", error.message);
      toast({
        title: "Error checking availability",
        description: error.message,
        variant: "destructive",
      });
      return true; // Assume conflict to prevent double booking on error
    }

    if (data && data.length > 0) {
      // Further refine conflict check for partial overlaps if needed
      return true; // Conflict found
    }
    return false; // No conflict
  };

  const onSubmit = async (values: BookingFormValues) => {
    setIsSubmitting(true);
    try {
      if (!user) {
        throw new Error("User not authenticated.");
      }

      const hasConflict = await checkBookingConflicts(
        values.room_id,
        values.start_time,
        values.end_time,
        values.date_range.from,
        values.date_range.to,
        values.repeat_type,
        values.recurrence_rule,
        values.recurrence_end_date,
        initialData?.id
      );

      if (hasConflict) {
        toast({
          title: "Booking Conflict",
          description: "The selected time slot is already booked or overlaps with an existing booking. Please choose another time.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const startDateTimeISO = format(values.date_range.from, "yyyy-MM-dd") + "T" + values.start_time + ":00";
      const endDateTimeISO = format(values.date_range.to, "yyyy-MM-dd") + "T" + values.end_time + ":00";

      const bookingData = {
        meeting_title: values.meeting_title,
        user_id: user.id,
        room_id: values.room_id,
        start_time: startDateTimeISO,
        end_time: endDateTimeISO,
        repeat_type: values.repeat_type,
        remarks: values.remarks || null,
        status: 'pending', // Always pending for new bookings
        guest_emails: values.is_guest_allowed && values.guest_emails ? values.guest_emails.split(',').map(email => email.trim()) : null,
        is_guest_allowed: values.is_guest_allowed,
        created_by_pin: user.user_metadata?.pin || null, // Assuming PIN is in user_metadata
        is_recurring: values.repeat_type !== "no_repeat",
        recurrence_rule: values.repeat_type !== "no_repeat" ? values.recurrence_rule || null : null,
        recurrence_end_date: values.repeat_type !== "no_repeat" && values.recurrence_end_date ? format(values.recurrence_end_date, "yyyy-MM-dd") : null,
      };

      if (initialData) {
        // Update existing booking
        const { error } = await supabase
          .from('bookings')
          .update(bookingData)
          .eq('id', initialData.id);

        if (error) throw error;
        toast({
          title: "Booking Updated",
          description: "Your booking request has been updated and is awaiting approval.",
        });
      } else {
        // Create new booking
        const { error } = await supabase
          .from('bookings')
          .insert(bookingData);

        if (error) throw error;
        toast({
          title: "Booking Submitted",
          description: "Your booking request has been submitted and is awaiting approval.",
        });
      }
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Booking Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
      <div className="space-y-2">
        <Label htmlFor="meeting_title">Meeting Title/Purpose</Label>
        <Input id="meeting_title" {...form.register("meeting_title")} />
        {form.formState.errors.meeting_title && <p className="text-red-500 text-sm">{form.formState.errors.meeting_title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="room_id">Meeting Room</Label>
        <Select onValueChange={(value) => form.setValue("room_id", value)} value={form.watch("room_id")}>
          <SelectTrigger id="room_id">
            <SelectValue placeholder="Select a meeting room" />
          </SelectTrigger>
          <SelectContent>
            {meetingRooms.map((room) => (
              <SelectItem key={room.id} value={room.id}>{room.name} (Capacity: {room.capacity || 'N/A'})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.room_id && <p className="text-red-500 text-sm">{form.formState.errors.room_id.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date_range_from">Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !form.watch("date_range.from") && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {form.watch("date_range.from") ? format(form.watch("date_range.from"), "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={form.watch("date_range.from")}
                onSelect={(date) => form.setValue("date_range.from", date || new Date())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {form.formState.errors.date_range?.from && <p className="text-red-500 text-sm">{form.formState.errors.date_range.from.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="date_range_to">End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !form.watch("date_range.to") && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {form.watch("date_range.to") ? format(form.watch("date_range.to"), "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={form.watch("date_range.to")}
                onSelect={(date) => form.setValue("date_range.to", date || new Date())}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {form.formState.errors.date_range?.to && <p className="text-red-500 text-sm">{form.formState.errors.date_range.to.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_time">Start Time</Label>
          <Select onValueChange={(value) => form.setValue("start_time", value)} value={form.watch("start_time")}>
            <SelectTrigger id="start_time">
              <SelectValue placeholder="Select start time" />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {timeOptions.map((time) => (
                <SelectItem key={time} value={time}>{time}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.start_time && <p className="text-red-500 text-sm">{form.formState.errors.start_time.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_time">End Time</Label>
          <Select onValueChange={(value) => form.setValue("end_time", value)} value={form.watch("end_time")}>
            <SelectTrigger id="end_time">
              <SelectValue placeholder="Select end time" />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {timeOptions.map((time) => (
                <SelectItem key={time} value={time}>{time}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.end_time && <p className="text-red-500 text-sm">{form.formState.errors.end_time.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="repeat_type">Repeat Booking</Label>
        <Select onValueChange={(value) => form.setValue("repeat_type", value as BookingFormValues['repeat_type'])} value={repeatType}>
          <SelectTrigger id="repeat_type">
            <SelectValue placeholder="Select repeat type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no_repeat">No Repeat</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
        {form.formState.errors.repeat_type && <p className="text-red-500 text-sm">{form.formState.errors.repeat_type.message}</p>}
      </div>

      {repeatType !== "no_repeat" && (
        <>
          {repeatType === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="recurrence_rule">Recurrence Rule (e.g., FREQ=DAILY;INTERVAL=2)</Label>
              <Input id="recurrence_rule" {...form.register("recurrence_rule")} placeholder="FREQ=DAILY;INTERVAL=1" />
              {form.formState.errors.recurrence_rule && <p className="text-red-500 text-sm">{form.formState.errors.recurrence_rule.message}</p>}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="recurrence_end_date">Repeat End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !form.watch("recurrence_end_date") && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.watch("recurrence_end_date") ? format(form.watch("recurrence_end_date")!, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={form.watch("recurrence_end_date") || undefined}
                  onSelect={(date) => form.setValue("recurrence_end_date", date || null)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {form.formState.errors.recurrence_end_date && <p className="text-red-500 text-sm">{form.formState.errors.recurrence_end_date.message}</p>}
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="remarks">Note (Optional)</Label>
        <Textarea id="remarks" {...form.register("remarks")} />
        {form.formState.errors.remarks && <p className="text-red-500 text-sm">{form.formState.errors.remarks.message}</p>}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_guest_allowed"
          checked={isGuestAllowed}
          onCheckedChange={(checked) => form.setValue("is_guest_allowed", !!checked)}
        />
        <Label htmlFor="is_guest_allowed">Allow Guests</Label>
      </div>

      {isGuestAllowed && (
        <div className="space-y-2">
          <Label htmlFor="guest_emails">Guest Emails (comma-separated)</Label>
          <Textarea id="guest_emails" {...form.register("guest_emails")} placeholder="email1@example.com, email2@example.com" />
          {form.formState.errors.guest_emails && <p className="text-red-500 text-sm">{form.formState.errors.guest_emails.message}</p>}
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (initialData ? "Updating..." : "Booking...") : (initialData ? "Update Booking" : "Book Now")}
        </Button>
      </div>
    </form>
  );
};