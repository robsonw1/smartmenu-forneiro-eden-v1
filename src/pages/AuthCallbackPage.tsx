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
    // ✅ Função auxiliar - deve estar ANTES de ser usada
    const processAuthSuccess = async (session: any) => {
      try {
        // 4️⃣ Session existe, autenticação bem-sucedida
        console.log('✅ OAuth bem-sucedido, sessão obtida');
        console.log('📧 Email:', session.user.email);
        console.log('🆔 User ID:', session.user.id);

        // 5️⃣ Sincronizar com Loyalty Store
        if (session.user.email) {
          const normalizedEmail = normalizeEmail(session.user.email);
          console.log('🔄 Sincronizando com Loyalty Store...');
          
          const customer = await findOrCreateCustomer(normalizedEmail);
          
          if (customer) {
            console.log('✅ Cliente sincronizado:', customer.name || normalizedEmail);
            console.log('💰 Pontos disponíveis:', customer.totalPoints);
            toast.success('✅ Autenticado com Google!');
          } else {
            console.warn('⚠️ Cliente não sincronizado ainda');
            toast.success('✅ Autenticado com Google!');
          }
        }

        // 6️⃣ Redirecionar para página principal
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 500);
      } catch (error) {
        console.error('🔴 Erro ao processar sucesso:', error);
        toast.error('❌ Erro ao sincronizar dados');
        setTimeout(() => navigate('/', { replace: true }), 2000);
      }
    };

    // ✅ Função principal do callback
    const handleAuthCallback = async () => {
      try {
        // ✅ FLUXO PKCE (Documentação Oficial Supabase)
        // 1️⃣ Extrair o "code" da URL (Google não usa hash, usa query params com code)
        const code = searchParams.get('code');

        if (!code) {
          console.warn('⚠️ Nenhum code na URL - verificando sessão existente...');
          
          // Se não houver code, pode ser que a sessão já foi processada
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (session && !error) {
            console.log('✅ Sessão existente encontrada');
            await processAuthSuccess(session);
            return;
          }
          
          // Sem code e sem sessão = erro
          toast.error('❌ Código de autenticação ausente');
          setTimeout(() => navigate('/', { replace: true }), 2000);
          return;
        }

        // 2️⃣ Trocar o code por uma sessão válida (exchangeCodeForSession)
        console.log('🔐 Trocando code por sessão...');
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error('🔴 Erro ao trocar code por sessão:', error);
          toast.error('❌ Falha na autenticação: ' + error.message);
          setTimeout(() => navigate('/', { replace: true }), 2000);
          return;
        }

        if (!data.session) {
          console.error('🔴 Nenhuma sessão retornada');
          toast.error('❌ Sessão não obtida');
          setTimeout(() => navigate('/', { replace: true }), 2000);
          return;
        }

        // 3️⃣ Sessão válida - processar sucesso
        console.log('✅ Code trocado por sessão com sucesso!');
        await processAuthSuccess(data.session);
      } catch (error) {
        console.error('🔴 Erro crítico ao processar callback:', error);
        toast.error('❌ Erro ao processar autenticação');
        setTimeout(() => navigate('/', { replace: true }), 2000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, [navigate, findOrCreateCustomer, searchParams]);

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
