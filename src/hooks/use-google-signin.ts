import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLoyaltyStore } from '@/store/useLoyaltyStore';
import { toast } from 'sonner';

/**
 * Hook para autenticar com Google usando ID Token
 * Usa Google Sign-In (GSI) em vez de OAuth redirect
 * ZERO problemas de redirect_uri_mismatch!
 */
export const useGoogleSignIn = () => {
  const findOrCreateCustomer = useLoyaltyStore((s) => s.findOrCreateCustomer);
  const setCurrentCustomer = useLoyaltyStore((s) => s.setCurrentCustomer);

  // Normalizar email (mesmo padrão usado em AuthCallbackPage)
  const normalizeEmail = (email: string): string => {
    return email
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  /**
   * Autentica com Google usando ID Token (do Google Sign-In Button)
   * Elimina completamente o erro redirect_uri_mismatch
   * 
   * Fluxo:
   * 1. Cliente recebe ID Token do Google Sign-In Button
   * 2. Chama supabase.auth.signInWithIdToken() direto
   * 3. Supabase valida e cria sessão
   * 4. Sincroniza com Loyalty Store
   */
  const authWithGoogleIdToken = useCallback(
    async (idToken: string) => {
      try {
        console.log('🔐 Autenticando com Google ID Token (SEM REDIRECT!)...');

        // ✅ Chamar Supabase direto - signInWithIdToken funciona no cliente
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });

        if (error) {
          console.error('❌ Erro ao autenticar:', error);
          toast.error('❌ Erro na autenticação: ' + error.message);
          return { success: false, error };
        }

        if (!data.session) {
          console.error('❌ Sessão não criada');
          toast.error('❌ Erro: Sessão não foi criada');
          return { success: false, error: new Error('Sem sessão') };
        }

        // 2️⃣ Sessão criada com sucesso
        console.log('✅ ID Token validado, sessão criada');
        console.log('📧 Email:', data.session.user.email);
        console.log('🆔 User ID:', data.session.user.id);

        // 3️⃣ Sincronizar com Loyalty Store
        if (data.session.user.email) {
          const normalizedEmail = normalizeEmail(data.session.user.email);
          console.log('🔄 Sincronizando com Loyalty Store...');

          const customer = await findOrCreateCustomer(normalizedEmail);

          if (customer) {
            console.log('✅ Cliente sincronizado:', customer.name || normalizedEmail);
            console.log('💰 Pontos disponíveis:', customer.totalPoints);
            setCurrentCustomer(customer);
            toast.success('✅ Autenticado com Google!');
          } else {
            console.warn('⚠️ Cliente não sincronizado ainda');
            toast.success('✅ Autenticado com Google!');
          }
        }

        return { success: true, session: data.session };
      } catch (error) {
        console.error('🔴 Erro crítico ao autenticar:', error);
        toast.error('❌ Erro inesperado na autenticação');
        return { success: false, error };
      }
    },
    [findOrCreateCustomer, setCurrentCustomer]
  );

  return { authWithGoogleIdToken };
};
