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
import { Plus, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Barbers() {
  const [barbers, setBarbers] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<any>(null);
  const [formData, setFormData] = useState({ nome: "", ativo: true, foto_url: "" });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadBarbers();
  }, []);

  const loadBarbers = async () => {
    const { data } = await supabase
      .from("barbers")
      .select("*")
      .order("nome");

    setBarbers(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingBarber) {
      const { error } = await supabase
        .from("barbers")
        .update(formData)
        .eq("id", editingBarber.id);

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao atualizar",
          description: error.message,
        });
      } else {
        toast({ title: "Barbeiro atualizado!" });
        resetForm();
        loadBarbers();
      }
    } else {
      const { error } = await supabase.from("barbers").insert([formData]);

      if (error) {
        toast({
          variant: "destructive",
          title: "Erro ao criar",
          description: error.message,
        });
      } else {
        toast({ title: "Barbeiro criado!" });
        resetForm();
        loadBarbers();
      }
    }
  };

  const resetForm = () => {
    setFormData({ nome: "", ativo: true, foto_url: "" });
    setEditingBarber(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (barber: any) => {
    setEditingBarber(barber);
    setFormData({
      nome: barber.nome,
      ativo: barber.ativo,
      foto_url: barber.foto_url || "",
    });
    setIsDialogOpen(true);
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("barbers")
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
      loadBarbers();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Barbeiros</h2>
          <p className="text-muted-foreground">Gerenciar equipe de barbeiros</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Barbeiro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingBarber ? "Editar Barbeiro" : "Novo Barbeiro"}
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
                <Label htmlFor="foto_url">URL da Foto (opcional)</Label>
                <Input
                  id="foto_url"
                  value={formData.foto_url}
                  onChange={(e) =>
                    setFormData({ ...formData, foto_url: e.target.value })
                  }
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
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingBarber ? "Atualizar" : "Criar"}
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
          <CardTitle>Lista de Barbeiros</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {barbers.map((barber) => (
                <TableRow key={barber.id}>
                  <TableCell className="font-medium">{barber.nome}</TableCell>
                  <TableCell>
                    {barber.ativo ? (
                      <Badge className="bg-green-500">Ativo</Badge>
                    ) : (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/admin/barbeiros/${barber.id}`)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Agenda
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(barber)}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant={barber.ativo ? "destructive" : "default"}
                        onClick={() => toggleActive(barber.id, barber.ativo)}
                      >
                        {barber.ativo ? "Desativar" : "Ativar"}
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
