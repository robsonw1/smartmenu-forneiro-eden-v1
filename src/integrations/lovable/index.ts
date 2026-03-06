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
        const redirectUrl = opts?.redirect_uri || window.location.origin;
        
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: provider,
          options: {
            redirectTo: redirectUrl,
            queryParams: opts?.extraParams,
          },
        });

        if (error) {
          return { error };
        }

        return { data, error: null };
      } catch (e) {
        return { error: e instanceof Error ? e : new Error(String(e)) };
      }
    },
  },
};
