import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import InstallPWA from "@/components/InstallPWA";

import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Booking from "./pages/Booking";
import Subscription from "./pages/Subscription";
import MyAppointments from "./pages/MyAppointments";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Appointments from "./pages/admin/Appointments";
import Subscriptions from "./pages/admin/Subscriptions";
import Clients from "./pages/admin/Clients";
import Barbers from "./pages/admin/Barbers";
import BarberDetail from "./pages/admin/BarberDetail";
import Services from "./pages/admin/Services";
import Settings from "./pages/admin/Settings";
import Users from "./pages/admin/Users";
import BarberPanel from "./pages/admin/BarberPanel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <InstallPWA />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/agendar" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
            <Route path="/assinatura" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
            <Route path="/meus-agendamentos" element={<ProtectedRoute><MyAppointments /></ProtectedRoute>} />
            
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="agendamentos" element={<Appointments />} />
              <Route path="assinaturas" element={<Subscriptions />} />
              <Route path="clientes" element={<Clients />} />
              <Route path="barbeiros" element={<Barbers />} />
              <Route path="barbeiros/:id" element={<BarberDetail />} />
              <Route path="servicos" element={<Services />} />
              <Route path="usuarios" element={<Users />} />
              <Route path="configuracoes" element={<Settings />} />
              <Route path="barbeiro/agenda" element={<BarberPanel />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
