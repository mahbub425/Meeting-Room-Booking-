import React, { useEffect, useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { TopBar } from "@/components/TopBar";
import { Sidebar } from "@/components/Sidebar";
import { useSession } from "@/components/SessionContextProvider";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { MeetingRoom } from "@/pages/admin/MeetingRoomManagementPage"; // Re-use interface

const MeetingRoomGridPage = () => {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [meetingRooms, setMeetingRooms] = useState<MeetingRoom[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchRooms = async () => {
      if (!loading && user) {
        fetchMeetingRooms();
      } else if (!loading && !user) {
        navigate("/login"); // Redirect unauthenticated
      }
    };

    fetchRooms();
  }, [user, loading, navigate]);

  const fetchMeetingRooms = async () => {
    setIsFetching(true);
    const { data, error } = await supabase
      .from('meeting_rooms')
      .select('*')
      .eq('is_enabled', true) // Only show enabled rooms
      .order('name', { ascending: true });

    if (error) {
      toast({
        title: "Error fetching meeting rooms",
        description: error.message,
        variant: "destructive",
      });
      setMeetingRooms([]);
    } else {
      setMeetingRooms(data || []);
    }
    setIsFetching(false);
  };

  const filteredRooms = meetingRooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.facilities?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.available_time_limit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (room.capacity && room.capacity.toString().includes(searchTerm))
  );

  if (loading || isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-50">Loading...</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Fetching meeting rooms.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirect handled by useEffect
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <TopBar />
        <main className="flex-1 p-6">
          <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-50">Meeting Rooms (Spots)</h1>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search rooms by name, capacity, facilities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full max-w-md"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRooms.length === 0 ? (
              <p className="col-span-full text-center text-gray-500 py-8">No meeting rooms found matching your criteria.</p>
            ) : (
              filteredRooms.map((room) => (
                <Card key={room.id} className="flex flex-col">
                  {room.image_url && (
                    <img src={room.image_url} alt={room.name} className="w-full h-48 object-cover rounded-t-lg" />
                  )}
                  <CardHeader>
                    <CardTitle>{room.name}</CardTitle>
                    <CardDescription>Capacity: {room.capacity || "N/A"}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Facilities: {room.facilities || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Available Time: {room.available_time_limit || "N/A"}
                    </p>
                    {/* Add a link to room details or booking form here */}
                    <Button variant="outline" className="mt-4 w-full" onClick={() => navigate(`/room/${room.id}`)}>
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </main>
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default MeetingRoomGridPage;