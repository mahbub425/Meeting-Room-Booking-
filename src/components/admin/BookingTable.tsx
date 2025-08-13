import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { Booking } from "@/types";
import { format, parseISO } from "date-fns";

interface BookingTableProps {
  bookings: Booking[];
  onEdit: (booking: Booking) => void;
  onDelete: (id: string) => void;
  onView: (booking: Booking) => void;
}

export const BookingTable: React.FC<BookingTableProps> = ({ bookings, onEdit, onDelete, onView }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Meeting Title</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>PIN</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Designation</TableHead>
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
          bookings.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell className="font-medium">{booking.meeting_title}</TableCell>
              <TableCell>{(booking as any).user_name || "N/A"}</TableCell> {/* Access user_name from joined data */}
              <TableCell>{(booking as any).user_pin || "N/A"}</TableCell> {/* Access user_pin from joined data */}
              <TableCell>{(booking as any).user_department || "N/A"}</TableCell> {/* Access user_department from joined data */}
              <TableCell>{(booking as any).user_designation || "N/A"}</TableCell> {/* Access user_designation from joined data */}
              <TableCell>
                {format(parseISO(booking.start_time), "MMM dd, yyyy HH:mm")} - {format(parseISO(booking.end_time), "HH:mm")}
              </TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize
                  ${booking.status === 'approved' ? 'bg-green-100 text-green-800' : ''}
                  ${booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${booking.status === 'rejected' ? 'bg-red-100 text-red-800' : ''}
                  ${booking.status === 'cancelled' ? 'bg-gray-100 text-gray-800' : ''}
                `}>
                  {booking.status}
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
                    <DropdownMenuItem onClick={() => onView(booking)}>View</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(booking)}>Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(booking.id)} className="text-red-600">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
};