import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signUp } from "@/integrations/supabase/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define the schema for the registration form
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters.").max(100, "Name must be at most 100 characters.").regex(/^[a-zA-Z\s]+$/, "Name must contain only alphabetic characters and spaces."),
  pin: z.string().regex(/^\d+$/, "PIN must contain only digits and cannot be empty."), // Updated PIN regex
  phone: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits long and numeric (e.g., 1712345678)."), // Updated phone regex
  email: z.string().email("Invalid email format.").regex(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "Invalid email format."),
  password: z.string().min(6, "Password must be at least 6 characters.").regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>/?]).*$/, "Password must include uppercase, lowercase, number, and special character."),
  confirmPassword: z.string(),
  department: z.string().max(50, "Department must be at most 50 characters.").optional().or(z.literal("")),
  designation: z.string().max(50, "Designation must be at most 50 characters.").optional().or(z.literal("")),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
}).refine((data) => data.password !== data.pin, {
  message: "Password cannot be the same as PIN.",
  path: ["password"],
}).refine((data) => !data.password.includes(data.email), {
  message: "Password cannot contain your email.",
  path: ["password"],
});

type RegisterFormValues = z.infer<typeof formSchema>;

const departments = [
  "Human Resource Management",
  "Software Development",
  "Business Development",
  "Software Quality Assurance",
  "Operations & Management",
  "UI & Graphics Design",
  "TechCare",
  "Requirement Analysis & UX Design",
  "Top Management",
  "DevOps & Network",
  "Finance & Accounts",
  "Internal Audit",
  "Graphics & Creative",
  "Organization Development",
  "IT & Hardware",
  "Legal & Compliance",
  "Operations (Asset Management)",
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      pin: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
      department: "",
      designation: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      await signUp({
        email: values.email,
        password: values.password,
        name: values.name,
        pin: values.pin,
        phone: `+880${values.phone}`, // Prepend +880 here for submission
        department: values.department || undefined,
        designation: values.designation || undefined,
      });
      toast({
        title: "Registration Successful",
        description: "Please check your email for a confirmation link and then log in.",
      });
      navigate("/login");
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Register</CardTitle>
          <CardDescription className="text-center">
            Create your account to access the meeting booking system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" type="text" placeholder="John Doe" {...form.register("name")} />
                {form.formState.errors.name && <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin">PIN</Label>
                <Input id="pin" type="text" placeholder="Your PIN" {...form.register("pin")} />
                {form.formState.errors.pin && <p className="text-red-500 text-sm">{form.formState.errors.pin.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex items-center">
                  <span className="flex items-center h-10 px-3 rounded-l-md border border-r-0 bg-gray-50 text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                    +880
                  </span>
                  <Input
                    id="phone"
                    type="text"
                    placeholder="1712345678"
                    {...form.register("phone")} // No setValueAs, no custom onChange
                    className="rounded-l-none"
                  />
                </div>
                {form.formState.errors.phone && <p className="text-red-500 text-sm">{form.formState.errors.phone.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Work Email</Label>
                <Input id="email" type="email" placeholder="user@organization.com" {...form.register("email")} />
                {form.formState.errors.email && <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>}
              </div>
              {/* Department and Designation moved here */}
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
                <Input id="designation" type="text" placeholder="Software Engineer" {...form.register("designation")} />
                {form.formState.errors.designation && <p className="text-red-500 text-sm">{form.formState.errors.designation.message}</p>}
              </div>
              {/* Password fields */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...form.register("password")} />
                {form.formState.errors.password && <p className="text-red-500 text-sm">{form.formState.errors.password.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" {...form.register("confirmPassword")} />
                {form.formState.errors.confirmPassword && <p className="text-red-500 text-sm">{form.formState.errors.confirmPassword.message}</p>}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Registering..." : "Register"}
            </Button>
            <div className="text-center text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-600 hover:underline">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;