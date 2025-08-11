import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MeetingRoom } from "@/pages/admin/MeetingRoomManagementPage";

const formSchema = z.object({
  name: z.string().min(1, "Room name is required.").max(50, "Room name must be at most 50 characters."),
  capacity: z.preprocess(
    (val) => (val === "" ? null : Number(val)),
    z.number().int().min(1, "Capacity must be at least 1.").nullable().optional(),
  ),
  facilities: z.string().max(500, "Facilities description must be at most 500 characters.").optional().or(z.literal("")),
  available_time_limit: z.string().max(50, "Time limit must be at most 50 characters.").optional().or(z.literal("")),
  image_url: z.string().url("Invalid URL format.").optional().or(z.literal("")),
  is_enabled: z.boolean().default(true),
});

type MeetingRoomFormValues = z.infer<typeof formSchema>;

interface MeetingRoomFormProps {
  initialData?: MeetingRoom | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const MeetingRoomForm: React.FC<MeetingRoomFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const { toast } = useToast();
  const form = useForm<MeetingRoomFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      capacity: initialData?.capacity || undefined,
      facilities: initialData?.facilities || "",
      available_time_limit: initialData?.available_time_limit || "",
      image_url: initialData?.image_url || "",
      is_enabled: initialData?.is_enabled ?? true,
    },
  });

  const onSubmit = async (values: MeetingRoomFormValues) => {
    try {
      if (initialData) {
        // Update existing room
        const { error } = await supabase
          .from('meeting_rooms')
          .update({
            name: values.name,
            capacity: values.capacity,
            facilities: values.facilities,
            available_time_limit: values.available_time_limit,
            image_url: values.image_url,
            is_enabled: values.is_enabled,
          })
          .eq('id', initialData.id);

        if (error) throw error;
      } else {
        // Create new room
        const { error } = await supabase
          .from('meeting_rooms')
          .insert({
            name: values.name,
            capacity: values.capacity,
            facilities: values.facilities,
            available_time_limit: values.available_time_limit,
            image_url: values.image_url,
            is_enabled: values.is_enabled,
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
        <Label htmlFor="name">Room Name</Label>
        <Input id="name" {...form.register("name")} />
        {form.formState.errors.name && <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="capacity">Capacity</Label>
        <Input id="capacity" type="number" {...form.register("capacity")} />
        {form.formState.errors.capacity && <p className="text-red-500 text-sm">{form.formState.errors.capacity.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="facilities">Facilities (e.g., Projector, Whiteboard)</Label>
        <Textarea id="facilities" {...form.register("facilities")} />
        {form.formState.errors.facilities && <p className="text-red-500 text-sm">{form.formState.errors.facilities.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="available_time_limit">Available Time Limit (e.g., 09:00-17:00)</Label>
        <Input id="available_time_limit" {...form.register("available_time_limit")} />
        {form.formState.errors.available_time_limit && <p className="text-red-500 text-sm">{form.formState.errors.available_time_limit.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="image_url">Image URL (Optional)</Label>
        <Input id="image_url" type="url" {...form.register("image_url")} />
        {form.formState.errors.image_url && <p className="text-red-500 text-sm">{form.formState.errors.image_url.message}</p>}
      </div>
      <div className="flex items-center space-x-2">
        <Switch
          id="is_enabled"
          checked={form.watch("is_enabled")}
          onCheckedChange={(checked) => form.setValue("is_enabled", checked)}
        />
        <Label htmlFor="is_enabled">Enabled</Label>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (initialData ? "Updating..." : "Adding...") : (initialData ? "Update Room" : "Add Room")}
        </Button>
      </div>
    </form>
  );
};