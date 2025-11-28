-- Criar bucket para comprovantes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('comprovantes', 'comprovantes', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para o bucket de comprovantes
CREATE POLICY "Usuários podem fazer upload de comprovantes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'comprovantes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Comprovantes são públicos"
ON storage.objects FOR SELECT
USING (bucket_id = 'comprovantes');

CREATE POLICY "Admin pode gerenciar comprovantes"
ON storage.objects FOR ALL
USING (
  bucket_id = 'comprovantes' AND
  public.has_role(auth.uid(), 'admin')
);