import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { signUpWithEmail, signInWithEmail } from '@/lib/auth-service';
import { useLoyaltyStore } from '@/store/useLoyaltyStore';

const Login = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

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
