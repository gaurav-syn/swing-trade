'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', initialCapital: '100000',
  });
  const { register, isLoading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({ ...form, initialCapital: Number(form.initialCapital) });
      toast.success('Account created! Welcome aboard.');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.message ?? 'Registration failed');
    }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 animate-slide-up">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 bg-primary/15 border border-primary/25 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground">SwingTrader Pro</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
            <p className="text-sm text-muted-foreground mt-1">Start your trading journey today</p>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-card space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="First Name" value={form.firstName} onChange={set('firstName')} placeholder="Rahul" required />
              <Input label="Last Name"  value={form.lastName}  onChange={set('lastName')}  placeholder="Sharma" required />
            </div>
            <Input label="Email address" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
            <Input label="Password" type="password" value={form.password} onChange={set('password')} placeholder="Minimum 8 characters" required minLength={8} />

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Initial Capital (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">₹</span>
                <input
                  type="number"
                  value={form.initialCapital}
                  onChange={set('initialCapital')}
                  min="1000"
                  placeholder="100000"
                  className="w-full h-10 bg-input border border-border rounded-lg text-sm text-foreground pl-7 pr-3 placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">This is your virtual starting capital for paper trading</p>
            </div>

            <Button type="submit" isLoading={isLoading} className="w-full h-11 font-semibold" size="lg">
              Create Account
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-3 text-muted-foreground">Already have an account?</span>
            </div>
          </div>

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full h-10 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </Link>
        </div>

        <p className="text-center text-[11px] text-muted-foreground/50">
          For educational purposes only. Not SEBI registered investment advice.
        </p>
      </div>
    </div>
  );
}
