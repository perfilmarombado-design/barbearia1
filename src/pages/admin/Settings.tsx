import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [settings, setSettings] = useState({
    horario_abertura: "09:00",
    horario_fechamento: "20:00",
    intervalo_minutos: 30,
    valor_assinatura_mensal: 99.9,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase
      .from("settings")
      .select("*")
      .single();

    if (data) {
      setSettings({
        horario_abertura: data.horario_abertura.substring(0, 5),
        horario_fechamento: data.horario_fechamento.substring(0, 5),
        intervalo_minutos: data.intervalo_minutos,
        valor_assinatura_mensal: Number(data.valor_assinatura_mensal),
      });
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: existingSettings } = await supabase
      .from("settings")
      .select("id")
      .single();

    const updateData = {
      horario_abertura: settings.horario_abertura + ":00",
      horario_fechamento: settings.horario_fechamento + ":00",
      intervalo_minutos: settings.intervalo_minutos,
      valor_assinatura_mensal: settings.valor_assinatura_mensal,
    };

    let error;
    if (existingSettings) {
      const result = await supabase
        .from("settings")
        .update(updateData)
        .eq("id", existingSettings.id);
      error = result.error;
    } else {
      const result = await supabase.from("settings").insert([updateData]);
      error = result.error;
    }

    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message,
      });
    } else {
      toast({ title: "Configurações salvas!" });
      loadSettings();
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Configurações</h2>
        <p className="text-muted-foreground">
          Configurações gerais da barbearia
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Horário de Funcionamento</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="abertura">Horário de Abertura</Label>
                <Input
                  id="abertura"
                  type="time"
                  value={settings.horario_abertura}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      horario_abertura: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="fechamento">Horário de Fechamento</Label>
                <Input
                  id="fechamento"
                  type="time"
                  value={settings.horario_fechamento}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      horario_fechamento: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="intervalo">Intervalo entre Horários (minutos)</Label>
              <Input
                id="intervalo"
                type="number"
                value={settings.intervalo_minutos}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    intervalo_minutos: Number(e.target.value),
                  })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="assinatura">Valor da Assinatura Mensal (R$)</Label>
              <Input
                id="assinatura"
                type="number"
                step="0.01"
                value={settings.valor_assinatura_mensal}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    valor_assinatura_mensal: Number(e.target.value),
                  })
                }
                required
              />
            </div>

            <Button type="submit">Salvar Configurações</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
