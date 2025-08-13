import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye } from "lucide-react";
import { Booking, MeetingRoom, Profile } from "@/types";
import { format, parseISO } from "date-fns";

interface BookingTableProps {
  bookings: Booking[];
  onEdit: (booking: Booking) => void;
  onDelete: (id: string) => void;
  onView: (booking: Booking) => void;
  meetingRoomsMap: Map<string, string>;
  profilesMap: Map<string, Profile>;
}

export const BookingTable: React.FC<BookingTableProps> = ({ bookings, onEdit, onDelete, onView, meetingRoomsMap, profilesMap }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Meeting Title</TableHead>
          <TableHead>Room</TableHead>
          <TableHead>Booked By</TableHead>
          <TableHead>PIN</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Meeting Time</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-4 text-gray-500">
              No bookings found.
            </TableCell>
          </TableRow>
        ) : (
          bookings.map((booking) => {
            const userProfile = profilesMap.get(booking.user_id);
            const roomName = meetingRoomsMap.get(booking.room_id) || "Unknown Room";
            const startTime = parseISO(booking.start_time);
            const endTime = parseISO(booking.end_time);

            return (
              <TableRow key={booking.id}>
                <TableCell className="font-medium">{booking.meeting_title}</TableCell>
                <TableCell>{roomName}</TableCell>
                <TableCell>{userProfile?.name || "N/A"}</TableCell>
                <TableCell>{userProfile?.pin || "N/A"}</TableCell>
                <TableCell>{userProfile?.department || "N/A"}</TableCell>
                <TableCell>{`${format(startTime, "MMM dd, yyyy HH:mm")} - ${format(endTime, "HH:mm")}`}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    booking.status === 'approved' ? 'bg-green-100 text-green-800' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    booking.status === 'cancelled' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(booking)}>
                        <Eye className="mr-2 h-4 w-4" /> View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(booking)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(booking.id)} className="text-red-600">Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
};