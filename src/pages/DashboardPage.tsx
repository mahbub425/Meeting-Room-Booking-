import React, { useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { TopBar } from "@/components/TopBar";
import { Sidebar } from "@/components/Sidebar";
import { CalendarView } from "@/components/CalendarView";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BookingForm } from "@/components/BookingForm";

const DashboardPage = () => {
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const [preselectedRoomId, setPreselectedRoomId] = useState<string | undefined>(undefined);
  const [preselectedDate, setPreselectedDate] = useState<Date | undefined>(undefined);

  const handleOpenBookingForm = (roomId?: string, date?: Date) => {
    setPreselectedRoomId(roomId);
    setPreselectedDate(date);
    setIsBookingFormOpen(true);
  };

  const handleBookingFormSuccess = () => {
    setIsBookingFormOpen(false);
    setPreselectedRoomId(undefined);
    setPreselectedDate(undefined);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <TopBar />
      <div className="flex flex-1"> {/* This div now contains Sidebar and main content */}
        <Sidebar />
        <main className="flex-1 p-6 relative">
          {/* Removed the h1 and Button for 'Add New Booking' as per screenshot */}
          <CalendarView onCellClick={handleOpenBookingForm} /> {/* Pass handler to CalendarView */}
        </main>
      </div>
      <MadeWithDyad />

      <Dialog open={isBookingFormOpen} onOpenChange={setIsBookingFormOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book New Meeting Room</DialogTitle>
            <DialogDescription>Fill in the details to book a meeting room.</DialogDescription>
          </DialogHeader>
          <BookingForm
            preselectedRoomId={preselectedRoomId}
            preselectedDate={preselectedDate}
            onSuccess={handleBookingFormSuccess}
            onCancel={() => setIsBookingFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardPage;