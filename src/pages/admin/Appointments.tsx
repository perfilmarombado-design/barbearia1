import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export default function Appointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    const { data } = await supabase
      .from("appointments")
      .select(`
        *,
        profile:profiles(nome, email),
        barber:barbers(nome),
        service:services(nome)
      `)
      .order("data", { ascending: false })
      .order("hora_inicio", { ascending: false });

    setAppointments(data || []);
  };

  const handleStatusChange = async (id: string, newStatus: "confirmado" | "concluido" | "cancelado" | "no_show") => {
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Agendamentos</h2>
        <p className="text-muted-foreground">Gerenciar todos os agendamentos</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Agendamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Barbeiro</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((apt) => (
                <TableRow key={apt.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{apt.profile.nome}</p>
                      <p className="text-sm text-muted-foreground">{apt.profile.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{apt.barber.nome}</TableCell>
                  <TableCell>{apt.service.nome}</TableCell>
                  <TableCell>
                    {new Date(apt.data).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>{apt.hora_inicio.substring(0, 5)}</TableCell>
                  <TableCell>
                    {apt.valor === 0
                      ? "Grátis"
                      : `R$ ${apt.valor.toFixed(2)}`}
                  </TableCell>
                  <TableCell>{getStatusBadge(apt.status)}</TableCell>
                  <TableCell>
                    <Select
                      value={apt.status}
                      onValueChange={(value) => handleStatusChange(apt.id, value as "confirmado" | "concluido" | "cancelado" | "no_show")}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirmado">Confirmado</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                        <SelectItem value="no_show">Não compareceu</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
