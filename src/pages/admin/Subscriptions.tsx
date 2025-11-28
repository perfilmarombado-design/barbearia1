import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    const { data } = await supabase
      .from("subscriptions")
      .select(`
        *,
        profile:profiles(nome, email)
      `)
      .order("created_at", { ascending: false });

    setSubscriptions(data || []);
  };

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from("subscriptions")
      .update({ status: "ativo" })
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao aprovar",
        description: error.message,
      });
    } else {
      toast({
        title: "Assinatura aprovada!",
      });
      loadSubscriptions();
    }
  };

  const handleCancel = async (id: string) => {
    const { error } = await supabase
      .from("subscriptions")
      .update({ status: "cancelado" })
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao cancelar",
        description: error.message,
      });
    } else {
      toast({
        title: "Assinatura cancelada",
      });
      loadSubscriptions();
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      ativo: <Badge className="bg-green-500">Ativo</Badge>,
      pendente: <Badge className="bg-yellow-500">Pendente</Badge>,
      expirado: <Badge className="bg-red-500">Expirado</Badge>,
      cancelado: <Badge className="bg-gray-500">Cancelado</Badge>,
    };
    return badges[status as keyof typeof badges];
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Assinaturas</h2>
        <p className="text-muted-foreground">Gerenciar assinaturas dos clientes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Assinaturas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Fim</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{sub.profile.nome}</p>
                      <p className="text-sm text-muted-foreground">{sub.profile.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(sub.status)}</TableCell>
                  <TableCell>R$ {sub.valor_mensal.toFixed(2)}</TableCell>
                  <TableCell>
                    {sub.data_inicio
                      ? new Date(sub.data_inicio).toLocaleDateString("pt-BR")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {sub.data_fim
                      ? new Date(sub.data_fim).toLocaleDateString("pt-BR")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {sub.comprovante_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(sub.comprovante_url, "_blank")}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                      {sub.status === "pendente" && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApprove(sub.id)}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCancel(sub.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      {sub.status === "ativo" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCancel(sub.id)}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
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
