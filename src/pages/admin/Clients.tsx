import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Clients() {
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    const { data } = await supabase
      .from("profiles")
      .select(`
        *,
        subscriptions(status),
        appointments(id)
      `)
      .eq("role", "cliente");

    setClients(data || []);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Clientes</h2>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Atendimentos</TableHead>
                <TableHead>Assinante</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.nome}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.appointments?.length || 0}</TableCell>
                  <TableCell>
                    {client.subscriptions?.some((s: any) => s.status === "ativo") ? (
                      <Badge className="bg-green-500">Sim</Badge>
                    ) : (
                      <Badge variant="secondary">Não</Badge>
                    )}
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
