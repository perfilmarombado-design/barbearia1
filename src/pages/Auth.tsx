import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Scissors, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      checkUserRoleAndRedirect();
    }
  }, [user, navigate]);

  const checkUserRoleAndRedirect = async () => {
    if (!user) return;

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (roleData?.role === "admin" || roleData?.role === "barbeiro") {
      navigate("/admin");
        } else {
          await checkUserRoleAndRedirect();
        }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            variant: "destructive",
            title: "Erro ao entrar",
            description: error.message === "Invalid login credentials" 
              ? "Email ou senha incorretos"
              : error.message,
          });
        } else {
          navigate("/");
        }
      } else {
        if (!nome.trim()) {
          toast({
            variant: "destructive",
            title: "Nome obrigatório",
            description: "Por favor, informe seu nome",
          });
          setLoading(false);
          return;
        }

        const { error: signUpError } = await signUp(nome, email, password);
        if (signUpError) {
          toast({
            variant: "destructive",
            title: "Erro ao criar conta",
            description: signUpError.message,
          });
        } else {
          // Login automático após cadastro
          const { error: signInError } = await signIn(email, password);
          if (signInError) {
            toast({
              title: "Conta criada!",
              description: "Faça login para continuar",
            });
          } else {
            toast({
              title: "Bem-vindo!",
              description: "Conta criada com sucesso",
            });
            navigate("/");
          }
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-bg via-dark-surface to-dark-bg p-4">
      <Card className="w-full max-w-md border-border/50 bg-card/95 backdrop-blur">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-gold">
            <Scissors className="h-8 w-8 text-dark-bg" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Barbearia América
          </CardTitle>
          <CardDescription>
            {isLogin ? "Entre na sua conta" : "Crie sua conta"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo</Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required={!isLogin}
                  disabled={loading}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-dark-bg font-semibold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Aguarde...
                </>
              ) : isLogin ? (
                "Entrar"
              ) : (
                "Criar conta"
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                disabled={loading}
              >
                {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Entre"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
