import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.role === "admin" || data?.role === "barbeiro") {
        setIsAdmin(true);
      } else {
        navigate("/");
      }
      setChecking(false);
    }

    if (!loading) {
      checkAdmin();
    }
  }, [user, loading, navigate]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
