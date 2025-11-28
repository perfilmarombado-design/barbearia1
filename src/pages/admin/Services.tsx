import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";

export default function Services() {
  const [services, setServices] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [formData, setFormData] = useState({
    nome: "",
    preco: "",
    duracao_minutos: "",
    ativo: true,
    incluso_assinante: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    const { data } = await supabase
      .from("services")
      .select("*")
      .order("nome");

    setServices(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const serviceData = {
      nome: formData.nome,
      preco: Number(formData.preco),
      duracao_minutos: Number(formData.duracao_minutos),
      ativo: formData.ativo,
      incluso_assinante: formData.incluso_assinante,
    };

    if (editingService) {
      const { error } = await supabase
        .from("services")
        .update(serviceData)
        .eq("id", editingService.id);

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao atualizar",
          description: error.message,
        });
      } else {
        toast({ title: "Serviço atualizado!" });
        resetForm();
        loadServices();
      }
    } else {
      const { error } = await supabase.from("services").insert([serviceData]);

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao criar",
          description: error.message,
        });
      } else {
        toast({ title: "Serviço criado!" });
        resetForm();
        loadServices();
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      preco: "",
      duracao_minutos: "",
      ativo: true,
      incluso_assinante: false,
    });
    setEditingService(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
    setFormData({
      nome: service.nome,
      preco: service.preco.toString(),
      duracao_minutos: service.duracao_minutos.toString(),
      ativo: service.ativo,
      incluso_assinante: service.incluso_assinante,
    });
    setIsDialogOpen(true);
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("services")
      .update({ ativo: !currentStatus })
      .eq("id", id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: error.message,
      });
    } else {
      toast({ title: "Status atualizado!" });
      loadServices();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Serviços</h2>
          <p className="text-muted-foreground">Gerenciar serviços oferecidos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Serviço
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingService ? "Editar Serviço" : "Novo Serviço"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="preco">Preço (R$)</Label>
                <Input
                  id="preco"
                  type="number"
                  step="0.01"
                  value={formData.preco}
                  onChange={(e) =>
                    setFormData({ ...formData, preco: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="duracao">Duração (minutos)</Label>
                <Input
                  id="duracao"
                  type="number"
                  value={formData.duracao_minutos}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duracao_minutos: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, ativo: checked })
                  }
                />
                <Label htmlFor="ativo">Ativo</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="incluso_assinante"
                  checked={formData.incluso_assinante}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, incluso_assinante: checked })
                  }
                />
                <Label htmlFor="incluso_assinante">
                  Incluso na assinatura
                </Label>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingService ? "Atualizar" : "Criar"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Serviços</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Assinatura</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.nome}</TableCell>
                  <TableCell>R$ {Number(service.preco).toFixed(2)}</TableCell>
                  <TableCell>{service.duracao_minutos} min</TableCell>
                  <TableCell>
                    {service.incluso_assinante ? (
                      <Badge className="bg-green-500">Incluso</Badge>
                    ) : (
                      <Badge variant="secondary">Não</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {service.ativo ? (
                      <Badge className="bg-blue-500">Ativo</Badge>
                    ) : (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(service)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant={service.ativo ? "destructive" : "default"}
                        onClick={() => toggleActive(service.id, service.ativo)}
                      >
                        {service.ativo ? "Desativar" : "Ativar"}
                      </Button>
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
