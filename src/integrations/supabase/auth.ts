import { supabase } from "@/integrations/supabase/client";
import { AuthError } from "@supabase/supabase-js";

export const signUp = async (data: {
  email: string;
  password: string;
  name: string;
  pin: string;
  phone: string;
  department?: string;
  designation?: string;
}) => {
  const { email, password, name, pin, phone, department, designation } = data;

  // Check for unique PIN before signup
  const { data: existingProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("pin", pin)
    .single();

  if (profileError && profileError.code !== 'PGRST116') { // PGRST116 means no rows found
    throw new Error(profileError.message);
  }
  if (existingProfile) {
    throw new Error("Employee PIN already exists.");
  }

  const { data: user, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        pin,
        phone,
        department,
        designation,
      },
    },
  });

  if (error) {
    throw error;
  }
  return user;
};

export const signInWithPassword = async (pin: string, password: string) => {
  // First, get the email associated with the PIN using the new RPC function
  const { data: emailData, error: rpcError } = await supabase.rpc('get_email_by_pin', { p_pin: pin });

  if (rpcError) {
    throw new AuthError("Invalid PIN or Password.", 400); // Generic error for security
  }

  const email = emailData as string | null;

  if (!email) {
    throw new AuthError("Invalid PIN or Password.", 400);
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password,
  });

  if (error) {
    throw error;
  }
  return data;
};

export const signInAdminWithEmailAndPassword = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  // After successful login, verify if the user is an admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user?.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    await supabase.auth.signOut(); // Sign out if not an admin
    throw new AuthError("Access Denied: Only administrators can log in here.", 403);
  }

  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
};

export const resetPasswordForEmail = async (emailOrPin: string) => {
  let emailToReset = emailOrPin;

  // If it looks like a PIN, try to get the email from the profiles table
  if (/^\d+$/.test(emailOrPin)) { // Updated PIN regex
    // Use the new RPC function to get email by PIN
    const { data: emailData, error: rpcError } = await supabase.rpc('get_email_by_pin', { p_pin: emailOrPin });

    if (rpcError) {
      throw new Error("Email or PIN not found.");
    }

    const fetchedEmail = emailData as string | null;

    if (fetchedEmail) {
      emailToReset = fetchedEmail;
    } else {
      throw new Error("Email or PIN not found.");
    }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(emailToReset, {
    redirectTo: `${window.location.origin}/force-password-reset`, // Redirect to force password reset page
  });

  if (error) {
    throw error;
  }
};

export const updateUserPassword = async (newPassword: string) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (error) {
    throw error;
  }
  return data;
};