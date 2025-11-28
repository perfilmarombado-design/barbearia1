import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import DateFilters from "@/components/DateFilters";

export default function BarberPanel() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [barberInfo, setBarberInfo] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadBarberInfo();
      loadAppointments();
    }
  }, [user, selectedDate]);

  const loadBarberInfo = async () => {
    if (!user) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("nome, email")
      .eq("id", user.id)
      .single();

    setBarberInfo(profileData);
  };

  const loadAppointments = async () => {
    if (!user) return;

    // Primeiro, buscar o ID do barbeiro na tabela barbers usando o email do usuário
    const { data: profileData } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    if (!profileData) return;

    const { data: barberData } = await supabase
      .from("barbers")
      .select("id, nome")
      .ilike("nome", `%${profileData.email.split("@")[0]}%`)
      .maybeSingle();

    if (!barberData) {
      // Se não encontrou, tentar buscar por nome do perfil
      const { data: profileNameData } = await supabase
        .from("profiles")
        .select("nome")
        .eq("id", user.id)
        .single();

      if (profileNameData) {
        const { data: barberByName } = await supabase
          .from("barbers")
          .select("id, nome")
          .ilike("nome", `%${profileNameData.nome}%`)
          .maybeSingle();

        if (!barberByName) {
          setAppointments([]);
          return;
        }

        // Continuar com barberByName
        loadAppointmentsForBarber(barberByName.id);
      }
    } else {
      loadAppointmentsForBarber(barberData.id);
    }
  };

  const loadAppointmentsForBarber = async (barberId: string) => {
    const startDateStr = format(selectedDate, "yyyy-MM-dd");
    const endDateStr = endDate ? format(endDate, "yyyy-MM-dd") : startDateStr;

    const { data } = await supabase
      .from("appointments")
      .select(`
        *,
        profile:profiles(nome, email),
        service:services(nome, duracao_minutos)
      `)
      .eq("barber_id", barberId)
      .gte("data", startDateStr)
      .lte("data", endDateStr)
      .order("data")
      .order("hora_inicio", { ascending: true });

    setAppointments(data || []);
  };

  const handleStatusChange = async (id: string, newStatus: "concluido" | "no_show") => {
    const { error } = await supabase
      .from("appointments")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: error.message,
      });
    } else {
      toast({
        title: "Status atualizado!",
      });
      loadAppointments();
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      confirmado: <Badge className="bg-blue-500">Confirmado</Badge>,
      concluido: <Badge className="bg-green-500">Concluído</Badge>,
      cancelado: <Badge className="bg-red-500">Cancelado</Badge>,
      no_show: <Badge className="bg-gray-500">Não compareceu</Badge>,
    };
    return badges[status as keyof typeof badges];
  };

  const stats = {
    total: appointments.length,
    confirmados: appointments.filter((a) => a.status === "confirmado").length,
    concluidos: appointments.filter((a) => a.status === "concluido").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Minha Agenda</h2>
        <p className="text-muted-foreground">
          Bem-vindo, {barberInfo?.nome || "Barbeiro"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total do Dia</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">agendamentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmados</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.confirmados}</div>
            <p className="text-xs text-muted-foreground">aguardando atendimento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.concluidos}</div>
            <p className="text-xs text-muted-foreground">atendimentos finalizados</p>
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

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Agendamentos - {format(selectedDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}
            {endDate && ` até ${format(endDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {endDate && <TableHead>Data</TableHead>}
                <TableHead>Horário</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((apt) => (
                <TableRow key={apt.id}>
                  {endDate && (
                    <TableCell className="font-medium">
                      {format(new Date(apt.data + "T12:00:00"), "dd/MM/yyyy")}
                    </TableCell>
                  )}
                  <TableCell className="font-medium">
                    {apt.hora_inicio.substring(0, 5)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{apt.profile.nome}</p>
                      <p className="text-sm text-muted-foreground">{apt.profile.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{apt.service.nome}</TableCell>
                  <TableCell>{getStatusBadge(apt.status)}</TableCell>
                  <TableCell>
                    {apt.status === "confirmado" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(apt.id, "concluido")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Concluído
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(apt.id, "no_show")}
                        >
                          Não compareceu
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {appointments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Nenhum agendamento para esta data
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
