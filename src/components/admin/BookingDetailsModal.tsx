import React from "react";
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Booking, MeetingRoom, Profile } from "@/types";
import { format, parseISO } from "date-fns";

interface BookingDetailsModalProps {
  booking: Booking;
  meetingRoomsMap: Map<string, string>;
  profilesMap: Map<string, Profile>;
  onClose: () => void;
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({ booking, meetingRoomsMap, profilesMap, onClose }) => {
  const userProfile = profilesMap.get(booking.user_id);
  const roomName = meetingRoomsMap.get(booking.room_id) || "Unknown Room";
  const startTime = parseISO(booking.start_time);
  const endTime = parseISO(booking.end_time);

  return (
    <div className="space-y-4 p-4">
      <div>
        <h3 className="font-semibold text-lg">Meeting Title:</h3>
        <p>{booking.meeting_title}</p>
      </div>
      <div>
        <h3 className="font-semibold text-lg">Meeting Room:</h3>
        <p>{roomName}</p>
      </div>
      <div>
        <h3 className="font-semibold text-lg">Booked By:</h3>
        <p>{userProfile?.name || "N/A"}</p>
      </div>
      <div>
        <h3 className="font-semibold text-lg">User PIN:</h3>
        <p>{userProfile?.pin || "N/A"}</p>
      </div>
      <div>
        <h3 className="font-semibold text-lg">Department:</h3>
        <p>{userProfile?.department || "N/A"}</p>
      </div>
      <div>
        <h3 className="font-semibold text-lg">Meeting Time:</h3>
        <p>{`${format(startTime, "MMM dd, yyyy HH:mm")} - ${format(endTime, "HH:mm")}`}</p>
      </div>
      <div>
        <h3 className="font-semibold text-lg">Status:</h3>
        <p className={`font-semibold ${
          booking.status === 'approved' ? 'text-green-600' :
          booking.status === 'pending' ? 'text-yellow-600' :
          booking.status === 'rejected' ? 'text-red-600' :
          booking.status === 'cancelled' ? 'text-orange-600' :
          'text-gray-600'
        }`}>
          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
        </p>
      </div>
      {booking.repeat_type !== 'no_repeat' && (
        <div>
          <h3 className="font-semibold text-lg">Repeat Type:</h3>
          <p>{booking.repeat_type.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</p>
        </div>
      )}
      {booking.recurrence_rule && (
        <div>
          <h3 className="font-semibold text-lg">Recurrence Rule:</h3>
          <p>{booking.recurrence_rule}</p>
        </div>
      )}
      {booking.recurrence_end_date && (
        <div>
          <h3 className="font-semibold text-lg">Recurrence End Date:</h3>
          <p>{format(parseISO(booking.recurrence_end_date), "MMM dd, yyyy")}</p>
        </div>
      )}
      {booking.remarks && (
        <div>
          <h3 className="font-semibold text-lg">Remarks:</h3>
          <p>{booking.remarks}</p>
        </div>
      )}
      {booking.is_guest_allowed && booking.guest_emails && booking.guest_emails.length > 0 && (
        <div>
          <h3 className="font-semibold text-lg">Guest Emails:</h3>
          <p>{booking.guest_emails.join(", ")}</p>
        </div>
      )}
      {booking.rejection_reason && (
        <div>
          <h3 className="font-semibold text-lg">Rejection Reason:</h3>
          <p className="text-red-600">{booking.rejection_reason}</p>
        </div>
      )}
      <DialogFooter className="mt-4">
        <Button variant="outline" onClick={onClose}>Close</Button>
      </DialogFooter>
    </div>
  );
};