import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, QrCode, Download, Printer, Copy } from "lucide-react";
import { MeetingRoom } from "@/pages/admin/MeetingRoomManagementPage";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { QRCode } from "qrcode.react"; // Changed from default import to named import
import { useToast } from "@/hooks/use-toast";

interface MeetingRoomTableProps {
  rooms: MeetingRoom[];
  onEdit: (room: MeetingRoom) => void;
  onDelete: (id: string) => void;
  onToggleEnable: (room: MeetingRoom) => void;
}

export const MeetingRoomTable: React.FC<MeetingRoomTableProps> = ({ rooms, onEdit, onDelete, onToggleEnable }) => {
  const [qrCodeModalOpen, setQrCodeModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<MeetingRoom | null>(null);
  const { toast } = useToast();

  const handleQrCodeClick = (room: MeetingRoom) => {
    setSelectedRoom(room);
    setQrCodeModalOpen(true);
  };

  const getRoomUrl = (roomId: string) => {
    // This URL should match the FRS specification: https://onnorkom.com/rooms/[room_id]
    // For local development, we'll use the current origin.
    return `${window.location.origin}/room/${roomId}`;
  };

  const handleDownloadQrCode = () => {
    if (selectedRoom) {
      const canvas = document.getElementById(`qrcode-${selectedRoom.id}`) as HTMLCanvasElement;
      if (canvas) {
        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.href = pngUrl;
        downloadLink.download = `qr_code_${selectedRoom.name}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        toast({ title: "QR Code Downloaded", description: "The QR code image has been downloaded." });
      }
    }
  };

  const handlePrintQrCode = () => {
    if (selectedRoom) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print QR Code for ${selectedRoom.name}</title>
              <style>
                body { font-family: sans-serif; text-align: center; padding: 20px; }
                img { max-width: 300px; height: auto; margin-bottom: 20px; }
                h1 { font-size: 24px; margin-bottom: 10px; }
                p { font-size: 16px; }
              </style>
            </head>
            <body>
              <h1>${selectedRoom.name}</h1>
              <img src="${(document.getElementById(`qrcode-${selectedRoom.id}`) as HTMLCanvasElement)?.toDataURL("image/png")}" alt="QR Code for ${selectedRoom.name}" />
              <p>${getRoomUrl(selectedRoom.id)}</p>
              <script>
                window.onload = function() {
                  window.print();
                  window.onafterprint = function() {
                    window.close();
                  };
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  const handleCopyUrl = () => {
    if (selectedRoom) {
      navigator.clipboard.writeText(getRoomUrl(selectedRoom.id));
      toast({ title: "URL Copied", description: "The room URL has been copied to your clipboard." });
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Capacity</TableHead>
            <TableHead>Facilities</TableHead>
            <TableHead>Time Limit</TableHead>
            <TableHead>Enabled</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rooms.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                No meeting rooms found.
              </TableCell>
            </TableRow>
          ) : (
            rooms.map((room) => (
              <TableRow key={room.id}>
                <TableCell className="font-medium">{room.name}</TableCell>
                <TableCell>{room.capacity || "N/A"}</TableCell>
                <TableCell className="max-w-[200px] truncate">{room.facilities || "N/A"}</TableCell>
                <TableCell>{room.available_time_limit || "N/A"}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleEnable(room)}
                    className={room.is_enabled ? "text-green-600 hover:text-green-700" : "text-red-600 hover:text-red-700"}
                  >
                    {room.is_enabled ? "Yes" : "No"}
                  </Button>
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
                      <DropdownMenuItem onClick={() => onEdit(room)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(room.id)}>Delete</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleQrCodeClick(room)}>
                        <QrCode className="mr-2 h-4 w-4" /> View QR Code
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Dialog open={qrCodeModalOpen} onOpenChange={setQrCodeModalOpen}>
        <DialogContent className="sm:max-w-[425px] text-center">
          <DialogHeader>
            <DialogTitle>QR Code for {selectedRoom?.name}</DialogTitle>
            <DialogDescription>
              Scan this QR code to view room details and book.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-4">
            {selectedRoom && (
              <QRCode
                id={`qrcode-${selectedRoom.id}`}
                value={getRoomUrl(selectedRoom.id)}
                size={256}
                level="H"
                includeMargin={true}
              />
            )}
          </div>
          <p className="text-sm text-gray-500 break-all">{selectedRoom ? getRoomUrl(selectedRoom.id) : ""}</p>
          <div className="flex justify-center space-x-2 mt-4">
            <Button onClick={handleDownloadQrCode} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Download PNG
            </Button>
            <Button onClick={handlePrintQrCode} variant="outline">
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
            <Button onClick={handleCopyUrl} variant="outline">
              <Copy className="mr-2 h-4 w-4" /> Copy URL
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};