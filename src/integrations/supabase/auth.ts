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

export const signInAdminWithEmailAndPassword = async (username: string, password: string) => {
  // First, get the email associated with the username using the new RPC function
  const { data: emailData, error: rpcError } = await supabase.rpc('get_email_by_username', { p_username: username });

  if (rpcError) {
    throw new AuthError("Invalid Username or Password.", 400); // Generic error for security
  }

  const email = emailData as string | null;

  if (!email) {
    throw new AuthError("Invalid Username or Password.", 400);
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
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

export const resetPasswordForEmail = async (identifier: string) => {
  let emailToReset: string | null = null;

  // 1. Try to resolve as username
  if (identifier) {
    const { data: emailByUsername, error: usernameRpcError } = await supabase.rpc('get_email_by_username', { p_username: identifier });
    if (!usernameRpcError && emailByUsername) {
      emailToReset = emailByUsername as string;
    }
  }

  // 2. If not found by username, try to resolve as PIN
  if (!emailToReset && /^\d+$/.test(identifier)) {
    const { data: emailByPin, error: pinRpcError } = await supabase.rpc('get_email_by_pin', { p_pin: identifier });
    if (!pinRpcError && emailByPin) {
      emailToReset = emailByPin as string;
    }
  }

  // 3. If not found by username or PIN, assume it's an email
  if (!emailToReset) {
    emailToReset = identifier;
  }

  if (!emailToReset) {
    throw new Error("Invalid identifier. Please provide a valid email, username, or PIN.");
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