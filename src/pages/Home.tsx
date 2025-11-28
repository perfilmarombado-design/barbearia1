import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scissors, Calendar, Crown, LogOut, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Home() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkRoleAndRedirect();
    loadData();
  }, [user]);

  const checkRoleAndRedirect = async () => {
    if (!user) return;

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (roleData?.role === "admin" || roleData?.role === "barbeiro") {
      navigate("/admin");
    }
  };

  const loadData = async () => {
    if (!user) return;

    try {
      // Carregar perfil
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      setProfile(profileData);

      // Carregar próximo agendamento
      const { data: appointments } = await supabase
        .from("appointments")
        .select(`
          *,
          barber:barbers(nome),
          service:services(nome)
        `)
        .eq("user_id", user.id)
        .gte("data", new Date().toISOString().split("T")[0])
        .eq("status", "confirmado")
        .order("data", { ascending: true })
        .order("hora_inicio", { ascending: true })
        .limit(1);

      if (appointments && appointments.length > 0) {
        setNextAppointment(appointments[0]);
      }

      // Carregar assinatura ativa
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "ativo")
        .single();

      setSubscription(subData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-gold">
              <Scissors className="h-5 w-5 text-dark-bg" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Barbearia América</h1>
              <p className="text-sm text-muted-foreground">Bem-vindo, {profile?.nome}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6 max-w-4xl">
        {/* Status da Assinatura */}
        <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <CardTitle>Programa de Assinatura</CardTitle>
              </div>
              {subscription && (
                <Badge className="bg-primary text-dark-bg">Ativo</Badge>
              )}
            </div>
            <CardDescription>
              {subscription 
                ? `Válida até ${format(new Date(subscription.data_fim), "dd 'de' MMMM", { locale: ptBR })}`
                : "Assine e tenha benefícios exclusivos"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subscription ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  ✓ Corte Clássico grátis mensalmente<br />
                  ✓ Corte + Barba grátis mensalmente<br />
                  ✓ Agendamento prioritário
                </p>
              </div>
            ) : (
              <Button 
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-dark-bg font-semibold"
                onClick={() => navigate("/assinatura")}
              >
                Ativar Assinatura - R$ 99,90/mês
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Próximo Agendamento */}
        {nextAppointment && (
          <Card>
            <CardHeader>
              <CardTitle>Próximo Agendamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="font-medium">
                  {format(new Date(nextAppointment.data), "dd 'de' MMMM", { locale: ptBR })} às {nextAppointment.hora_inicio}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-primary" />
                <span>{nextAppointment.barber.nome}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Scissors className="h-4 w-4 text-primary" />
                <span>{nextAppointment.service.nome}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botão de Agendamento */}
        <Button
          size="lg"
          className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-dark-bg font-bold text-lg h-14 shadow-gold"
          onClick={() => navigate("/agendar")}
        >
          <Calendar className="mr-2 h-5 w-5" />
          Agendar Novo Horário
        </Button>

        {/* Meus Agendamentos */}
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => navigate("/meus-agendamentos")}
        >
          Ver Meus Agendamentos
        </Button>
      </main>
    </div>
  );
}
