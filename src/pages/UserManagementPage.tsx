import React, { useEffect, useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { TopBar } from "@/components/TopBar";
import { Sidebar } from "@/components/Sidebar";
import { useSession } from "@/components/SessionContextProvider";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  department: string | null;
  designation: string | null;
  role: string;
}

const UserManagementPage = () => {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      if (!loading && user) {
        // For now, all authenticated users can view the member list.
        // If this page should be admin-only, add role check here.
        fetchUserProfiles();
      } else if (!loading && !user) {
        navigate("/login"); // Redirect unauthenticated
      }
    };

    fetchUsers();
  }, [user, loading, navigate]);

  const fetchUserProfiles = async () => {
    setIsFetching(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, phone, department, designation, role')
      .order('name', { ascending: true });

    if (error) {
      toast({
        title: "Error fetching users",
        description: error.message,
        variant: "destructive",
      });
      setUsers([]);
    } else {
      setUsers(data || []);
    }
    setIsFetching(false);
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-50">Loading...</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Fetching user data.
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
          <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-50">People (Member List)</h1>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Search by name, email, department, or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full max-w-md"
            />
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium">{profile.name}</TableCell>
                      <TableCell>{profile.email}</TableCell>
                      <TableCell>{profile.phone || "N/A"}</TableCell>
                      <TableCell>{profile.department || "N/A"}</TableCell>
                      <TableCell>{profile.designation || "N/A"}</TableCell>
                      <TableCell>{profile.role}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </main>
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default UserManagementPage;