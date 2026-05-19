'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const { login, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.message ?? 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground">SwingTrader Pro</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to your trading account</p>
        </div>

        {/* Demo credentials */}
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-400">
          <p className="font-semibold mb-1">Demo Account</p>
          <p>Email: demo@swingtrader.in</p>
          <p>Password: Demo@12345</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Password</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-9 bg-input border border-border rounded-lg text-sm text-foreground px-3 pr-10 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
            Sign In
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          New to SwingTrader?{' '}
          <Link href="/register" className="text-primary hover:underline font-medium">Create account</Link>
        </p>
      </div>
    </div>
  );
}
