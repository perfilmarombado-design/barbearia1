import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowInstallPrompt(false);
    }

    setDeferredPrompt(null);
  };

  if (!showInstallPrompt) return null;

  return (
    <Card className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 shadow-gold border-primary/50 bg-card/95 backdrop-blur">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Download className="h-5 w-5 text-dark-bg" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Instalar App</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Instale o app no seu dispositivo para acesso rápido e offline
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleInstall}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-dark-bg"
              >
                Instalar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowInstallPrompt(false)}
              >
                Agora não
              </Button>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="flex-shrink-0 h-8 w-8"
            onClick={() => setShowInstallPrompt(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
