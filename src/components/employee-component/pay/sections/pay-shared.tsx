import type { ReactNode } from 'react';
import { CalendarCheck, CalendarX, Eye, EyeOff, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STAT_TONE_CLASS, type StatTone } from '@/components/ui/stat-card';
import { cn } from '@/lib/utils';
import { formatINR, formatShortMonth, grossPay, takeHomePay, type Payslip } from '@/lib/payroll';
import { formatFinancialYear } from './pay-utils';

/*
 * Building blocks shared by the Pay & Tax cards, sheets and tabs.
 * Amounts are hidden (₹ ******) until the person presses Show, as on a shared screen.
 */

export const MASK = '••••••';

export function MaskedAmount({ amount, visible, className }: { amount: number; visible: boolean; className?: string }) {
  return (
    <span className={cn('tabular-nums', className)} aria-label={visible ? undefined : 'Amount hidden'}>
      {visible ? formatINR(amount) : `₹ ${MASK}`}
    </span>
  );
}

export function ShowToggle({ visible, onToggle, label = 'amounts' }: { visible: boolean; onToggle: () => void; label?: string }) {
  const Icon = visible ? EyeOff : Eye;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={visible}
      aria-label={`${visible ? 'Hide' : 'Show'} ${label}`}
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-[#464EB8] hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#464EB8]/40"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {visible ? 'Hide' : 'Show'}
    </button>
  );
}

// Pay split colours come from the chosen colour sample (see pay-theme.ts); both slices are always labelled
export const TAKE_HOME_COLOR = 'var(--pay-take)';
export const DEDUCTION_COLOR = 'var(--pay-ded)';

// Ring: take-home share and deductions share; the take-home share in the middle
export function PayDonut({ payslip, size = 96 }: { payslip: Payslip; size?: number }) {
  const gross = grossPay(payslip);
  const share = gross > 0 ? takeHomePay(payslip) / gross : 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={`${formatShortMonth(payslip.month)}: take home is ${Math.round(share * 100)}% of gross pay`} className="shrink-0">
      <circle cx="50" cy="50" r={radius} fill="none" style={{ stroke: DEDUCTION_COLOR }} strokeWidth="12" />
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        style={{ stroke: TAKE_HOME_COLOR }}
        strokeWidth="12"
        strokeDasharray={`${share * circumference - 2} ${circumference}`}
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="50" textAnchor="middle" className="fill-gray-900 text-[18px] font-bold">
        {Math.round(share * 100)}%
      </text>
      <text x="50" y="65" textAnchor="middle" className="fill-gray-500 text-[10px]">
        take home
      </text>
    </svg>
  );
}

// White card with a heading row; used for every Pay & Tax tile
// `tone` colours the icon tile, as on the Leave Tracker stat cards
export function PayCard({ title, icon: Icon, tone = 'indigo', action, children, className }: { title: ReactNode; icon?: LucideIcon; tone?: StatTone; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card className={cn('h-full border-0 shadow-lg', className)}>
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            {Icon && (
              <span className={cn('rounded-lg p-1.5', STAT_TONE_CLASS[tone])}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
            )}
            {title}
          </h2>
          {action}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export function FinancialYearSelect({ years, value, onChange, id, label = 'Financial Year', className }: { years: string[]; value: string; onChange: (year: string) => void; id: string; label?: string; className?: string }) {
  return (
    <div className={cn('space-y-1', className)}>
      <label htmlFor={id} className="text-xs font-medium text-gray-600">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="bg-white">
          <SelectValue placeholder="Select one…" />
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year}>
              {formatFinancialYear(year)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

const STATUS_CLASS: Record<string, string> = {
  Approved: 'bg-[var(--pay-approved-bg)] text-[var(--pay-approved-fg)]',
  'Partially Approved': 'bg-[var(--pay-partial-bg)] text-[var(--pay-partial-fg)]',
  Rejected: 'bg-slate-200 text-slate-700',
  Pending: 'bg-indigo-100 text-indigo-800',
};

export function ApprovalBadge({ status }: { status: string }) {
  return <span className={cn('inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_CLASS[status] ?? 'bg-gray-100 text-gray-800')}>{status}</span>;
}

// Open / closed pill for the tax and claim submission periods
export function WindowBadge({ open }: { open: boolean }) {
  const Icon = open ? CalendarCheck : CalendarX;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset', open ? 'bg-[var(--pay-tint)] text-[var(--pay-deep)] ring-[var(--pay-line)]' : 'bg-gray-50 text-gray-600 ring-gray-500/20')}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {open ? 'Open now' : 'Closed for now'}
    </span>
  );
}
