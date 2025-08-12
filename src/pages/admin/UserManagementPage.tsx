import React, { useEffect, useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { TopBar } from "@/components/TopBar";
import { Sidebar } from "@/components/Sidebar";
import { useSession } from "@/components/SessionContextProvider";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserTable } from "@/components/admin/UserTable";
import { UserForm } from "@/components/admin/UserForm";
import { Profile } from "@/types";
import { Input } from "@/components/ui/input"; // Added Input import
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Added Select imports

const UserManagementPage = () => {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const usersPerPage = 20;

  useEffect(() => {
    const fetchUserRoleAndUsers = async () => {
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
        fetchUsers();
      } else if (!loading && !user) {
        navigate("/login"); // Redirect unauthenticated
      }
    };

    fetchUserRoleAndUsers();
  }, [user, loading, navigate, searchTerm, filterRole, currentPage]);

  const fetchUsers = async () => {
    setIsFetching(true);
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' });

    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    }
    if (filterRole !== "all") {
      query = query.eq('role', filterRole);
    }

    const { data, error, count } = await query
      .order('name', { ascending: true })
      .range((currentPage - 1) * usersPerPage, currentPage * usersPerPage - 1);

    if (error) {
      toast({
        title: "Error fetching users",
        description: error.message,
        variant: "destructive",
      });
      setUsers([]);
      setTotalPages(1);
    } else {
      setUsers(data || []);
      setTotalPages(Math.ceil((count || 0) / usersPerPage));
    }
    setIsFetching(false);
  };

  const handleAddUserClick = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleEditUser = (user: Profile) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchUsers(); // Refresh the list
    toast({
      title: "Success",
      description: editingUser ? "User updated." : "User created.",
    });
  };

  const handleToggleEnable = async (userToToggle: Profile) => {
    if (userToToggle.id === user?.id) {
      toast({
        title: "Action Denied",
        description: "You cannot disable your own account.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ is_enabled: !userToToggle.is_enabled })
      .eq('id', userToToggle.id);

    if (error) {
      toast({
        title: "Error updating user status",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `User ${userToToggle.is_enabled ? 'disabled' : 'enabled'}.`,
      });
      fetchUsers(); // Refresh the list
    }
  };

  const handleDeleteUser = async (userToDelete: Profile) => {
    if (userToDelete.id === user?.id) {
      toast({
        title: "Action Denied",
        description: "You cannot delete your own account.",
        variant: "destructive",
      });
      return;
    }

    // Check for active/future bookings before deleting
    const { count: activeBookingsCount, error: bookingsError } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userToDelete.id)
      .gte('end_time', new Date().toISOString())
      .neq('status', 'rejected')
      .neq('status', 'cancelled');

    if (bookingsError) {
      toast({
        title: "Error checking bookings",
        description: bookingsError.message,
        variant: "destructive",
      });
      return;
    }

    if (activeBookingsCount && activeBookingsCount > 0) {
      toast({
        title: "Deletion Denied",
        description: "Cannot delete user with active or future bookings. Please cancel their bookings first.",
        variant: "destructive",
      });
      return;
    }

    // Delete user from auth.users and profiles table will cascade
    const { error: authError } = await supabase.auth.admin.deleteUser(userToDelete.id);

    if (authError) {
      toast({
        title: "Error deleting user",
        description: authError.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "User account and profile deleted.",
      });
      fetchUsers(); // Refresh the list
    }
  };

  if (loading || isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-50">Loading...</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Checking authentication status and fetching user data.
          </p>
        </div>
      </div>
    );
  }

  if (!user || user.user_metadata?.role !== 'admin') {
    return null; // Redirect handled by useEffect
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <TopBar />
      <div className="flex flex-1"> {/* This div now contains Sidebar and main content */}
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">User Management</h1>
            <Button onClick={handleAddUserClick}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New User
            </Button>
          </div>

          <div className="flex space-x-4 mb-4">
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select onValueChange={setFilterRole} value={filterRole}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">General User</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => fetchUsers()}>Apply Filters</Button>
          </div>

          <UserTable
            users={users}
            onEdit={handleEditUser}
            onToggleEnable={handleToggleEnable}
            onDelete={handleDeleteUser}
            currentUser={user}
          />

          <div className="flex justify-between items-center mt-4">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              variant="outline"
            >
              Previous
            </Button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              variant="outline"
            >
              Next
            </Button>
          </div>
        </main>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default UserManagementPage;