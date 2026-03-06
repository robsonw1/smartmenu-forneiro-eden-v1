import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLoyaltyStore } from '@/store/useLoyaltyStore';
import { toast } from 'sonner';

// 🔒 Normalizar email: lowercase + trim + remove acentos
const normalizeEmail = (email: string): string => {
  return email
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

/**
 * Hook que sincroniza autenticação Google com Loyalty Store
 * - Monitora mudanças na sessão Supabase
 * - Auto-carrega dados do cliente quando há sessão válida
 * - Sincroniza em tempo real
 */
export function useGoogleAuthSync() {
  const findOrCreateCustomer = useLoyaltyStore((s) => s.findOrCreateCustomer);
  const currentCustomer = useLoyaltyStore((s) => s.currentCustomer);

  useEffect(() => {
    let isMounted = true;

    const syncAuthWithLoyalty = async () => {
      try {
        // 1️⃣ Obter sessão atual
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (error) {
          console.error('🔴 Erro ao obter sessão:', error);
          return;
        }

        // 2️⃣ Se há sessão e email, sincronizar com Loyalty Store
        if (session?.user?.email) {
          const normalizedEmail = normalizeEmail(session.user.email);
          
          console.log('🔄 Sincronizando Google Auth com Loyalty Store...');
          console.log('📧 Email:', normalizedEmail);

          // Auto-carregar dados do cliente (ou criar se não existir)
          const customer = await findOrCreateCustomer(normalizedEmail);
          
          if (customer) {
            console.log('✅ Cliente sincronizado:', customer.name || normalizedEmail);
          } else {
            console.log('⚠️ Falha ao sincronizar cliente');
          }
        }
      } catch (error) {
        console.error('🔴 Erro em useGoogleAuthSync:', error);
      }
    };

    // Sincronizar na primeira renderização
    syncAuthWithLoyalty();

    // 3️⃣ Monitorar mudanças na autenticação
    const subscription = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      console.log('🔔 Auth state changed:', event);

      if (event === 'SIGNED_IN' && session?.user?.email) {
        // Novo login via Google
        const normalizedEmail = normalizeEmail(session.user.email);
        console.log('🆕 Novo login detectado:', normalizedEmail);

        // Auto-sincronizar
        const customer = await findOrCreateCustomer(normalizedEmail);
        if (customer) {
          toast.success('✅ Sincronizado com Google!');
        }
      } else if (event === 'SIGNED_OUT') {
        // Logout (não fazer nada aqui, deixar para o componente tratar)
        console.log('🔓 Logout detectado');
      }
    });

    return () => {
      isMounted = false;
      subscription.data?.subscription?.unsubscribe();
    };
  }, [findOrCreateCustomer]);

  return { currentCustomer };
}
