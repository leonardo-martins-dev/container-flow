import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast({ title: 'Preencha email e senha', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      toast({ title: 'Login realizado', description: 'Bem-vindo ao Container Flow.' });
      navigate('/', { replace: true });
    } catch (err) {
      toast({
        title: 'Erro no login',
        description: err instanceof Error ? err.message : 'Credenciais inválidas',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md glass">
        <CardHeader>
          <CardTitle className="text-2xl">Container Flow</CardTitle>
          <CardDescription>Entre com seu email e senha para acessar o sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Entrar'}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Primeiro acesso? Use admin@containerflow.local / admin123
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
