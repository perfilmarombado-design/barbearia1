import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Search } from "lucide-react";

type UserWithRole = {
  id: string;
  nome: string;
  email: string;
  role: "cliente" | "admin" | "barbeiro";
};

export default function Users() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    nome: "",
    email: "",
    password: "",
    role: "cliente" as "cliente" | "admin" | "barbeiro",
  });
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, nome, email");

    if (!profilesData) {
      setUsers([]);
      return;
    }

    const usersWithRoles = await Promise.all(
      profilesData.map(async (profile) => {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", profile.id)
          .maybeSingle();

        return {
          ...profile,
          role: roleData?.role || "cliente",
        };
      })
    );

    setUsers(usersWithRoles);
  };

  const handleRoleChange = async (userId: string, newRole: "cliente" | "admin" | "barbeiro") => {
    // Deletar role antigo
    await supabase.from("user_roles").delete().eq("user_id", userId);

    // Inserir novo role
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: newRole });

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar permissão",
        description: error.message,
      });
    } else {
      toast({
        title: "Permissão atualizada!",
        description: `Usuário agora é ${newRole}`,
      });
      loadUsers();
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.nome || !newUser.email || !newUser.password) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Preencha todos os campos",
      });
      return;
    }

    // Criar usuário no auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: newUser.email,
      password: newUser.password,
      options: {
        data: {
          nome: newUser.nome,
        },
      },
    });

    if (authError) {
      toast({
        variant: "destructive",
        title: "Erro ao criar usuário",
        description: authError.message,
      });
      return;
    }

    if (authData.user) {
      // Atualizar role se não for cliente
      if (newUser.role !== "cliente") {
        await supabase.from("user_roles").delete().eq("user_id", authData.user.id);
        await supabase
          .from("user_roles")
          .insert({ user_id: authData.user.id, role: newUser.role });
      }

      toast({
        title: "Usuário criado!",
        description: `${newUser.nome} foi criado como ${newUser.role}`,
      });

      setIsDialogOpen(false);
      setNewUser({ nome: "", email: "", password: "", role: "cliente" });
      loadUsers();
    }
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      admin: <Badge className="bg-red-500 text-white">Admin</Badge>,
      barbeiro: <Badge className="bg-blue-500 text-white">Barbeiro</Badge>,
      cliente: <Badge variant="secondary">Cliente</Badge>,
    };
    return badges[role as keyof typeof badges];
  };

  // Filtrar usuários baseado na busca
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.nome.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Gerenciar Usuários</h2>
          <p className="text-muted-foreground">Gerencie permissões e crie novos usuários</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>
                Adicione um novo usuário e defina suas permissões
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={newUser.nome}
                  onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div>
                <Label htmlFor="role">Permissão</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value: "cliente" | "admin" | "barbeiro") =>
                    setNewUser({ ...newUser, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cliente">Cliente</SelectItem>
                    <SelectItem value="barbeiro">Barbeiro</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateUser}>Criar Usuário</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos os Usuários</CardTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Pesquisar usuário por nome ou e-mail"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop: Tabela */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(value) =>
                            handleRoleChange(user.id, value as "cliente" | "admin" | "barbeiro")
                          }
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cliente">Cliente</SelectItem>
                            <SelectItem value="barbeiro">Barbeiro</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: Cards */}
          <div className="md:hidden space-y-4">
            {filteredUsers.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Nenhum usuário encontrado
              </div>
            ) : (
              filteredUsers.map((user) => (
                <Card key={user.id}>
                  <CardContent className="pt-6 space-y-3">
                    <div>
                      <div className="text-sm text-muted-foreground">Nome</div>
                      <div className="font-medium">{user.nome}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">E-mail</div>
                      <div className="text-sm">{user.email}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Função</div>
                      {getRoleBadge(user.role)}
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-2">Alterar Função</div>
                      <Select
                        value={user.role}
                        onValueChange={(value) =>
                          handleRoleChange(user.id, value as "cliente" | "admin" | "barbeiro")
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cliente">Cliente</SelectItem>
                          <SelectItem value="barbeiro">Barbeiro</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
