import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { signUpWithEmail, signInWithEmail } from '@/lib/auth-service';
import { useLoyaltyStore } from '@/store/useLoyaltyStore';

const Login = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { setCurrentCustomer } = useLoyaltyStore();

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup form
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupCPF, setSignupCPF] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  // Se já está logado, redireciona para a página inicial
  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  // Handle Login com Email/Senha
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!loginEmail || !loginPassword) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }

    setLoginLoading(true);
    const result = await signInWithEmail(loginEmail, loginPassword);
    setLoginLoading(false);

    if (result.success) {
      toast.success('✅ ' + result.message);
      setTimeout(() => navigate('/'), 1500);
    } else {
      toast.error('❌ ' + result.error);
    }
  };

  // Handle Registro com Email/Senha
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signupEmail || !signupPassword || !signupName) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (signupPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setSignupLoading(true);
    const result = await signUpWithEmail(signupEmail, signupPassword, signupName, signupCPF, signupPhone);
    setSignupLoading(false);

    if (result.success) {
      toast.success('✅ Conta criada com sucesso! Verifique seu email.');
      // Limpar formulário
      setSignupEmail('');
      setSignupPassword('');
      setSignupConfirmPassword('');
      setSignupName('');
      setSignupCPF('');
      setSignupPhone('');
      setTimeout(() => navigate('/'), 2000);
    } else {
      toast.error('❌ ' + result.error);
    }
  };

  // Handle Google Login - Fluxo PKCE (Documentação Oficial Supabase 2025)
  const handleGoogleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // ✅ CRÍTICO: Este é o redirectTo que DEVE estar registrado no Google Cloud Console
          redirectTo: `${window.location.origin}/auth/callback`,
          // ✅ Fluxo PKCE completo (recomendado pela documentação oficial)
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('❌ Erro OAuth - Login Google:', error);
        toast.error('❌ Erro ao fazer login com Google: ' + error.message);
      } else {
        console.log('✅ OAuth iniciado - redirecionando para Google...');
      }
    } catch (error) {
      console.error('🔴 Erro crítico ao iniciar OAuth:', error);
      toast.error('❌ Erro inesperado ao fazer login');
    }
  };

  // Handle Google Signup - Mesmo fluxo (Supabase cria conta automaticamente)
  const handleGoogleSignup = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // ✅ CRÍTICO: Mesmo redirectTo que no login
          redirectTo: `${window.location.origin}/auth/callback`,
          // ✅ Fluxo PKCE completo
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('❌ Erro OAuth - Signup Google:', error);
        toast.error('❌ Erro ao fazer registro com Google: ' + error.message);
      } else {
        console.log('✅ OAuth iniciado - redirecionando para Google...');
      }
    } catch (error) {
      console.error('🔴 Erro crítico ao iniciar OAuth:', error);
      toast.error('❌ Erro inesperado ao fazer registro');
    }
  };

  // Mostra spinner enquanto verifica se já há sessão ativa
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-primary-foreground">🍕</span>
          </div>
          <CardTitle className="font-heading text-2xl">Forneiro Éden</CardTitle>
          <CardDescription>Acesse sua conta ou crie uma nova</CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar Conta</TabsTrigger>
            </TabsList>

            {/* TAB: LOGIN */}
            <TabsContent value="login" className="space-y-4">
              {/* Google Login */}
              <Button
                onClick={handleGoogleLogin}
                variant="outline"
                className="w-full h-12 text-base gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Entrar com Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-muted"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              {/* Email Login */}
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={loginLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="sua senha"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    disabled={loginLoading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-10"
                  disabled={loginLoading}
                >
                  {loginLoading ? '⏳ Entrando...' : 'Entrar com Email'}
                </Button>
              </form>

              <p className="text-xs text-muted-foreground text-center">
                Ao entrar, você concorda com nossos termos de uso
              </p>
            </TabsContent>

            {/* TAB: SIGNUP */}
            <TabsContent value="signup" className="space-y-4">
              {/* Google Signup */}
              <Button
                onClick={handleGoogleSignup}
                variant="outline"
                className="w-full h-12 text-base gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Criar conta com Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-muted"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              {/* Email Signup */}
              <form onSubmit={handleEmailSignup} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome Completo *</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Seu nome"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    disabled={signupLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email *</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    disabled={signupLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-cpf">CPF</Label>
                  <Input
                    id="signup-cpf"
                    type="text"
                    placeholder="000.000.000-00"
                    value={signupCPF}
                    onChange={(e) => setSignupCPF(e.target.value)}
                    disabled={signupLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Telefone</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    disabled={signupLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha *</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    disabled={signupLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirmar Senha *</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder="Confirme sua senha"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    disabled={signupLoading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-10"
                  disabled={signupLoading}
                >
                  {signupLoading ? '⏳ Criando conta...' : 'Criar Conta'}
                </Button>
              </form>

              <p className="text-xs text-muted-foreground text-center">
                Ao criar conta, você concorda com nossos termos de uso
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
