-- Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('cliente', 'admin', 'barbeiro');

-- Criar enum para status de assinatura
CREATE TYPE public.subscription_status AS ENUM ('ativo', 'pendente', 'expirado', 'cancelado');

-- Criar enum para status de agendamento
CREATE TYPE public.appointment_status AS ENUM ('confirmado', 'concluido', 'cancelado', 'no_show');

-- Tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'cliente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de barbeiros
CREATE TABLE public.barbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  foto_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de serviços
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  duracao_minutos INTEGER NOT NULL,
  preco DECIMAL(10, 2) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  incluso_assinante BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de assinaturas
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status subscription_status NOT NULL DEFAULT 'pendente',
  valor_mensal DECIMAL(10, 2) NOT NULL,
  data_inicio TIMESTAMP WITH TIME ZONE,
  data_fim TIMESTAMP WITH TIME ZONE,
  comprovante_url TEXT,
  metodo_pagamento TEXT DEFAULT 'PIX',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de agendamentos
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  status appointment_status NOT NULL DEFAULT 'confirmado',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de configurações
CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horario_abertura TIME NOT NULL DEFAULT '09:00:00',
  horario_fechamento TIME NOT NULL DEFAULT '20:00:00',
  intervalo_minutos INTEGER NOT NULL DEFAULT 30,
  valor_assinatura_mensal DECIMAL(10, 2) NOT NULL DEFAULT 99.90,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir configuração padrão
INSERT INTO public.settings (horario_abertura, horario_fechamento, intervalo_minutos, valor_assinatura_mensal)
VALUES ('09:00:00', '20:00:00', 30, 99.90);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Função para verificar se o usuário tem uma role específica
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id AND role = _role
  )
$$;

-- Função para verificar se o usuário é admin ou barbeiro
CREATE OR REPLACE FUNCTION public.is_admin_or_barber(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id AND role IN ('admin', 'barbeiro')
  )
$$;

-- Policies para profiles
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admin pode ver todos os perfis"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Policies para barbers
CREATE POLICY "Todos podem ver barbeiros ativos"
  ON public.barbers FOR SELECT
  USING (ativo = true);

CREATE POLICY "Admin pode gerenciar barbeiros"
  ON public.barbers FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Policies para services
CREATE POLICY "Todos podem ver serviços ativos"
  ON public.services FOR SELECT
  USING (ativo = true);

CREATE POLICY "Admin pode gerenciar serviços"
  ON public.services FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Policies para subscriptions
CREATE POLICY "Usuários podem ver suas próprias assinaturas"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias assinaturas"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin pode ver e gerenciar todas as assinaturas"
  ON public.subscriptions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Policies para appointments
CREATE POLICY "Usuários podem ver seus próprios agendamentos"
  ON public.appointments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios agendamentos"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin e barbeiros podem ver todos os agendamentos"
  ON public.appointments FOR SELECT
  USING (public.is_admin_or_barber(auth.uid()));

CREATE POLICY "Admin pode gerenciar todos os agendamentos"
  ON public.appointments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Policies para settings
CREATE POLICY "Todos podem ver configurações"
  ON public.settings FOR SELECT
  USING (true);

CREATE POLICY "Admin pode atualizar configurações"
  ON public.settings FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger para criar profile automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nome', new.email),
    new.email,
    'cliente'
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados iniciais de exemplo
INSERT INTO public.barbers (nome, foto_url, ativo) VALUES
  ('Carlos Silva', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', true),
  ('Roberto Santos', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400', true),
  ('Fernando Lima', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400', true);

INSERT INTO public.services (nome, duracao_minutos, preco, ativo, incluso_assinante) VALUES
  ('Corte Clássico', 45, 45.00, true, true),
  ('Corte + Barba', 60, 65.00, true, true),
  ('Barboterapia Completa', 90, 120.00, true, false),
  ('Apenas Barba', 30, 35.00, true, false),
  ('Corte Infantil', 30, 35.00, true, false);