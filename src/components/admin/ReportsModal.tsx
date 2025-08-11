import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from 'xlsx';
import { format, subMonths, subYears, startOfMonth, endOfMonth, startOfYear, endOfYear, differenceInMinutes, parseISO } from "date-fns";
import { Booking } from "@/types";

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ReportPeriod = "last_month" | "this_month" | "last_year" | "this_year";

export const ReportsModal: React.FC<ReportsModalProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>("this_month");
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async () => {
    setIsGenerating(true);
    let startDate: Date;
    let endDate: Date;
    const now = new Date();

    switch (selectedPeriod) {
      case "last_month":
        startDate = startOfMonth(subMonths(now, 1));
        endDate = endOfMonth(subMonths(now, 1));
        break;
      case "this_month":
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case "last_year":
        startDate = startOfYear(subYears(now, 1));
        endDate = endOfYear(subYears(now, 1));
        break;
      case "this_year":
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      default:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
    }

    try {
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .gte('start_time', format(startDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"))
        .lte('end_time', format(endDate, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"))
        .order('created_at', { ascending: true });

      if (bookingsError) throw bookingsError;

      const { data: rooms, error: roomsError } = await supabase
        .from('meeting_rooms')
        .select('id, name');

      if (roomsError) throw roomsError;

      const roomMap = new Map(rooms.map(room => [room.id, room.name]));

      const reportData = bookings.map((booking: Booking) => ({
        "Booking ID": booking.id,
        "Meeting Title": booking.meeting_title,
        "Room Name": roomMap.get(booking.room_id) || "Unknown Room",
        "Start Time": format(parseISO(booking.start_time), "yyyy-MM-dd HH:mm"),
        "End Time": format(parseISO(booking.end_time), "yyyy-MM-dd HH:mm"),
        "Status": booking.status,
        "Repeat Type": booking.repeat_type,
        "Remarks": booking.remarks || "",
        "Created At": format(parseISO(booking.created_at), "yyyy-MM-dd HH:mm"),
      }));

      if (reportData.length === 0) {
        toast({
          title: "No Data",
          description: "No bookings found for the selected period.",
          variant: "default",
        });
        return;
      }

      // Calculate Room Usage and Popular Times
      const roomUsage: { [key: string]: number } = {}; // room_id -> total minutes booked
      const popularTimes: { [key: string]: number } = {}; // HH:mm -> count of bookings starting at this time

      bookings.forEach(booking => {
        const start = parseISO(booking.start_time);
        const end = parseISO(booking.end_time);
        const duration = differenceInMinutes(end, start);

        roomUsage[booking.room_id] = (roomUsage[booking.room_id] || 0) + duration;

        const startTimeHourMinute = format(start, "HH:mm");
        popularTimes[startTimeHourMinute] = (popularTimes[startTimeHourMinute] || 0) + 1;
      });

      const roomUsageSummary = Object.entries(roomUsage)
        .map(([roomId, minutes]) => ({
          "Room Name": roomMap.get(roomId) || "Unknown Room",
          "Total Usage (Minutes)": minutes,
          "Total Usage (Hours)": (minutes / 60).toFixed(2),
        }))
        .sort((a, b) => b["Total Usage (Minutes)"] - a["Total Usage (Minutes)"]);

      const popularTimesSummary = Object.entries(popularTimes)
        .map(([time, count]) => ({
          "Time Slot": time,
          "Number of Bookings": count,
        }))
        .sort((a, b) => b["Number of Bookings"] - a["Number of Bookings"]);

      // Create multiple sheets in the Excel workbook
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Detailed Bookings
      const worksheetBookings = XLSX.utils.json_to_sheet(reportData.slice(0, 10000));
      XLSX.utils.book_append_sheet(workbook, worksheetBookings, "Detailed Bookings");
      if (reportData.length > 10000) {
        toast({
          title: "Report Truncated",
          description: "Detailed bookings report limited to 10,000 rows for performance. Consider a shorter period.",
          variant: "warning",
        });
      }

      // Sheet 2: Room Usage Summary
      if (roomUsageSummary.length > 0) {
        const worksheetRoomUsage = XLSX.utils.json_to_sheet(roomUsageSummary);
        XLSX.utils.book_append_sheet(workbook, worksheetRoomUsage, "Room Usage Summary");
      }

      // Sheet 3: Popular Times Summary
      if (popularTimesSummary.length > 0) {
        const worksheetPopularTimes = XLSX.utils.json_to_sheet(popularTimesSummary);
        XLSX.utils.book_append_sheet(workbook, worksheetPopularTimes, "Popular Times Summary");
      }

      const fileName = `Meeting_Bookings_Report_${selectedPeriod}_${format(now, "yyyyMMdd_HHmmss")}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "Report Generated",
        description: `The report for ${selectedPeriod.replace('_', ' ')} has been downloaded.`,
      });
      onClose();
    } catch (error: any) {
      console.error("Error generating report:", error);
      toast({
        title: "Report Generation Failed",
        description: error.message || "An unexpected error occurred while generating the report.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Reports</DialogTitle>
          <DialogDescription>
            Select a period to generate a statistical report of meeting room bookings.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="report-period" className="text-right">
              Period
            </Label>
            <Select onValueChange={(value: ReportPeriod) => setSelectedPeriod(value)} value={selectedPeriod}>
              <SelectTrigger id="report-period" className="col-span-3">
                <SelectValue placeholder="Select a period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="this_year">This Year</SelectItem>
                <SelectItem value="last_year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={generateReport} disabled={isGenerating}>
            {isGenerating ? "Generating..." : "Generate Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};