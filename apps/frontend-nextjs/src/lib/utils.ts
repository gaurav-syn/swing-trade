import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatNumber(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatLargeNumber(value: number): string {
  if (value >= 1_00_00_00_000) return `₹${(value / 1_00_00_00_000).toFixed(1)}K Cr`;
  if (value >= 1_00_00_000) return `₹${(value / 1_00_00_000).toFixed(1)} Cr`;
  if (value >= 1_00_000) return `₹${(value / 1_00_000).toFixed(1)}L`;
  return formatCurrency(value);
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return format(new Date(date), 'dd MMM yyyy');
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return format(new Date(date), 'dd MMM yyyy, hh:mm a');
}

export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function getPnlColor(value: number | null | undefined): string {
  if (!value) return 'text-muted-foreground';
  return value >= 0 ? 'text-profit' : 'text-loss';
}

export function getSignalColor(strength: string): string {
  const colors: Record<string, string> = {
    VERY_STRONG: 'text-green-400 bg-green-400/10',
    STRONG: 'text-blue-400 bg-blue-400/10',
    MODERATE: 'text-yellow-400 bg-yellow-400/10',
    WEAK: 'text-red-400 bg-red-400/10',
  };
  return colors[strength] ?? 'text-muted-foreground';
}

export function getScoreColor(score: number): string {
  if (score >= 75) return 'text-green-400';
  if (score >= 60) return 'text-blue-400';
  if (score >= 45) return 'text-yellow-400';
  return 'text-red-400';
}

export function calculatePnl(entryPrice: number, currentPrice: number, qty: number): number {
  return (currentPrice - entryPrice) * qty;
}

export function calculatePnlPercent(entryPrice: number, currentPrice: number): number {
  return ((currentPrice - entryPrice) / entryPrice) * 100;
}

export function downloadCsv(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
