import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { signInAdminWithEmailAndPassword } from "@/integrations/supabase/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const adminLoginFormSchema = z.object({
  email: z.string().email("Invalid email format.").min(1, "Email is required."),
  password: z.string().min(1, "Password is required."),
});

type AdminLoginFormValues = z.infer<typeof adminLoginFormSchema>;

const AdminLoginPage = () => {
  const { toast } = useToast();

  const form = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSubmit = async (values: AdminLoginFormValues) => {
    try {
      await signInAdminWithEmailAndPassword(values.email, values.password);
      // Redirection is handled by SessionContextProvider
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials or not an admin. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Admin Login</CardTitle>
          <CardDescription className="text-center">
            Enter your admin email and password to access the admin panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email (Username)</Label>
              <Input id="email" type="email" placeholder="admin@example.com" {...form.register("email")} />
              {form.formState.errors.email && <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Your password" {...form.register("password")} />
              {form.formState.errors.password && <p className="text-red-500 text-sm">{form.formState.errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Logging in..." : "Login as Admin"}
            </Button>
            <div className="text-center text-sm mt-4">
              <Link to="/login" className="text-blue-600 hover:underline">
                Go to User Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLoginPage;