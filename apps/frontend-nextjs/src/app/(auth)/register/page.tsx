'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap } from 'lucide-react';
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
      toast.success('Account created!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.message ?? 'Registration failed');
    }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="p-2 bg-primary/10 rounded-xl"><Zap className="w-6 h-6 text-primary" /></div>
            <span className="text-xl font-bold text-foreground">SwingTrader Pro</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Create account</h1>
          <p className="text-sm text-muted-foreground mt-1">Start your trading journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name" value={form.firstName} onChange={set('firstName')} placeholder="Rahul" required />
            <Input label="Last Name" value={form.lastName} onChange={set('lastName')} placeholder="Sharma" required />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
          <Input label="Password" type="password" value={form.password} onChange={set('password')} placeholder="Min 8 characters" required minLength={8} />
          <Input
            label="Initial Capital (₹)"
            type="number"
            value={form.initialCapital}
            onChange={set('initialCapital')}
            prefix="₹"
            min="1000"
            placeholder="100000"
          />
          <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
