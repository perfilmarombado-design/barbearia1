import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Scissors as ScissorsIcon, 
  Settings, 
  Crown,
  LogOut,
  Briefcase,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserRole() {
      if (!user) return;

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      setUserRole(data?.role || null);
    }

    loadUserRole();
  }, [user]);

  // Menu completo para admin
  const adminMenuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    { icon: Calendar, label: "Agendamentos", path: "/admin/agendamentos" },
    { icon: Crown, label: "Assinaturas", path: "/admin/assinaturas" },
    { icon: Users, label: "Clientes", path: "/admin/clientes" },
    { icon: Briefcase, label: "Barbeiros", path: "/admin/barbeiros" },
    { icon: ScissorsIcon, label: "Serviços", path: "/admin/servicos" },
    { icon: Shield, label: "Gerenciar Usuários", path: "/admin/usuarios" },
    { icon: Settings, label: "Configurações", path: "/admin/configuracoes" },
  ];

  // Menu reduzido para barbeiro
  const barberMenuItems = [
    { icon: Calendar, label: "Minha Agenda", path: "/admin/barbeiro/agenda" },
  ];

  const menuItems = userRole === "barbeiro" ? barberMenuItems : adminMenuItems;

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-dark-bg text-foreground">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-dark-surface border-r border-border/50 flex flex-col">
        <div className="p-6 border-b border-border/50">
          <h1 className="text-xl font-bold text-primary">Admin Barbearia</h1>
          <p className="text-sm text-muted-foreground">Painel de Controle</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Button
                key={item.path}
                variant="ghost"
                className={cn(
                  "w-full justify-start transition-all",
                  isActive 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 font-semibold" 
                    : "text-white hover:bg-white/10 hover:text-white"
                )}
                onClick={() => navigate(item.path)}
              >
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50">
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:bg-destructive/20 hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
}
