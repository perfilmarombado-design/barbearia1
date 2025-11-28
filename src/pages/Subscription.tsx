import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Crown, Check, Copy, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function Subscription() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [subscription, setSubscription] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [comprovante, setComprovante] = useState<File | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    const { data: subData } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const { data: settingsData } = await supabase
      .from("settings")
      .select("*")
      .single();

    setSubscription(subData);
    setSettings(settingsData);
  };

  const pixKey = "pix@barbeariaamerica.com.br";
  const pixCode = "00020126580014BR.GOV.BCB.PIX0136pix@barbeariaamerica.com.br5204000053039865802BR5925Barbearia America6009SAO PAULO62410503***63041D3D";

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode);
    toast({
      title: "Código copiado!",
      description: "Cole no seu app de pagamentos",
    });
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const dataInicio = new Date();
      const dataFim = new Date();
      dataFim.setDate(dataFim.getDate() + 30);

      const { error } = await supabase.from("subscriptions").insert({
        user_id: user?.id,
        status: "pendente",
        valor_mensal: settings?.valor_assinatura_mensal || 99.90,
        data_inicio: dataInicio.toISOString(),
        data_fim: dataFim.toISOString(),
      });

      if (error) throw error;

      setShowPayment(true);
      loadData();

      toast({
        title: "Solicitação criada!",
        description: "Agora efetue o pagamento via PIX",
      });
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

  const handleUploadComprovante = async () => {
    if (!comprovante || !subscription) {
      toast({
        variant: "destructive",
        title: "Selecione um comprovante",
      });
      return;
    }

    setLoading(true);
    try {
      // Upload do arquivo
      const fileExt = comprovante.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('comprovantes')
        .upload(fileName, comprovante);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('comprovantes')
        .getPublicUrl(fileName);

      // Atualizar assinatura com URL do comprovante
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({ comprovante_url: publicUrl })
        .eq("id", subscription.id);

      if (updateError) throw updateError;

      toast({
        title: "Comprovante enviado!",
        description: "Aguarde a aprovação do administrador",
      });

      loadData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      ativo: <Badge className="bg-green-500">Ativo</Badge>,
      pendente: <Badge className="bg-yellow-500">Pendente</Badge>,
      expirado: <Badge className="bg-red-500">Expirado</Badge>,
      cancelado: <Badge className="bg-gray-500">Cancelado</Badge>,
    };
    return badges[status as keyof typeof badges] || null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Assinatura</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        {/* Benefícios */}
        <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-primary" />
              <CardTitle>Programa de Assinatura</CardTitle>
            </div>
            <CardDescription>
              R$ {settings?.valor_assinatura_mensal?.toFixed(2) || "99,90"}/mês
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-sm">Corte Clássico grátis mensalmente</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-sm">Corte + Barba grátis mensalmente</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-sm">Agendamento prioritário</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-sm">Desconto em outros serviços</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status da Assinatura */}
        {subscription && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Status da Assinatura</CardTitle>
                {getStatusBadge(subscription.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Valor: R$ {subscription.valor_mensal.toFixed(2)}
              </p>
              {subscription.data_inicio && (
                <p className="text-sm text-muted-foreground">
                  Início: {new Date(subscription.data_inicio).toLocaleDateString('pt-BR')}
                </p>
              )}
              {subscription.data_fim && (
                <p className="text-sm text-muted-foreground">
                  Válida até: {new Date(subscription.data_fim).toLocaleDateString('pt-BR')}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pagamento PIX */}
        {(!subscription || subscription.status === "pendente") && (
          <Card>
            <CardHeader>
              <CardTitle>Pagamento via PIX</CardTitle>
              <CardDescription>
                Realize o pagamento para ativar sua assinatura
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showPayment && !subscription ? (
                <Button
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-dark-bg font-bold"
                  onClick={handleSubscribe}
                  disabled={loading}
                >
                  {loading ? "Processando..." : "Assinar Agora"}
                </Button>
              ) : (
                <>
                  <div className="bg-secondary/50 p-4 rounded-lg space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Chave PIX</Label>
                      <p className="font-mono text-sm">{pixKey}</p>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-muted-foreground">Código PIX Copia e Cola</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={pixCode}
                          readOnly
                          className="font-mono text-xs"
                        />
                        <Button size="icon" variant="outline" onClick={copyPixCode}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Valor</Label>
                      <p className="font-bold text-lg text-primary">
                        R$ {settings?.valor_assinatura_mensal?.toFixed(2) || "99,90"}
                      </p>
                    </div>
                  </div>

                  {subscription && !subscription.comprovante_url && (
                    <div className="space-y-3">
                      <Label>Enviar Comprovante</Label>
                      <Input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setComprovante(e.target.files?.[0] || null)}
                      />
                      <Button
                        className="w-full"
                        onClick={handleUploadComprovante}
                        disabled={loading || !comprovante}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {loading ? "Enviando..." : "Enviar Comprovante"}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        Após enviar o comprovante, aguarde a aprovação do administrador
                      </p>
                    </div>
                  )}

                  {subscription?.comprovante_url && subscription.status === "pendente" && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                      <p className="text-sm text-center">
                        Comprovante enviado! Aguardando aprovação do administrador.
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
