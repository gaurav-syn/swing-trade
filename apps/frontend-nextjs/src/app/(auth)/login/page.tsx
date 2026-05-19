'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, Eye, EyeOff, TrendingUp, Shield, BarChart2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

const features = [
  { icon: BarChart2, title: 'NSE/BSE Scanner', desc: 'Multi-indicator stock scanner with AI scoring' },
  { icon: TrendingUp, title: 'Live Portfolio', desc: 'Real-time P&L tracking across all positions' },
  { icon: Shield, title: 'Risk Management', desc: 'Automated stop-loss and position sizing' },
];

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const { login, isLoading }    = useAuthStore();
  const router                  = useRouter();

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
    <div className="min-h-screen flex bg-background">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[52%] auth-gradient relative overflow-hidden flex-col justify-between p-12">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(hsl(213,94%,68%) 1px, transparent 1px), linear-gradient(90deg, hsl(213,94%,68%) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Glow blobs */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-foreground text-lg leading-none">SwingTrader</p>
            <p className="text-xs text-primary/80 font-medium tracking-widest uppercase">Pro Platform</p>
          </div>
        </div>

        {/* Tagline */}
        <div className="relative space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-foreground leading-tight">
              Trade smarter,<br />
              <span className="text-primary">not harder.</span>
            </h1>
            <p className="text-muted-foreground mt-3 leading-relaxed max-w-xs">
              Professional-grade swing trading platform built for Indian markets — NSE &amp; BSE.
            </p>
          </div>

          <div className="space-y-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-9 h-9 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats strip */}
          <div className="flex gap-6 pt-4 border-t border-white/5">
            {[['500+', 'NSE Stocks'], ['10+', 'Indicators'], ['Real-time', 'Data']].map(([val, label]) => (
              <div key={label}>
                <p className="text-lg font-bold text-primary">{val}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom disclaimer */}
        <p className="relative text-[11px] text-muted-foreground/50 max-w-xs">
          For educational and research purposes. Not SEBI registered. Past performance does not guarantee future results.
        </p>
      </div>

      {/* ── Right panel — Login form ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm space-y-8 animate-slide-up">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-foreground">SwingTrader Pro</span>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
            <p className="text-sm text-muted-foreground mt-1">Sign in to your trading account</p>
          </div>

          {/* Demo banner */}
          <div className="p-3.5 rounded-xl bg-primary/8 border border-primary/20 text-xs">
            <p className="font-semibold text-primary mb-1.5">Demo Account</p>
            <div className="space-y-0.5 text-muted-foreground font-mono">
              <p>demo@swingtrader.in</p>
              <p>Demo@12345</p>
            </div>
            <button
              type="button"
              onClick={() => { setEmail('demo@swingtrader.in'); setPassword('Demo@12345'); }}
              className="mt-2 text-primary hover:text-primary/80 flex items-center gap-1 font-medium"
            >
              Fill automatically <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
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
                  className="w-full h-10 bg-input border border-border rounded-lg text-sm text-foreground px-3 pr-10 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" isLoading={isLoading} className="w-full h-11 text-sm font-semibold" size="lg">
              Sign In
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            New to SwingTrader?{' '}
            <Link href="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
              Create free account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
