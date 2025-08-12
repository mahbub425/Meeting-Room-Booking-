import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MeetingRoomCategory } from "@/pages/admin/MeetingRoomCategoryManagementPage";
import { Profile } from "@/types";

// Define a simpler type for admin profiles used in selects
interface SimpleProfile {
  id: string;
  name: string;
}

const formSchema = z.object({
  name: z.string().min(1, "Category name is required.").max(50, "Category name must be at most 50 characters."),
  manager_id: z.string().nullable().optional(),
  color: z.string().optional().or(z.literal("")),
  allow_public_bookings: z.boolean().default(false),
  approval_required: z.boolean().default(true),
});

type MeetingRoomCategoryFormValues = z.infer<typeof formSchema>;

interface MeetingRoomCategoryFormProps {
  initialData?: MeetingRoomCategory | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const MeetingRoomCategoryForm: React.FC<MeetingRoomCategoryFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<SimpleProfile[]>([]); // Use SimpleProfile type

  const form = useForm<MeetingRoomCategoryFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      manager_id: initialData?.manager_id || null,
      color: initialData?.color || "",
      allow_public_bookings: initialData?.allow_public_bookings ?? false,
      approval_required: initialData?.approval_required ?? true,
    },
  });

  useEffect(() => {
    const fetchAdmins = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'admin')
        .order('name', { ascending: true });

      if (error) {
        toast({
          title: "Error fetching admins",
          description: error.message,
          variant: "destructive",
        });
        setAdmins([]);
      } else {
        setAdmins(data as SimpleProfile[] || []); // Cast data to SimpleProfile[]
      }
    };
    fetchAdmins();
  }, [toast]);

  const onSubmit = async (values: MeetingRoomCategoryFormValues) => {
    try {
      if (initialData) {
        // Update existing category
        const { error } = await supabase
          .from('meeting_room_categories')
          .update({
            name: values.name,
            manager_id: values.manager_id,
            color: values.color || null,
            allow_public_bookings: values.allow_public_bookings,
            approval_required: values.approval_required,
          })
          .eq('id', initialData.id);

        if (error) throw error;
      } else {
        // Create new category
        const { error } = await supabase
          .from('meeting_room_categories')
          .insert({
            name: values.name,
            manager_id: values.manager_id,
            color: values.color || null,
            allow_public_bookings: values.allow_public_bookings,
            approval_required: values.approval_required,
          });

        if (error) throw error;
      }
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Operation Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4">
      <div className="space-y-2">
        <Label htmlFor="name">Category Name</Label>
        <Input id="name" {...form.register("name")} />
        {form.formState.errors.name && <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="manager_id">Category Manager (Optional)</Label>
        <Select onValueChange={(value) => form.setValue("manager_id", value === "" ? null : value)} value={form.watch("manager_id") || ""}>
          <SelectTrigger id="manager_id">
            <SelectValue placeholder="Select a manager" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            {admins.map((admin) => (
              <SelectItem key={admin.id} value={admin.id}>{admin.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.manager_id && <p className="text-red-500 text-sm">{form.formState.errors.manager_id.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="color">Category Color (e.g., #RRGGBB or 'blue')</Label>
        <Input id="color" type="text" {...form.register("color")} placeholder="#007bff or blue" />
        {form.formState.errors.color && <p className="text-red-500 text-sm">{form.formState.errors.color.message}</p>}
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="allow_public_bookings"
          checked={form.watch("allow_public_bookings")}
          onCheckedChange={(checked) => form.setValue("allow_public_bookings", checked)}
        />
        <Label htmlFor="allow_public_bookings">Allow Public Bookings</Label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="approval_required"
          checked={form.watch("approval_required")}
          onCheckedChange={(checked) => form.setValue("approval_required", checked)}
        />
        <Label htmlFor="approval_required">Approval Required</Label>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (initialData ? "Updating..." : "Adding...") : (initialData ? "Update Category" : "Add Category")}
        </Button>
      </div>
    </form>
  );
};