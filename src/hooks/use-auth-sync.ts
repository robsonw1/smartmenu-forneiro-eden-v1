import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLoyaltyStore } from '@/store/useLoyaltyStore';
import { toast } from 'sonner';

/**
 * Hook Universal de Sincronização de Autenticação
 * - Funciona com Google, Email/Senha e qualquer outro método Supabase Auth
 * - Sincroniza automaticamente com Loyalty Store
 * - Monitora mudanças em tempo real
 */
export function useAuthSync() {
  const findOrCreateCustomer = useLoyaltyStore((s) => s.findOrCreateCustomer);
  const setCurrentCustomer = useLoyaltyStore((s) => s.setCurrentCustomer);

  useEffect(() => {
    let isMounted = true;

    // Normalizar email
    const normalizeEmail = (email: string): string => {
      return email
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    };

    const syncAuthWithLoyalty = async () => {
      try {
        // Obter sessão atual
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (error) {
          console.error('🔴 Erro ao obter sessão:', error);
          return;
        }

        // Se há sessão e email, sincronizar com Loyalty Store
        if (session?.user?.email) {
          const normalizedEmail = normalizeEmail(session.user.email);
          
          console.log('🔄 Sincronizando Auth com Loyalty Store...');
          console.log('📧 Email:', normalizedEmail);

          // Auto-carregar dados do cliente (ou criar se não existir)
          const customer = await findOrCreateCustomer(normalizedEmail);
          
          if (customer) {
            console.log('✅ Cliente sincronizado:', customer.name || normalizedEmail);
            console.log('💰 Pontos disponíveis:', customer.totalPoints);
            setCurrentCustomer(customer); // 👈 CRITICAL FIX!
          } else {
            console.log('⚠️ Falha ao sincronizar cliente');
          }
        } else {
          // Sem sessão = sem cliente
          if (!isMounted) return;
          setCurrentCustomer(null);
        }
      } catch (error) {
        console.error('🔴 Erro em useAuthSync:', error);
      }
    };

    // Sincronizar na primeira renderização
    syncAuthWithLoyalty();

    // Monitorar mudanças na autenticação
    const subscription = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      console.log('🔔 Auth state changed:', event);

      switch (event) {
        case 'SIGNED_IN':
          if (session?.user?.email) {
            const normalizedEmail = normalizeEmail(session.user.email);
            console.log('🆕 Login detectado:', normalizedEmail);

            // Auto-sincronizar
            const customer = await findOrCreateCustomer(normalizedEmail);
            if (customer) {
              console.log('✅ Cliente carregado:', customer.name || normalizedEmail);
              console.log('💰 Pontos:', customer.totalPoints);
              setCurrentCustomer(customer); // 👈 CRITICAL FIX!
              toast.success('✅ Cliente sincronizado!');
            }
          }
          break;

        case 'SIGNED_OUT':
          console.log('👋 Logout detectado');
          setCurrentCustomer(null);
          toast.success('Logout realizado');
          break;

        case 'TOKEN_REFRESHED':
          console.log('🔄 Token renovado');
          if (session?.user?.email) {
            const normalizedEmail = normalizeEmail(session.user.email);
            await findOrCreateCustomer(normalizedEmail);
          }
          break;

        case 'USER_UPDATED':
          console.log('📝 Usuário atualizado');
          if (session?.user?.email) {
            const normalizedEmail = normalizeEmail(session.user.email);
            await findOrCreateCustomer(normalizedEmail);
          }
          break;
      }
    });

    // Cleanup
    return () => {
      isMounted = false;
      subscription.data.subscription?.unsubscribe();
    };
  }, [findOrCreateCustomer, setCurrentCustomer]);
}
