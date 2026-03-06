import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import { useSettingsRealtimeSync } from "@/hooks/use-settings-realtime-sync";
import { useSettingsInitialLoad } from "@/hooks/use-settings-initial-load";
import { useScheduleSync } from "@/hooks/use-schedule-sync";
import { useSettingsUpdateListener } from "@/hooks/use-settings-update-listener";
import { useLoyaltySettingsStore } from "@/store/useLoyaltySettingsStore";
import { useSettingsStore } from "@/store/useSettingsStore";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import AdminLogin from "./pages/AdminLogin.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import AuthCallbackPage from "./pages/AuthCallbackPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

// Componente wrapper para usar hooks
const AppContent = () => {
  useRealtimeSync();
  useSettingsInitialLoad();
  useSettingsRealtimeSync();
  useScheduleSync();
  useSettingsUpdateListener(); // ✅ Monitorar atualizações do admin
  const { loadSettings } = useLoyaltySettingsStore();

  // Carregar configurações de fidelização ao iniciar
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);
  
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '157577548087-9ek1jto5rgbrevh6gelrs6ebajgph0o9.apps.googleusercontent.com';
  
  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={googleClientId}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
};

export default App;
