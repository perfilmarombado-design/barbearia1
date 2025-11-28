import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, Scissors, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function MyAppointments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, [user]);

  const loadAppointments = async () => {
    try {
      const { data } = await supabase
        .from("appointments")
        .select(`
          *,
          barber:barbers(nome, foto_url),
          service:services(nome)
        `)
        .eq("user_id", user?.id)
        .order("data", { ascending: false })
        .order("hora_inicio", { ascending: false });

      setAppointments(data || []);
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      confirmado: <Badge className="bg-blue-500">Confirmado</Badge>,
      concluido: <Badge className="bg-green-500">Concluído</Badge>,
      cancelado: <Badge className="bg-red-500">Cancelado</Badge>,
      no_show: <Badge className="bg-gray-500">Não compareceu</Badge>,
    };
    return badges[status as keyof typeof badges] || null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Meus Agendamentos</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-4">
        {appointments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Você ainda não tem agendamentos</p>
              <Button
                className="mt-4"
                onClick={() => navigate("/agendar")}
              >
                Fazer primeiro agendamento
              </Button>
            </CardContent>
          </Card>
        ) : (
          appointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="font-semibold">
                      {format(new Date(appointment.data), "dd 'de' MMMM", { locale: ptBR })}
                    </span>
                    <span className="text-muted-foreground">
                      às {appointment.hora_inicio.substring(0, 5)}
                    </span>
                  </div>
                  {getStatusBadge(appointment.status)}
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={appointment.barber.foto_url}
                    alt={appointment.barber.nome}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-3 w-3 text-primary" />
                      <span>{appointment.barber.nome}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Scissors className="h-3 w-3 text-primary" />
                      <span>{appointment.service.nome}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Valor:</span>
                  <span className="font-bold text-primary">
                    {appointment.valor === 0
                      ? "Grátis (Assinante)"
                      : `R$ ${appointment.valor.toFixed(2)}`}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>
    </div>
  );
}
