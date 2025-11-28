import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, Calendar, Crown, CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import DateFilters from "@/components/DateFilters";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalAgendamentos: 0,
    faturamento: 0,
    assinaturasAtivas: 0,
    clientesAtivos: 0,
  });

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    loadStats();
    loadSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      loadAppointments();
      generateTimeSlots();
    }
  }, [selectedDate, settings]);

  const loadStats = async () => {
    const today = new Date().toISOString().split("T")[0];

    const { data: appointments } = await supabase
      .from("appointments")
      .select("valor")
      .eq("status", "concluido");

    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("status", "ativo");

    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "cliente");

    const { count: todayCount } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("data", today);

    const faturamento = appointments?.reduce((sum, apt) => sum + Number(apt.valor), 0) || 0;

    setStats({
      totalAgendamentos: todayCount || 0,
      faturamento,
      assinaturasAtivas: subscriptions?.length || 0,
      clientesAtivos: profiles?.length || 0,
    });
  };

  const loadSettings = async () => {
    const { data } = await supabase
      .from("settings")
      .select("*")
      .single();
    
    setSettings(data);
  };

  const loadAppointments = async () => {
    const startDateStr = format(selectedDate, "yyyy-MM-dd");
    const endDateStr = endDate ? format(endDate, "yyyy-MM-dd") : startDateStr;

    let query = supabase
      .from("appointments")
      .select(`
        *,
        profile:profiles(nome),
        barber:barbers(nome),
        service:services(nome)
      `)
      .gte("data", startDateStr)
      .lte("data", endDateStr)
      .order("data")
      .order("hora_inicio");

    const { data } = await query;
    setAppointments(data || []);
  };

  const generateTimeSlots = () => {
    if (!settings) return;

    const slots = [];
    const [startHour, startMinute] = settings.horario_abertura.split(":").map(Number);
    const [endHour, endMinute] = settings.horario_fechamento.split(":").map(Number);
    const interval = settings.intervalo_minutos;

    let currentMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    while (currentMinutes < endMinutes) {
      const hours = Math.floor(currentMinutes / 60);
      const minutes = currentMinutes % 60;
      const timeStr = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
      
      const appointment = appointments.find(apt => apt.hora_inicio === timeStr + ":00");
      
      slots.push({
        time: timeStr,
        appointment: appointment || null,
        isFree: !appointment
      });

      currentMinutes += interval;
    }

    setTimeSlots(slots);
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      confirmado: "default",
      concluido: "secondary",
      cancelado: "destructive",
      no_show: "outline"
    };

    const labels: any = {
      confirmado: "Confirmado",
      concluido: "Concluído",
      cancelado: "Cancelado",
      no_show: "Não Compareceu"
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">Visão geral do negócio</p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAgendamentos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.faturamento.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assinaturasAtivas}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clientesAtivos}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros de Data */}
      <DateFilters
        currentDate={selectedDate}
        onDateChange={(start, end) => {
          setSelectedDate(start);
          setEndDate(end);
        }}
      />

      {/* Agenda */}
      <Card>
        <CardHeader>
          <CardTitle>
            Agendamentos - {format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}
            {endDate && ` até ${format(endDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {!endDate && timeSlots.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Carregando horários...
              </p>
            ) : endDate ? (
              <div className="space-y-3">
                {appointments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum agendamento neste período
                  </p>
                ) : (
                  appointments.map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg border bg-background">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col min-w-[100px]">
                          <span className="text-sm text-muted-foreground">{format(new Date(apt.data + "T12:00:00"), "dd/MM/yyyy")}</span>
                          <span className="font-semibold">{apt.hora_inicio.substring(0, 5)}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="font-medium">{apt.profile.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {apt.service.nome} • {apt.barber.nome}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(apt.status)}
                        <span className="text-sm font-medium text-muted-foreground">
                          R$ {Number(apt.valor).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              timeSlots.map((slot) => (
                <div
                  key={slot.time}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    slot.isFree ? "bg-muted/30" : "bg-background"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 min-w-[80px]">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{slot.time}</span>
                    </div>
                    
                    {slot.isFree ? (
                      <Badge variant="outline" className="bg-background">
                        Horário Livre
                      </Badge>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <p className="font-medium">{slot.appointment.profile.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {slot.appointment.service.nome} • {slot.appointment.barber.nome}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {!slot.isFree && (
                    <div className="flex items-center gap-2">
                      {getStatusBadge(slot.appointment.status)}
                      <span className="text-sm font-medium text-muted-foreground">
                        R$ {Number(slot.appointment.valor).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
