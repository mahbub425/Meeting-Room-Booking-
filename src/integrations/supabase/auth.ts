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
  // First, get the email associated with the PIN
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("email")
    .eq("pin", pin)
    .single();

  if (profileError) {
    if (profileError.code === 'PGRST116') { // No rows found
      throw new AuthError("Invalid PIN or Password.", 400);
    }
    throw profileError;
  }

  if (!profile || !profile.email) {
    throw new AuthError("Invalid PIN or Password.", 400);
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password,
  });

  if (error) {
    throw error;
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
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email")
      .eq("pin", emailOrPin)
      .single();

    if (profileError) {
      if (profileError.code === 'PGRST116') { // No rows found
        throw new Error("Email or PIN not found.");
      }
      throw profileError;
    }
    if (profile && profile.email) {
      emailToReset = profile.email;
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