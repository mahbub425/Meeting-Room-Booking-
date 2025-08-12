import React from "react";
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
import { useEffect, useState } from "react";
import { MeetingRoomCategory } from "@/pages/admin/MeetingRoomCategoryManagementPage"; // Import MeetingRoomCategory

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(100, "Name must be at most 100 characters.").regex(/^[a-zA-Z\s]+$/, "Name must contain only alphabetic characters and spaces."),
  phone: z.string().regex(/^\+?\d{10,15}$/, "Phone number must be 10-15 digits long and numeric (e.g., +8801712345678).").optional().or(z.literal("")),
  email: z.string().email("Invalid email format.").regex(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "Invalid email format."),
  department: z.string().max(50, "Department must be at most 50 characters.").optional().or(z.literal("")),
  designation: z.string().max(50, "Designation must be at most 50 characters.").optional().or(z.literal("")),
  language: z.string().optional().or(z.literal("")),
  time_format: z.enum(["12-hour", "24-hour"]).optional(),
  week_start_day: z.enum(["Sunday", "Monday"]).optional(),
  notification_preference: z.boolean().default(true),
  category_access: z.array(z.string()).optional(), // Added for display
  is_enabled: z.boolean().default(true), // Added for display
  username: z.string().optional().or(z.literal("")), // Added for display
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(6, "New password must be at least 6 characters."),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords do not match.",
  path: ["confirmNewPassword"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

const departments = [
  "Human Resource Management", "Software Development", "Business Development",
  "Software Quality Assurance", "Operations & Management", "UI & Graphics Design",
  "TechCare", "Requirement Analysis & UX Design", "Top Management",
  "DevOps & Network", "Finance & Accounts", "Internal Audit",
  "Graphics & Creative", "Organization Development", "IT & Hardware",
  "Legal & Compliance", "Operations (Asset Management)",
];

const ProfilePage = () => {
  const { user, loading } = useSession();
  const { toast } = useToast();
  const [profileLoading, setProfileLoading] = useState(true);
  const [categories, setCategories] = useState<MeetingRoomCategory[]>([]); // State to store categories

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      department: "",
      designation: "",
      language: "English", // Default value
      time_format: "24-hour", // Default value
      week_start_day: "Sunday", // Default value
      notification_preference: true, // Default value
      category_access: [],
      is_enabled: true,
      username: "", // Default value
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  useEffect(() => {
    const fetchProfileAndCategories = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          toast({
            title: "Error fetching profile",
            description: error.message,
            variant: "destructive",
          });
        } else if (data) {
          profileForm.reset({
            name: data.name || "",
            phone: data.phone || "",
            email: data.email || "",
            department: data.department || "",
            designation: data.designation || "",
            language: data.language || "English",
            time_format: data.time_format || "24-hour",
            week_start_day: data.week_start_day || "Sunday",
            notification_preference: data.notification_preference ?? true,
            category_access: data.category_access || [],
            is_enabled: data.is_enabled ?? true,
            username: data.username || "", // Set username
          });
        }

        const { data: categoriesData, error: categoriesError } = await supabase
          .from('meeting_room_categories')
          .select('id, name')
          .order('name', { ascending: true });

        if (categoriesError) {
          toast({
            title: "Error fetching categories",
            description: categoriesError.message,
            variant: "destructive",
          });
          setCategories([]);
        } else {
          setCategories(categoriesData as MeetingRoomCategory[] || []); // Cast data to MeetingRoomCategory[]
        }
      }
      setProfileLoading(false);
    };

    if (!loading) {
      fetchProfileAndCategories();
    }
  }, [user, loading, profileForm, toast]);

  const onProfileSubmit = async (values: ProfileFormValues) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: values.name,
          phone: values.phone,
          email: values.email,
          department: values.department,
          designation: values.designation,
          language: values.language,
          time_format: values.time_format,
          week_start_day: values.week_start_day,
          notification_preference: values.notification_preference,
          // category_access and is_enabled are not editable by user on this page
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;

      // Also update auth.users email if it changed
      if (user?.email !== values.email) {
        const { error: authUpdateError } = await supabase.auth.updateUser({ email: values.email });
        if (authUpdateError) throw authUpdateError;
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Profile Update Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const onPasswordSubmit = async (values: PasswordFormValues) => {
    try {
      // Supabase does not directly support changing password with current password validation on client-side.
      // This would typically involve a server-side function or a password reset flow.
      // For this FRS, we'll assume the `updateUser` function is sufficient for a logged-in user.
      // A more robust solution would involve re-authentication or a serverless function.
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed.",
      });
      passwordForm.reset(); // Clear password fields
    } catch (error: any) {
      toast({
        title: "Password Change Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-50">Loading...</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Fetching profile data.
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirect handled by SessionContextProvider
  }

  const categoryNames = profileForm.watch("category_access")
    ?.map(id => categories.find(cat => cat.id === id)?.name)
    .filter(Boolean)
    .join(", ") || "None";

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <TopBar />
        <main className="flex-1 p-6">
          <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-50">Profile Settings</h1>

          {/* Personal Information Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" type="text" {...profileForm.register("name")} />
                    {profileForm.formState.errors.name && <p className="text-red-500 text-sm">{profileForm.formState.errors.name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="text" placeholder="+8801712345678" {...profileForm.register("phone")} />
                    {profileForm.formState.errors.phone && <p className="text-red-500 text-sm">{profileForm.formState.errors.phone.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Work Email</Label>
                    <Input id="email" type="email" {...profileForm.register("email")} disabled /> {/* Email is usually not editable directly here */}
                    {profileForm.formState.errors.email && <p className="text-red-500 text-sm">{profileForm.formState.errors.email.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select onValueChange={(value) => profileForm.setValue("department", value)} value={profileForm.watch("department")}>
                      <SelectTrigger id="department">
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {profileForm.formState.errors.department && <p className="text-red-500 text-sm">{profileForm.formState.errors.department.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation</Label>
                    <Input id="designation" type="text" {...profileForm.register("designation")} />
                    {profileForm.formState.errors.designation && <p className="text-red-500 text-sm">{profileForm.formState.errors.designation.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select onValueChange={(value) => profileForm.setValue("language", value as "English" | "Bengali")} value={profileForm.watch("language")}>
                      <SelectTrigger id="language">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Bengali">Bengali</SelectItem>
                      </SelectContent>
                    </Select>
                    {profileForm.formState.errors.language && <p className="text-red-500 text-sm">{profileForm.formState.errors.language.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time_format">Time Format</Label>
                    <Select onValueChange={(value) => profileForm.setValue("time_format", value as "12-hour" | "24-hour")} value={profileForm.watch("time_format")}>
                      <SelectTrigger id="time_format">
                        <SelectValue placeholder="Select time format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12-hour">12-hour (AM/PM)</SelectItem>
                        <SelectItem value="24-hour">24-hour</SelectItem>
                      </SelectContent>
                    </Select>
                    {profileForm.formState.errors.time_format && <p className="text-red-500 text-sm">{profileForm.formState.errors.time_format.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="week_start_day">Week Start Day</Label>
                    <Select onValueChange={(value) => profileForm.setValue("week_start_day", value as "Sunday" | "Monday")} value={profileForm.watch("week_start_day")}>
                      <SelectTrigger id="week_start_day">
                        <SelectValue placeholder="Select week start day" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sunday">Sunday</SelectItem>
                        <SelectItem value="Monday">Monday</SelectItem>
                      </SelectContent>
                    </Select>
                    {profileForm.formState.errors.week_start_day && <p className="text-red-500 text-sm">{profileForm.formState.errors.week_start_day.message}</p>}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="notification_preference"
                    checked={profileForm.watch("notification_preference")}
                    onCheckedChange={(checked) => profileForm.setValue("notification_preference", checked)}
                  />
                  <Label htmlFor="notification_preference">Receive Email Notifications</Label>
                </div>
                {/* Display Category Access and Account Status */}
                <div className="space-y-2">
                  <Label>Approved Meeting Room Categories</Label>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {categoryNames}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Account Status</Label>
                  <p className={`text-sm font-semibold ${profileForm.watch("is_enabled") ? "text-green-600" : "text-red-600"}`}>
                    {profileForm.watch("is_enabled") ? "Active" : "Disabled"}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {profileForm.watch("username") || "N/A"}
                  </p>
                </div>
                <Button type="submit" disabled={profileForm.formState.isSubmitting}>
                  {profileForm.formState.isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Change Password Card */}
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your account password.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" {...passwordForm.register("currentPassword")} />
                  {passwordForm.formState.errors.currentPassword && <p className="text-red-500 text-sm">{passwordForm.formState.errors.currentPassword.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" {...passwordForm.register("newPassword")} />
                  {passwordForm.formState.errors.newPassword && <p className="text-red-500 text-sm">{passwordForm.formState.errors.newPassword.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                  <Input id="confirm-new-password" type="password" {...passwordForm.register("confirmNewPassword")} />
                  {passwordForm.formState.errors.confirmNewPassword && <p className="text-red-500 text-sm">{passwordForm.formState.errors.confirmNewPassword.message}</p>}
                </div>
                <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                  {passwordForm.formState.isSubmitting ? "Changing..." : "Change Password"}
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

export default ProfilePage;