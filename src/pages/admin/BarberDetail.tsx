import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Clock } from "lucide-react";
import DateFilters from "@/components/DateFilters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function BarberDetail() {
  const { id } = useParams();
  const [barber, setBarber] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [stats, setStats] = useState({
    todayAppointments: 0,
    todayRevenue: 0,
    appointments: [] as any[],
  });

  useEffect(() => {
    if (id) {
      loadBarberData();
      loadStats();
    }
  }, [id, selectedDate, endDate]);

  const loadBarberData = async () => {
    const { data } = await supabase
      .from("barbers")
      .select("*")
      .eq("id", id)
      .single();

    setBarber(data);
  };

  const loadStats = async () => {
    const startDateStr = format(selectedDate, "yyyy-MM-dd");
    const endDateStr = endDate ? format(endDate, "yyyy-MM-dd") : startDateStr;

    const { data: appointments } = await supabase
      .from("appointments")
      .select(`
        *,
        profile:profiles(nome),
        service:services(nome)
      `)
      .eq("barber_id", id)
      .gte("data", startDateStr)
      .lte("data", endDateStr)
      .order("data")
      .order("hora_inicio");

    const completedAppointments = appointments?.filter(
      (apt) => apt.status === "concluido"
    ) || [];

    const todayRevenue = completedAppointments.reduce(
      (sum, apt) => sum + Number(apt.valor),
      0
    );

    setStats({
      todayAppointments: appointments?.length || 0,
      todayRevenue,
      appointments: appointments || [],
    });
  };

  if (!barber) {
    return <div>Carregando...</div>;
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      confirmado: <Badge className="bg-blue-500">Confirmado</Badge>,
      concluido: <Badge className="bg-green-500">Concluído</Badge>,
      cancelado: <Badge className="bg-red-500">Cancelado</Badge>,
      no_show: <Badge className="bg-gray-500">Não compareceu</Badge>,
    };
    return badges[status as keyof typeof badges];
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">{barber.nome}</h2>
        <p className="text-muted-foreground">Agenda do barbeiro</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Agendamentos Hoje
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Faturamento Hoje
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.todayRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {barber.ativo ? (
                <Badge className="bg-green-500">Ativo</Badge>
              ) : (
                <Badge variant="secondary">Inativo</Badge>
              )}
            </div>
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

      <Card>
        <CardHeader>
          <CardTitle>
            Agendamentos - {format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}
            {endDate && ` até ${format(endDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.appointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhum agendamento neste período
              </p>
            ) : (
              stats.appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="text-sm text-muted-foreground">{format(new Date(apt.data + "T12:00:00"), "dd/MM/yyyy")}</p>
                    <p className="font-medium">{apt.profile.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {apt.service.nome}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {apt.hora_inicio.substring(0, 5)}
                    </p>
                    {getStatusBadge(apt.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
