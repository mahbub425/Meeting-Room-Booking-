import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { useToast } from "@/hooks/use-toast";

interface SessionContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user || null);
      setLoading(false);

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        if (currentSession?.user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', currentSession.user.id)
            .single();

          if (error) {
            console.error("Error fetching user role:", error);
            if (["/login", "/register", "/forgot-password", "/admin"].includes(location.pathname)) {
              navigate("/dashboard");
            }
            toast({
              title: "Welcome!",
              description: "You have successfully logged in.",
            });
            return;
          }

          if (profile?.role === 'admin') {
            if (["/login", "/register", "/forgot-password", "/admin"].includes(location.pathname)) {
              navigate("/admin/dashboard");
            }
            toast({
              title: "Welcome, Admin!",
              description: "You have successfully logged in to the admin panel.",
            });
          } else {
            if (["/login", "/register", "/forgot-password", "/admin"].includes(location.pathname)) {
              navigate("/dashboard");
            }
            toast({
              title: "Welcome!",
              description: "You have successfully logged in.",
            });
          }
        }
      } else if (event === 'SIGNED_OUT') {
        if (!["/login", "/register", "/forgot-password", "/force-password-reset", "/admin"].includes(location.pathname)) {
          navigate("/login");
          toast({
            title: "Logged Out",
            description: "You have been logged out.",
          });
        }
      }
    });

    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user || null);
      setLoading(false);

      if (initialSession && initialSession.user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', initialSession.user.id)
          .single();

        if (error) {
          console.error("Error fetching initial user role:", error);
          if (["/login", "/register", "/forgot-password", "/admin"].includes(location.pathname)) {
            navigate("/dashboard");
          }
          return;
        }

        if (profile?.role === 'admin') {
          if (["/login", "/register", "/forgot-password", "/admin"].includes(location.pathname)) {
            navigate("/admin/dashboard");
          }
        } else {
          if (["/login", "/register", "/forgot-password", "/admin"].includes(location.pathname)) {
            navigate("/dashboard");
          }
        }
      } else if (!initialSession && !["/login", "/register", "/forgot-password", "/force-password-reset", "/admin"].includes(location.pathname)) {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-50">Loading...</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Checking authentication status.
          </p>
        </div>
      </div>
    );
  }

  return (
    <SessionContext.Provider value={{ session, user, loading }}>
      {children}
      <Toaster />
      <SonnerToaster />
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionContextProvider");
  }
  return context;
};