import React, { useEffect, useState } from "react";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { TopBar } from "@/components/TopBar";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSession } from "@/components/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";

const organizationSettingsSchema = z.object({
  organization_name: z.string().min(1, "Organization name is required.").max(100, "Name must be at most 100 characters."),
  default_language: z.enum(["English", "Bengali"]).default("English"),
  default_week_start_day: z.enum(["Sunday", "Monday"]).default("Sunday"),
  default_time_format: z.enum(["12-hour", "24-hour"]).default("24-hour"),
  office_hours: z.string().optional().or(z.literal("")),
  time_zone: z.string().optional().or(z.literal("")),
  personal_calendar_link: z.string().url("Invalid URL format.").optional().or(z.literal("")),
  auto_permission_categories: z.string().optional().or(z.literal("")), // Comma-separated string for now
  show_spot_image: z.boolean().default(true),
  limited_booking_time: z.boolean().default(false),
});

type OrganizationSettingsFormValues = z.infer<typeof organizationSettingsSchema>;

const ORGANIZATION_SETTINGS_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // Fixed UUID for the single settings row

const OrganizationProfilePage = () => {
  const { user, loading } = useSession();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [settingsLoading, setSettingsLoading] = useState(true);

  const form = useForm<OrganizationSettingsFormValues>({
    resolver: zodResolver(organizationSettingsSchema),
    defaultValues: {
      organization_name: "",
      default_language: "English",
      default_week_start_day: "Sunday",
      default_time_format: "24-hour",
      office_hours: "",
      time_zone: "",
      personal_calendar_link: "",
      auto_permission_categories: "",
      show_spot_image: true,
      limited_booking_time: false,
    },
  });

  useEffect(() => {
    const fetchSettingsAndCheckRole = async () => {
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

        const { data, error } = await supabase
          .from('organization_settings')
          .select('*')
          .eq('id', ORGANIZATION_SETTINGS_ID)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
          toast({
            title: "Error fetching organization settings",
            description: error.message,
            variant: "destructive",
          });
        } else if (data) {
          form.reset({
            organization_name: data.organization_name || "",
            default_language: data.default_language || "English",
            default_week_start_day: data.default_week_start_day || "Sunday",
            default_time_format: data.default_time_format || "24-hour",
            office_hours: data.office_hours || "",
            time_zone: data.time_zone || "",
            personal_calendar_link: data.personal_calendar_link || "",
            auto_permission_categories: data.auto_permission_categories?.join(", ") || "",
            show_spot_image: data.show_spot_image ?? true,
            limited_booking_time: data.limited_booking_time ?? false,
          });
        }
      } else if (!loading && !user) {
        navigate("/login"); // Redirect unauthenticated
      }
      setSettingsLoading(false);
    };

    fetchSettingsAndCheckRole();
  }, [user, loading, navigate, form, toast]);

  const onSubmit = async (values: OrganizationSettingsFormValues) => {
    try {
      const { error } = await supabase
        .from('organization_settings')
        .upsert({
          id: ORGANIZATION_SETTINGS_ID,
          organization_name: values.organization_name,
          default_language: values.default_language,
          default_week_start_day: values.default_week_start_day,
          default_time_format: values.default_time_format,
          office_hours: values.office_hours || null,
          time_zone: values.time_zone || null,
          personal_calendar_link: values.personal_calendar_link || null,
          auto_permission_categories: values.auto_permission_categories ? values.auto_permission_categories.split(',').map(s => s.trim()) : null,
          show_spot_image: values.show_spot_image,
          limited_booking_time: values.limited_booking_time,
        }, { onConflict: 'id' });

      if (error) throw error;

      toast({
        title: "Settings Updated",
        description: "Organization settings have been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  if (loading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-50">Loading...</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Fetching organization settings.
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
          <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-50">Organization Settings</h1>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>General Organization Settings</CardTitle>
              <CardDescription>Configure global settings for your organization.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="organization_name">Organization Name</Label>
                    <Input id="organization_name" {...form.register("organization_name")} />
                    {form.formState.errors.organization_name && <p className="text-red-500 text-sm">{form.formState.errors.organization_name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="default_language">Default Language</Label>
                    <Select onValueChange={(value) => form.setValue("default_language", value as "English" | "Bengali")} value={form.watch("default_language")}>
                      <SelectTrigger id="default_language">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Bengali">Bengali</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.default_language && <p className="text-red-500 text-sm">{form.formState.errors.default_language.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="default_week_start_day">Default Week Start Day</Label>
                    <Select onValueChange={(value) => form.setValue("default_week_start_day", value as "Sunday" | "Monday")} value={form.watch("default_week_start_day")}>
                      <SelectTrigger id="default_week_start_day">
                        <SelectValue placeholder="Select week start day" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sunday">Sunday</SelectItem>
                        <SelectItem value="Monday">Monday</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.default_week_start_day && <p className="text-red-500 text-sm">{form.formState.errors.default_week_start_day.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="default_time_format">Default Time Format</Label>
                    <Select onValueChange={(value) => form.setValue("default_time_format", value as "12-hour" | "24-hour")} value={form.watch("default_time_format")}>
                      <SelectTrigger id="default_time_format">
                        <SelectValue placeholder="Select time format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12-hour">12-hour (AM/PM)</SelectItem>
                        <SelectItem value="24-hour">24-hour</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.formState.errors.default_time_format && <p className="text-red-500 text-sm">{form.formState.errors.default_time_format.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="office_hours">Office Hours (e.g., 09:00-17:00)</Label>
                    <Input id="office_hours" {...form.register("office_hours")} placeholder="09:00-17:00" />
                    {form.formState.errors.office_hours && <p className="text-red-500 text-sm">{form.formState.errors.office_hours.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time_zone">Time Zone (e.g., Asia/Dhaka)</Label>
                    <Input id="time_zone" {...form.register("time_zone")} placeholder="Asia/Dhaka" />
                    {form.formState.errors.time_zone && <p className="text-red-500 text-sm">{form.formState.errors.time_zone.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="personal_calendar_link">Personal Calendar Link (Optional URL)</Label>
                    <Input id="personal_calendar_link" type="url" {...form.register("personal_calendar_link")} placeholder="https://calendar.example.com" />
                    {form.formState.errors.personal_calendar_link && <p className="text-red-500 text-sm">{form.formState.errors.personal_calendar_link.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="auto_permission_categories">Auto-Permission Categories (comma-separated)</Label>
                    <Input id="auto_permission_categories" {...form.register("auto_permission_categories")} placeholder="Category A, Category B" />
                    {form.formState.errors.auto_permission_categories && <p className="text-red-500 text-sm">{form.formState.errors.auto_permission_categories.message}</p>}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show_spot_image"
                    checked={form.watch("show_spot_image")}
                    onCheckedChange={(checked) => form.setValue("show_spot_image", checked)}
                  />
                  <Label htmlFor="show_spot_image">Show Spot Image</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="limited_booking_time"
                    checked={form.watch("limited_booking_time")}
                    onCheckedChange={(checked) => form.setValue("limited_booking_time", checked)}
                  />
                  <Label htmlFor="limited_booking_time">Limited Booking Time</Label>
                </div>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </main>
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default OrganizationProfilePage;