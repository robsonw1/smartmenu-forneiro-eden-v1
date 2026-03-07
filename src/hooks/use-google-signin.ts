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
        // Com retry automático em caso de erro transitório
        let retries = 0;
        let lastError: any = null;

        while (retries < 2) {
          try {
            const { data, error } = await supabase.auth.signInWithIdToken({
              provider: 'google',
              token: idToken,
            });

            if (error) {
              lastError = error;
              console.error(`❌ Tentativa ${retries + 1}: Erro ao autenticar:`, error.message);
              
              // Se for erro de banco de dados transitório, fazer retry
              if (error.message?.includes('Database error') && retries < 1) {
                retries++;
                console.log(`⏳ Tentando novamente em 1 segundo...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
              }

              // Outro erro - não fazer retry
              toast.error('❌ Erro na autenticação: ' + error.message);
              return { success: false, error };
            }

            if (!data.session) {
              console.error('❌ Sessão não criada');
              toast.error('❌ Erro: Sessão não foi criada');
              return { success: false, error: new Error('Sem sessão') };
            }

            // ✅ Autenticação bem-sucedida
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
          } catch (innerError) {
            lastError = innerError;
            console.error(`❌ Tentativa ${retries + 1} - Erro interno:`, innerError);
            retries++;
            if (retries < 2) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }

        // Se chegou aqui depois de retries
        console.error('❌ Autenticação falhou após retries');
        toast.error('❌ Erro na autenticação. Tente novamente.');
        return { success: false, error: lastError };
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
