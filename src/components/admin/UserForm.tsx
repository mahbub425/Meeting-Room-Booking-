import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Profile } from "@/types";
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(100, "Name must be at most 100 characters.").regex(/^[a-zA-Z\s]+$/, "Name must contain only alphabetic characters and spaces."),
  pin: z.string().regex(/^\d+$/, "PIN must contain only digits and cannot be empty."),
  phone: z.string().regex(/^\+?\d{10,15}$/, "Phone number must be 10-15 digits long and numeric (e.g., +8801712345678).").optional().or(z.literal("")),
  email: z.string().email("Invalid email format.").regex(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "Invalid email format."),
  password: z.string().min(6, "Password must be at least 6 characters.").optional().or(z.literal("")), // Optional for edit, required for new
  role: z.enum(["user", "admin"]).default("user"),
  department: z.string().max(50, "Department must be at most 50 characters.").optional().or(z.literal("")),
  designation: z.string().max(50, "Designation must be at most 50 characters.").optional().or(z.literal("")),
  is_enabled: z.boolean().default(true),
  category_access: z.array(z.string()).optional(), // Array of category IDs
  username: z.string().max(50, "Username must be at most 50 characters.").optional().or(z.literal("")), // New: username field
}).superRefine((data, ctx) => {
  if (!data.password && !data.email && !data.pin && !data.username && !initialData) { // Only for new user, if no initialData
    if (!data.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password is required for new users.",
        path: ["password"],
      });
    }
  }
  if (data.role === 'admin' && !data.username) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Username is required for admin users.",
      path: ["username"],
    });
  }
});

type UserFormValues = z.infer<typeof formSchema>;

