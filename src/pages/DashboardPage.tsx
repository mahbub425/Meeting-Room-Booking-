import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { TopBar } from "@/components/TopBar";
import { Sidebar } from "@/components/Sidebar";
import { CalendarView } from "@/components/CalendarView";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BookingForm } from "@/components/BookingForm";
import { Booking } from "@/types"; // Import Booking type
import { DashboardLayoutProvider } from "@/components/DashboardLayoutContext"; // Import DashboardLayoutProvider

const DashboardPage = () => {
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [preselectedRoomId, setPreselectedRoomId] = useState<string | undefined>(undefined);
  const [preselectedDate, setPreselectedDate] = useState<Date | undefined>(undefined);

  const handleCellClick = (roomId?: string, date?: Date, booking?: Booking) => {
    setEditingBooking(booking || null);
    setPreselectedRoomId(roomId);
    setPreselectedDate(date);
    setIsBookingFormOpen(true);
  };

  const handleBookingFormSuccess = () => {
    setIsBookingFormOpen(false);
    setEditingBooking(null);
    setPreselectedRoomId(undefined);
    setPreselectedDate(undefined);
  };

  return (
    <DashboardLayoutProvider onCellClick={handleCellClick}> {/* Pass handleCellClick here */}
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
        <TopBar />
        <div className="flex flex-1"> {/* This div now contains Sidebar and main content */}
          <Sidebar />
          <main className="flex-1 p-6 relative">
            <CalendarView onCellClick={handleCellClick} /> {/* Pass handler to CalendarView */}
          </main>
        </div>
        <MadeWithDyad />

        <Dialog open={isBookingFormOpen} onOpenChange={setIsBookingFormOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBooking ? "Edit Meeting Room Booking" : "Book New Meeting Room"}</DialogTitle>
              <DialogDescription>Fill in the details to book a meeting room.</DialogDescription>
            </DialogHeader>
            <BookingForm
              initialData={editingBooking}
              preselectedRoomId={preselectedRoomId}
              preselectedDate={preselectedDate}
              onSuccess={handleBookingFormSuccess}
              onCancel={() => setIsBookingFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayoutProvider>
  );
};

export default DashboardPage;