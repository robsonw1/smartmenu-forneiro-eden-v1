// Lovable Cloud Auth SDK - Handles Google OAuth via Lovable Cloud
// This file provides a wrapper around Supabase Auth for Google OAuth with proper redirect handling

import { supabase } from '../supabase/client';

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (provider: "google" | "apple", opts?: SignInOptions) => {
      try {
        // Determinar URL de redirecionamento
        const redirectTo = opts?.redirect_uri || (window.location.origin + '/auth/callback');

        console.log('🔐 Iniciando OAuth:', { provider, redirectTo });

        // Chamar Supabase Auth com redirectTo explícito
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: provider,
          options: {
            redirectTo: redirectTo,
            queryParams: opts?.extraParams,
          },
        });

        if (error) {
          console.error('❌ Erro OAuth:', error);
          return { error };
        }

        console.log('✅ OAuth iniciado, redirecionando...');
        return { data, error: null };
      } catch (e) {
        console.error('🔴 Erro ao iniciar OAuth:', e);
        return { error: e instanceof Error ? e : new Error(String(e)) };
      }
    },
  },
};
