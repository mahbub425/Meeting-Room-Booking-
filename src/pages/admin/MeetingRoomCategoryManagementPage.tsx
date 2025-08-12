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
import { MeetingRoomCategoryTable } from "@/components/admin/MeetingRoomCategoryTable";
import { MeetingRoomCategoryForm } from "@/components/admin/MeetingRoomCategoryForm";
import { Profile } from "@/types";

export interface MeetingRoomCategory {
  id: string;
  name: string;
  manager_id: string | null;
  color: string | null;
  allow_public_bookings: boolean;
  approval_required: boolean;
  created_at: string;
  updated_at: string;
}

const MeetingRoomCategoryManagementPage = () => {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MeetingRoomCategory | null>(null);
  const [categories, setCategories] = useState<MeetingRoomCategory[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const fetchUserRoleAndCategories = async () => {
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
        fetchCategories();
      } else if (!loading && !user) {
        navigate("/login"); // Redirect unauthenticated
      }
    };

    fetchUserRoleAndCategories();
  }, [user, loading, navigate]);

  const fetchCategories = async () => {
    setIsFetching(true);
    const { data, error } = await supabase
      .from('meeting_room_categories')
      .select('*')
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
    setIsFetching(false);
  };

  const handleAddCategoryClick = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  const handleEditCategory = (category: MeetingRoomCategory) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchCategories(); // Refresh the list
    toast({
      title: "Success",
      description: editingCategory ? "Category updated." : "Category created.",
    });
  };

  const handleDeleteCategory = async (id: string) => {
    // Check if any rooms are associated with this category before deleting
    const { count: roomsCount, error: roomsError } = await supabase
      .from('meeting_rooms')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', id);

    if (roomsError) {
      toast({
        title: "Error checking rooms",
        description: roomsError.message,
        variant: "destructive",
      });
      return;
    }

    if (roomsCount && roomsCount > 0) {
      toast({
        title: "Deletion Denied",
        description: "Cannot delete category with associated meeting rooms. Please reassign or delete rooms first.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('meeting_room_categories')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error deleting category",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Category deleted.",
      });
      fetchCategories(); // Refresh the list
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
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <TopBar />
      <div className="flex flex-1"> {/* This div now contains Sidebar and main content */}
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Meeting Room Categories</h1>
            <Button onClick={handleAddCategoryClick}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Category
            </Button>
          </div>
          <MeetingRoomCategoryTable
            categories={categories}
            onEdit={handleEditCategory}
            onDelete={handleDeleteCategory}
          />
        </main>
      </div>
      <MadeWithDyad />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Meeting Room Category" : "Add New Meeting Room Category"}</DialogTitle>
            <DialogDescription>
              {editingCategory ? "Modify the details of the meeting room category." : "Fill in the details for the new meeting room category."}
            </DialogDescription>
          </DialogHeader>
          <MeetingRoomCategoryForm
            initialData={editingCategory}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MeetingRoomCategoryManagementPage;