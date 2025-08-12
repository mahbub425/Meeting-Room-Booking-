import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { signInWithPassword } from "@/integrations/supabase/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const loginFormSchema = z.object({
  pin: z.string().regex(/^\d+$/, "PIN must contain only digits and cannot be empty."),
  password: z.string().min(1, "Password is required."),
  rememberMe: z.boolean().default(false),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

const LoginPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      pin: "",
      password: "",
      rememberMe: false,
    },
  });

  const handleSubmit = async (values: LoginFormValues) => {
    try {
      await signInWithPassword(values.pin, values.password);
      toast({
        title: "Login Successful",
        description: "Welcome to your dashboard.",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid PIN or Password. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          {/* Placeholder for Logo */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">OnnoRokom Group</h1>
        </div>
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome Back!</CardTitle>
            <CardDescription>
              Please enter your credentials to login
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="pin">PIN</Label>
                <Input id="pin" type="text" placeholder="Your PIN" {...form.register("pin")} />
                {form.formState.errors.pin && <p className="text-red-500 text-sm">{form.formState.errors.pin.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Your password" {...form.register("password")} />
                {form.formState.errors.password && <p className="text-red-500 text-sm">{form.formState.errors.password.message}</p>}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" checked={form.watch("rememberMe")} onCheckedChange={(checked) => form.setValue("rememberMe", !!checked)} />
                  <Label htmlFor="remember">Remember me</Label>
                </div>
                <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:underline"> {/* Changed to text-blue-600 */}
                  Forgot Password?
                </Link>
              </div>
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Logging in..." : "Login"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm">
              <p>
                Don't have an account?{" "}
                <Link to="/register" className="font-medium text-blue-600 hover:underline"> {/* Changed to text-blue-600 */}
                  Register
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;