interface UserFormProps {
  initialData?: Profile | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const departments = [
  "Human Resource Management", "Software Development", "Business Development",
  "Software Quality Assurance", "Operations & Management", "UI & Graphics Design",
  "TechCare", "Requirement Analysis & UX Design", "Top Management",
  "DevOps & Network", "Finance & Accounts", "Internal Audit",
  "Graphics & Creative", "Organization Development", "IT & Hardware",
  "Legal & Compliance", "Operations (Asset Management)",
];

export const UserForm: React.FC<UserFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      pin: initialData?.pin || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      password: "", // Password is never pre-filled for security
      role: initialData?.role || "user",
      department: initialData?.department || "",
      designation: initialData?.designation || "",
      is_enabled: initialData?.is_enabled ?? true,
      category_access: initialData?.category_access || [],
      username: initialData?.username || "", // Set default for username
    },
  });

  const userRole = form.watch("role");

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('meeting_room_categories')
        .select('id, name')
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
    };
    fetchCategories();
  }, [toast]);

  const onSubmit = async (values: UserFormValues) => {
    try {
      if (initialData) {
        // Update existing user
        // Check if PIN is changed and if user has active bookings
        if (initialData.pin !== values.pin) {
          const { count: activeBookingsCount, error: bookingsError } = await supabase
            .from('bookings')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', initialData.id)
            .gte('end_time', new Date().toISOString())
            .neq('status', 'rejected')
            .neq('status', 'cancelled');

          if (bookingsError) throw bookingsError;

          if (activeBookingsCount && activeBookingsCount > 0) {
            throw new Error("Cannot change PIN for a user with active or future bookings.");
          }
        }

        // Check if username is changed and if it's unique
        if (values.username && initialData.username !== values.username) {
          const { data: existingUser, error: usernameCheckError } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', values.username)
            .neq('id', initialData.id)
            .single();
          if (usernameCheckError && usernameCheckError.code !== 'PGRST116') throw usernameCheckError;
          if (existingUser) throw new Error("Username already exists. Please choose a different one.");
        }

        // Update auth.users table (email and password)
        const authUpdateData: { email?: string; password?: string; data?: object } = {
          data: {
            name: values.name,
            pin: values.pin,
            phone: values.phone,
            department: values.department,
            designation: values.designation,
            role: values.role, // Update role in user_metadata
            username: values.username || null, // Update username in user_metadata
          }
        };
        if (initialData.email !== values.email) {
          authUpdateData.email = values.email;
        }
        if (values.password) {
          authUpdateData.password = values.password;
        }

        const { error: authError } = await supabase.auth.admin.updateUserById(initialData.id, authUpdateData);
        if (authError) throw authError;

        // Update public.profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            name: values.name,
            pin: values.pin,
            phone: values.phone,
            email: values.email,
            department: values.department,
            designation: values.designation,
            role: values.role,
            is_enabled: values.is_enabled,
            category_access: values.category_access,
            username: values.username || null, // Update username in profiles table
          })
          .eq('id', initialData.id);

        if (profileError) throw profileError;

      } else {
        // Create new user
        // Check if username is unique for new user
        if (values.username) {
          const { data: existingUser, error: usernameCheckError } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', values.username)
            .single();
          if (usernameCheckError && usernameCheckError.code !== 'PGRST116') throw usernameCheckError;
          if (existingUser) throw new Error("Username already exists. Please choose a different one.");
        }

        const { data: userResponse, error: authError } = await supabase.auth.admin.createUser({
          email: values.email,
          password: values.password,
          email_confirm: true, // Automatically confirm email for admin-created users
          user_metadata: {
            name: values.name,
            pin: values.pin,
            phone: values.phone,
            department: values.department,
            designation: values.designation,
            role: values.role,
            username: values.username || null, // Pass username to user_metadata
          },
        });

        if (authError) throw authError;

        // Insert into public.profiles table (handle_new_user trigger might do this, but explicitly for admin-created)
        // The handle_new_user trigger is set up to insert into profiles on auth.users INSERT.
        // So, we only need to update the additional fields like is_enabled and category_access here.
        // Or, if the trigger doesn't set all fields, we can insert/upsert here.
        // For now, assuming trigger handles basic profile creation, and we update additional fields.
        const { error: profileInsertError } = await supabase
          .from('profiles')
          .update({
            is_enabled: values.is_enabled,
            category_access: values.category_access,
            role: values.role, // Ensure role is set correctly in profiles table
            username: values.username || null, // Ensure username is set correctly in profiles table
          })
          .eq('id', userResponse.user?.id);

        if (profileInsertError) throw profileInsertError;
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" type="text" {...form.register("name")} />
          {form.formState.errors.name && <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="pin">PIN</Label>
          <Input id="pin" type="text" {...form.register("pin")} disabled={!!initialData} /> {/* PIN not editable for existing users */}
          {form.formState.errors.pin && <p className="text-red-500 text-sm">{form.formState.errors.pin.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" type="text" placeholder="+8801712345678" {...form.register("phone")} />
          {form.formState.errors.phone && <p className="text-red-500 text-sm">{form.formState.errors.phone.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Work Email</Label>
          <Input id="email" type="email" {...form.register("email")} />
          {form.formState.errors.email && <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Department (Optional)</Label>
          <Select onValueChange={(value) => form.setValue("department", value)} value={form.watch("department")}>
            <SelectTrigger id="department">
              <SelectValue placeholder="Select a department" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.department && <p className="text-red-500 text-sm">{form.formState.errors.department.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="designation">Designation (Optional)</Label>
          <Input id="designation" type="text" {...form.register("designation")} />
          {form.formState.errors.designation && <p className="text-red-500 text-sm">{form.formState.errors.designation.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select onValueChange={(value) => form.setValue("role", value as "user" | "admin")} value={form.watch("role")}>
            <SelectTrigger id="role">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">General User</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.role && <p className="text-red-500 text-sm">{form.formState.errors.role.message}</p>}
        </div>
        {userRole === 'admin' && (
          <div className="space-y-2">
            <Label htmlFor="username">Username (for Admin Login)</Label>
            <Input id="username" type="text" {...form.register("username")} />
            {form.formState.errors.username && <p className="text-red-500 text-sm">{form.formState.errors.username.message}</p>}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="password">{initialData ? "New Password (Optional)" : "Password"}</Label>
          <Input id="password" type="password" {...form.register("password")} />
          {form.formState.errors.password && <p className="text-red-500 text-sm">{form.formState.errors.password.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Approved Meeting Room Categories</Label>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${category.id}`}
                checked={form.watch("category_access")?.includes(category.id)}
                onCheckedChange={(checked) => {
                  const currentCategories = form.getValues("category_access") || [];
                  if (checked) {
                    form.setValue("category_access", [...currentCategories, category.id]);
                  } else {
                    form.setValue("category_access", currentCategories.filter((id) => id !== category.id));
                  }
                }}
              />
              <Label htmlFor={`category-${category.id}`}>{category.name}</Label>
            </div>
          ))}
        </div>
        {form.formState.errors.category_access && <p className="text-red-500 text-sm">{form.formState.errors.category_access.message}</p>}
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
          {form.formState.isSubmitting ? (initialData ? "Updating..." : "Adding...") : (initialData ? "Update User" : "Add User")}
        </Button>
      </div>
    </form>
  );
};