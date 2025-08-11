import React, { useEffect, useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { TopBar } from "@/components/TopBar";
import { Sidebar } from "@/components/Sidebar";
import { useSession } from "@/components/SessionContextProvider";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { MeetingRoomTable } from "@/components/admin/MeetingRoomTable";
import { MeetingRoomForm } from "@/components/admin/MeetingRoomForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MeetingRoomCategory } from "@/pages/admin/MeetingRoomCategoryManagementPage"; // Import MeetingRoomCategory

export interface MeetingRoom {
  id: string;
  name: string;
  capacity: number | null;
  facilities: string | null;
  available_time_limit: string | null;
  image_url: string | null;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
  category_id: string | null; // Added category_id
}

const MeetingRoomManagementPage = () => {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<MeetingRoom | null>(null);
  const [meetingRooms, setMeetingRooms] = useState<MeetingRoom[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [categories, setCategories] = useState<MeetingRoomCategory[]>([]); // State to store categories

  useEffect(() => {
    const fetchUserRoleAndRooms = async () => {
      if (!loading && user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError || profile?.role !== 'admin') {
          navigate("/dashboard"); // Redirect non-admins
          return;
        }
        fetchMeetingRooms();
        fetchCategories(); // Fetch categories when component mounts
      } else if (!loading && !user) {
        navigate("/login"); // Redirect unauthenticated
      }
    };

    fetchUserRoleAndRooms();
  }, [user, loading, navigate]);

  const fetchMeetingRooms = async () => {
    setIsFetching(true);
    const { data, error } = await supabase
      .from('meeting_rooms')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      toast({
        title: "Error fetching rooms",
        description: error.message,
        variant: "destructive",
      });
      setMeetingRooms([]);
    } else {
      setMeetingRooms(data || []);
    }
    setIsFetching(false);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('meeting_room_categories')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      toast({
        title: "Error fetching categories",
        description: error.message,
        variant: "destructive",
      });
      setCategories([]);
    } else {
      setCategories(data || []);
    }
  };

  const handleAddRoomClick = () => {
    setEditingRoom(null);
    setIsFormOpen(true);
  };

  const handleEditRoom = (room: MeetingRoom) => {
    setEditingRoom(room);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchMeetingRooms(); // Refresh the list
    toast({
      title: "Success",
      description: editingRoom ? "Meeting room updated." : "Meeting room created.",
    });
  };

  const handleDeleteRoom = async (id: string) => {
    // Check for active/future bookings before deleting
    // For now, we'll just delete. In a real app, you'd implement this check.
    const { error } = await supabase
      .from('meeting_rooms')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error deleting room",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Meeting room deleted.",
      });
      fetchMeetingRooms(); // Refresh the list
    }
  };

  const handleToggleEnable = async (room: MeetingRoom) => {
    const { error } = await supabase
      .from('meeting_rooms')
      .update({ is_enabled: !room.is_enabled })
      .eq('id', room.id);

    if (error) {
      toast({
        title: "Error updating room status",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Meeting room ${room.is_enabled ? 'disabled' : 'enabled'}.`,
      });
      fetchMeetingRooms(); // Refresh the list
    }
  };

  if (loading || isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-50">Loading...</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Checking authentication status and fetching data.
          </p>
        </div>
      </div>
    );
  }

  if (!user || user.user_metadata?.role !== 'admin') {
    return null; // Redirect handled by useEffect
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <TopBar />
        <main className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Meeting Room Management</h1>
            <Button onClick={handleAddRoomClick}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Room
            </Button>
          </div>
          <MeetingRoomTable
            rooms={meetingRooms}
            categories={categories} // Pass categories to the table
            onEdit={handleEditRoom}
            onDelete={handleDeleteRoom}
            onToggleEnable={handleToggleEnable}
          />
        </main>
        <MadeWithDyad />

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingRoom ? "Edit Meeting Room" : "Add New Meeting Room"}</DialogTitle>
              <DialogDescription>
                {editingRoom ? "Modify the details of the meeting room." : "Fill in the details for the new meeting room."}
              </DialogDescription>
            </DialogHeader>
            <MeetingRoomForm
              initialData={editingRoom}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MeetingRoomManagementPage;