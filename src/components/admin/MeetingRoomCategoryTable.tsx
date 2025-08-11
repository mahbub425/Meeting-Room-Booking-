import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { MeetingRoomCategory } from "@/pages/admin/MeetingRoomCategoryManagementPage";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MeetingRoomCategoryTableProps {
  categories: MeetingRoomCategory[];
  onEdit: (category: MeetingRoomCategory) => void;
  onDelete: (id: string) => void;
}

export const MeetingRoomCategoryTable: React.FC<MeetingRoomCategoryTableProps> = ({ categories, onEdit, onDelete }) => {
  const { toast } = useToast();
  const [managers, setManagers] = React.useState<Map<string, string>>(new Map());

  React.useEffect(() => {
    const fetchManagers = async () => {
      const managerIds = Array.from(new Set(categories.map(cat => cat.manager_id).filter(Boolean) as string[]));
      if (managerIds.length === 0) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', managerIds);

      if (error) {
        toast({
          title: "Error fetching managers",
          description: error.message,
          variant: "destructive",
        });
      } else {
        const newManagers = new Map(data.map(profile => [profile.id, profile.name]));
        setManagers(newManagers);
      }
    };
    fetchManagers();
  }, [categories, toast]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Manager</TableHead>
          <TableHead>Color</TableHead>
          <TableHead>Public Bookings</TableHead>
          <TableHead>Approval Required</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-4 text-gray-500">
              No meeting room categories found.
            </TableCell>
          </TableRow>
        ) : (
          categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell className="font-medium">{category.name}</TableCell>
              <TableCell>{category.manager_id ? (managers.get(category.manager_id) || "Loading...") : "N/A"}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: category.color || '#ccc' }}></span>
                  {category.color || "N/A"}
                </div>
              </TableCell>
              <TableCell>{category.allow_public_bookings ? "Yes" : "No"}</TableCell>
              <TableCell>{category.approval_required ? "Yes" : "No"}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(category)}>Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(category.id)} className="text-red-600">Delete</DropdownMenuItem>
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