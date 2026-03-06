import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLoyaltyStore } from '@/store/useLoyaltyStore';
import { toast } from 'sonner';

// Normalizar email
const normalizeEmail = (email: string): string => {
  return email
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const findOrCreateCustomer = useLoyaltyStore((s) => s.findOrCreateCustomer);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // 1️⃣ Supabase processa a resposta OAuth automaticamente
        // O hash URL é consumido pelo Supabase Auth internamente
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          console.error('🔴 Erro na autenticação:', error);
          toast.error('❌ Erro ao autenticar com Google');
          setTimeout(() => navigate('/'), 2000);
          return;
        }

        // 2️⃣ Session existe, autenticação bem-sucedida
        console.log('✅ OAuth bem-sucedido, sessão obtida');
        console.log('📧 Email:', session.user.email);
        console.log('🆔 User ID:', session.user.id);

        // 3️⃣ Sincronizar com Loyalty Store
        if (session.user.email) {
          const normalizedEmail = normalizeEmail(session.user.email);
          console.log('🔄 Sincronizando com Loyalty Store...');
          
          const customer = await findOrCreateCustomer(normalizedEmail);
          
          if (customer) {
            console.log('✅ Cliente sincronizado:', customer.name || normalizedEmail);
            console.log('💰 Pontos disponíveis:', customer.totalPoints);
            toast.success('✅ Autenticado com Google!');
          } else {
            console.warn('⚠️ Cliente não sincronizado');
            toast.success('✅ Autenticado com Google!');
          }
        }

        // 4️⃣ Redirecionar para página principal
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 500);
      } catch (error) {
        console.error('🔴 Erro ao processar callback:', error);
        toast.error('❌ Erro ao processar autenticação');
        setTimeout(() => navigate('/'), 2000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, [navigate, findOrCreateCustomer]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">
          {isProcessing ? 'Processando autenticação...' : 'Redirecionando...'}
        </p>
      </div>
    </div>
  );
}
