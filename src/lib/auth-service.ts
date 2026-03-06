import { supabase } from '@/integrations/supabase/client';
import { useLoyaltyStore } from '@/store/useLoyaltyStore';

// Normalizar email
export const normalizeEmail = (email: string): string => {
  return email
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

/**
 * Registrar novo cliente com email e senha
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  name: string,
  cpf?: string,
  phone?: string
) {
  try {
    const normalizedEmail = normalizeEmail(email);

    // 1. Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password: password,
      options: {
        data: {
          full_name: name,
          cpf: cpf,
          phone: phone,
        },
      },
    });

    if (authError) {
      console.error('Erro ao criar usuário:', authError);
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return { success: false, error: 'Erro ao criar conta' };
    }

    // 2. Registrar cliente no programa de fidelidade
    const loyaltyStore = useLoyaltyStore.getState();
    const registered = await loyaltyStore.registerCustomer(normalizedEmail, cpf || '', name, phone);

    if (!registered) {
      console.warn('Cliente criado em Auth mas não registrado no programa de fidelidade');
    }

    return {
      success: true,
      user: authData.user,
      message: 'Conta criada com sucesso! Você será redirecionado...',
    };
  } catch (error) {
    console.error('Erro em signUpWithEmail:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Login com email e senha
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    const normalizedEmail = normalizeEmail(email);

    // 1. Autenticar com Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: password,
    });

    if (authError) {
      console.error('Erro ao fazer login:', authError);
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      return { success: false, error: 'Erro ao fazer login' };
    }

    // 2. Buscar dados do cliente no programa de fidelidade
    const loyaltyStore = useLoyaltyStore.getState();
    const customer = await loyaltyStore.findOrCreateCustomer(normalizedEmail);

    if (!customer) {
      console.warn('Usuário autenticado mas cliente não encontrado no programa de fidelidade');
    }

    return {
      success: true,
      user: authData.user,
      customer: customer,
      message: 'Login realizado com sucesso!',
    };
  } catch (error) {
    console.error('Erro em signInWithEmail:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Logout
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Erro ao fazer logout:', error);
      return { success: false, error: error.message };
    }

    // Limpar dados do cliente
    const loyaltyStore = useLoyaltyStore.getState();
    loyaltyStore.setCurrentCustomer(null);

    return { success: true, message: 'Logout realizado com sucesso!' };
  } catch (error) {
    console.error('Erro em signOut:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Sincronizar dados do usuário autenticado com programa de fidelidade
 */
export async function syncUserWithLoyalty(userEmail: string) {
  try {
    const normalizedEmail = normalizeEmail(userEmail);
    const loyaltyStore = useLoyaltyStore.getState();
    
    console.log('🔄 Sincronizando usuário com Loyalty Store:', normalizedEmail);
    const customer = await loyaltyStore.findOrCreateCustomer(normalizedEmail);
    
    if (customer) {
      console.log('✅ Cliente sincronizado:', customer.name || normalizedEmail);
      console.log('💰 Pontos:', customer.totalPoints);
    }
    
    return { success: true, customer };
  } catch (error) {
    console.error('❌ Erro em syncUserWithLoyalty:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Sincronizar Google Session com Loyalty Store
 * Útil para quando Google OAuth redireciona para app
 */
export async function syncGoogleSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.user?.email) {
      console.warn('⚠️ Nenhuma sessão Google encontrada');
      return { success: false, error: 'Sem sessão' };
    }
    
    console.log('🔄 Sincronizando sessão Google:', session.user.email);
    return await syncUserWithLoyalty(session.user.email);
  } catch (error) {
    console.error('❌ Erro em syncGoogleSession:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}
