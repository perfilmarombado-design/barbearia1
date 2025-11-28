import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, Check } from "lucide-react";
import { format, addMinutes, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

export default function Booking() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedBarber, setSelectedBarber] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, [user]);

  useEffect(() => {
    if (selectedBarber && selectedDate) {
      loadAvailableTimes();
    }
  }, [selectedBarber, selectedDate]);

  const loadInitialData = async () => {
    const { data: servicesData } = await supabase
      .from("services")
      .select("*")
      .eq("ativo", true)
      .order("preco");
    
    const { data: barbersData } = await supabase
      .from("barbers")
      .select("*")
      .eq("ativo", true);

    const { data: subData } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user?.id)
      .eq("status", "ativo")
      .single();

    setServices(servicesData || []);
    setBarbers(barbersData || []);
    setSubscription(subData);
  };

  const loadAvailableTimes = async () => {
    if (!selectedDate || !selectedBarber) return;

    const { data: settings } = await supabase
      .from("settings")
      .select("*")
      .single();

    const { data: appointments } = await supabase
      .from("appointments")
      .select("hora_inicio, hora_fim")
      .eq("barber_id", selectedBarber.id)
      .eq("data", format(selectedDate, "yyyy-MM-dd"))
      .in("status", ["confirmado", "concluido"]);

    if (!settings) return;

    const times: string[] = [];
    const start = parse(settings.horario_abertura, "HH:mm:ss", new Date());
    const end = parse(settings.horario_fechamento, "HH:mm:ss", new Date());
    const interval = settings.intervalo_minutos;

    let current = start;
    while (current < end) {
      const timeStr = format(current, "HH:mm");
      const isBooked = appointments?.some((apt: any) => {
        const aptStart = apt.hora_inicio.substring(0, 5);
        const aptEnd = apt.hora_fim.substring(0, 5);
        return timeStr >= aptStart && timeStr < aptEnd;
      });

      if (!isBooked) {
        times.push(timeStr);
      }
      current = addMinutes(current, interval);
    }

    setAvailableTimes(times);
  };

  const handleConfirm = async () => {
    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime) {
      toast({
        variant: "destructive",
        title: "Dados incompletos",
        description: "Por favor, preencha todos os campos",
      });
      return;
    }

    setLoading(true);

    try {
      const endTime = format(
        addMinutes(
          parse(selectedTime, "HH:mm", new Date()),
          selectedService.duracao_minutos
        ),
        "HH:mm:ss"
      );

      let valor = selectedService.preco;
      if (subscription && selectedService.incluso_assinante) {
        valor = 0;
      }

      const { error } = await supabase.from("appointments").insert({
        user_id: user?.id,
        barber_id: selectedBarber.id,
        service_id: selectedService.id,
        data: format(selectedDate, "yyyy-MM-dd"),
        hora_inicio: `${selectedTime}:00`,
        hora_fim: endTime,
        valor,
        status: "confirmado",
      });

      if (error) throw error;

      toast({
        title: "Agendamento confirmado!",
        description: `Seu horário foi agendado para ${format(selectedDate, "dd/MM/yyyy")} às ${selectedTime}`,
      });

      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao agendar",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const getPrice = (service: any) => {
    if (subscription && service.incluso_assinante) {
      return "Grátis (Assinante)";
    }
    return `R$ ${service.preco.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <header className="border-b border-border/50 bg-card/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Novo Agendamento</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Indicador de progresso */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= s
                    ? "bg-primary text-dark-bg"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s ? <Check className="h-5 w-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    step > s ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Passo 1: Escolher Serviço */}
        {step === 1 && (
          <div className="space-y-4">
            <CardHeader className="px-0">
              <CardTitle>Escolha o serviço</CardTitle>
              <CardDescription>Selecione o que você deseja fazer</CardDescription>
            </CardHeader>
            {services.map((service) => (
              <Card
                key={service.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedService?.id === service.id
                    ? "border-primary shadow-gold"
                    : ""
                }`}
                onClick={() => {
                  setSelectedService(service);
                  setStep(2);
                }}
              >
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{service.nome}</h3>
                      <p className="text-sm text-muted-foreground">
                        {service.duracao_minutos} minutos
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{getPrice(service)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Passo 2: Escolher Barbeiro */}
        {step === 2 && (
          <div className="space-y-4">
            <CardHeader className="px-0">
              <CardTitle>Escolha o barbeiro</CardTitle>
              <CardDescription>Selecione seu profissional preferido</CardDescription>
            </CardHeader>
            {barbers.map((barber) => (
              <Card
                key={barber.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedBarber?.id === barber.id
                    ? "border-primary shadow-gold"
                    : ""
                }`}
                onClick={() => {
                  setSelectedBarber(barber);
                  setStep(3);
                }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <img
                      src={barber.foto_url}
                      alt={barber.nome}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-semibold text-lg">{barber.nome}</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Passo 3: Escolher Data e Horário */}
        {step === 3 && (
          <div className="space-y-6">
            <CardHeader className="px-0">
              <CardTitle>Escolha data e horário</CardTitle>
              <CardDescription>Selecione quando deseja ser atendido</CardDescription>
            </CardHeader>

            <Card>
              <CardContent className="pt-6 flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) =>
                    date < new Date() || date < new Date(new Date().setHours(0, 0, 0, 0))
                  }
                  locale={ptBR}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            {selectedDate && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Horários disponíveis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {availableTimes.map((time) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        className={selectedTime === time ? "bg-primary text-dark-bg" : ""}
                        onClick={() => setSelectedTime(time)}
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                  {availableTimes.length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      Nenhum horário disponível para este dia
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {selectedTime && (
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-dark-bg font-bold"
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? "Agendando..." : "Confirmar Agendamento"}
              </Button>
            )}
          </div>
        )}

        {step > 1 && (
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => setStep(step - 1)}
          >
            Voltar
          </Button>
        )}
      </main>
    </div>
  );
}
