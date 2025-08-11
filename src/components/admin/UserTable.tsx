import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { Profile } from "@/types";
import { User } from "@supabase/supabase-js";

interface UserTableProps {
  users: Profile[];
  onEdit: (user: Profile) => void;
  onToggleEnable: (user: Profile) => void;
  onDelete: (user: Profile) => void;
  currentUser: User | null;
}

export const UserTable: React.FC<UserTableProps> = ({ users, onEdit, onToggleEnable, onDelete, currentUser }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>PIN</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Designation</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length === 0 ? (
          <TableRow>
            <TableCell colSpan={8} className="text-center py-4 text-gray-500">
              No users found.
            </TableCell>
          </TableRow>
        ) : (
          users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.pin}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>{user.department || "N/A"}</TableCell>
              <TableCell>{user.designation || "N/A"}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.is_enabled ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {user.is_enabled ? "Active" : "Disabled"}
                </span>
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
                    <DropdownMenuItem onClick={() => onEdit(user)}>Edit</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onToggleEnable(user)}>
                      {user.is_enabled ? "Disable User" : "Enable User"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(user)} className="text-red-600">Delete User</DropdownMenuItem>
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