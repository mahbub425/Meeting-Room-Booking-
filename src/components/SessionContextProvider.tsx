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

      if (event === 'SIGNED_OUT') {
        const publicRoutes = ["/login", "/register", "/forgot-password", "/force-password-reset", "/admin", "/"];
        const isPublicRoute = publicRoutes.includes(location.pathname) || location.pathname.startsWith('/room/');
        if (!isPublicRoute) {
          navigate("/login");
          toast({
            title: "Logged Out",
            description: "You have been logged out.",
          });
        }
      }
    });

    // Initial session check
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user || null);
      
      if (!initialSession) {
        const publicRoutes = ["/login", "/register", "/forgot-password", "/force-password-reset", "/admin", "/"];
        const isPublicRoute = publicRoutes.includes(location.pathname) || location.pathname.startsWith('/room/');
        if (!isPublicRoute) {
          navigate("/login");
        }
      }
      setLoading(false);
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