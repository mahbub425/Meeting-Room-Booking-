import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Booking, MeetingRoom, Profile } from "@/types";
import { format, parseISO } from "date-fns";

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  meetingRooms: Map<string, string>;
  users: Map<string, Profile>;
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({ isOpen, onClose, booking, meetingRooms, users }) => {
  if (!booking) return null;

  const roomName = meetingRooms.get(booking.room_id) || "Unknown Room";
  const bookedByUser = users.get(booking.user_id);
  const userName = bookedByUser?.name || "Unknown User";
  const userPin = bookedByUser?.pin || "N/A";
  const userDepartment = bookedByUser?.department || "N/A";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Booking Details</DialogTitle>
          <DialogDescription>Detailed information about this meeting room booking.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 text-sm">
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-gray-500 dark:text-gray-400">Meeting Title:</span>
            <span className="col-span-2 font-medium">{booking.meeting_title}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-gray-500 dark:text-gray-400">Room:</span>
            <span className="col-span-2 font-medium">{roomName}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-gray-500 dark:text-gray-400">Booked By:</span>
            <span className="col-span-2">{userName} (PIN: {userPin})</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-gray-500 dark:text-gray-400">Department:</span>
            <span className="col-span-2">{userDepartment}</span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-gray-500 dark:text-gray-400">Meeting Time:</span>
            <span className="col-span-2">
              {format(parseISO(booking.start_time), "MMM dd, yyyy HH:mm")} -{" "}
              {format(parseISO(booking.end_time), "HH:mm")}
            </span>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-gray-500 dark:text-gray-400">Status:</span>
            <span className="col-span-2 font-semibold capitalize">{booking.status}</span>
          </div>
          {booking.repeat_type !== 'no_repeat' && (
            <>
              <div className="grid grid-cols-3 items-center gap-4">
                <span className="text-gray-500 dark:text-gray-400">Repeat Type:</span>
                <span className="col-span-2 capitalize">{booking.repeat_type.replace('_', ' ')}</span>
              </div>
              {booking.recurrence_rule && (
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="text-gray-500 dark:text-gray-400">Recurrence Rule:</span>
                  <span className="col-span-2">{booking.recurrence_rule}</span>
                </div>
              )}
              {booking.recurrence_end_date && (
                <div className="grid grid-cols-3 items-center gap-4">
                  <span className="text-gray-500 dark:text-gray-400">Repeat End Date:</span>
                  <span className="col-span-2">{format(parseISO(booking.recurrence_end_date), "MMM dd, yyyy")}</span>
                </div>
              )}
            </>
          )}
          {booking.remarks && (
            <div className="grid grid-cols-3 items-start gap-4">
              <span className="text-gray-500 dark:text-gray-400">Remarks:</span>
              <span className="col-span-2 break-words">{booking.remarks}</span>
            </div>
          )}
          {booking.is_guest_allowed && booking.guest_emails && booking.guest_emails.length > 0 && (
            <div className="grid grid-cols-3 items-start gap-4">
              <span className="text-gray-500 dark:text-gray-400">Guest Emails:</span>
              <span className="col-span-2 break-words">{booking.guest_emails.join(", ")}</span>
            </div>
          )}
          {booking.status === 'rejected' && booking.rejection_reason && (
            <div className="grid grid-cols-3 items-start gap-4">
              <span className="text-gray-500 dark:text-gray-400">Rejection Reason:</span>
              <span className="col-span-2 text-red-600 break-words">{booking.rejection_reason}</span>
            </div>
          )}
          <div className="grid grid-cols-3 items-center gap-4">
            <span className="text-gray-500 dark:text-gray-400">Created At:</span>
            <span className="col-span-2">{format(parseISO(booking.created_at), "MMM dd, yyyy HH:mm")}</span>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};