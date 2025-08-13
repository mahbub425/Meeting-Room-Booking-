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
import { signInAdminWithEmailAndPassword } from "@/integrations/supabase/auth";

const adminLoginFormSchema = z.object({
  username: z.string().min(1, "Username is required."),
  password: z.string().min(1, "Password is required."),
});

type AdminLoginFormValues = z.infer<typeof adminLoginFormSchema>;

const AdminLoginPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const handleSubmit = async (values: AdminLoginFormValues) => {
    try {
      await signInAdminWithEmailAndPassword(values.username, values.password);
      toast({
        title: "Admin Login Successful",
        description: "Welcome to the admin dashboard.",
      });
      navigate("/admin/analytics"); {/* Changed redirect to /admin/analytics */}
    } catch (error: any) {
      toast({
        title: "Admin Login Failed",
        description: error.message || "Invalid username or password, or you do not have admin privileges.",
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
            Enter your admin username and password to access the admin panel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" type="text" placeholder="admin_username" {...form.register("username")} />
              {form.formState.errors.username && <p className="text-red-500 text-sm">{form.formState.errors.username.message}</p>}
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