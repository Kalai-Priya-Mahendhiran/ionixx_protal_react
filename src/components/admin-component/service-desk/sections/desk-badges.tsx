import { AlertTriangle, CheckCircle2, Clock, PauseCircle, type LucideIcon } from 'lucide-react';
import { REQUEST_CATEGORY_LABELS, REQUEST_STATUS_LABELS, WAITING_REASON_LABELS } from '@/lib/desk-config';
import { describeClock, type SlaClock, type SlaState } from '@/lib/sla';
import { cn } from '@/lib/utils';
import type { AdminRequest, RequestCategory, RequestStatus } from '@/types';
import { CATEGORY_ICONS } from './desk-icons';

const STATUS_STYLE: Record<RequestStatus, string> = {
  open: 'bg-sky-100 text-sky-800',
  'in-progress': 'bg-indigo-100 text-indigo-800',
  waiting: 'bg-amber-100 text-amber-900',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-700',
};

export function RequestStatusBadge({ request }: { request: Pick<AdminRequest, 'status' | 'waitingReason'> }) {
  const label = request.status === 'waiting' && request.waitingReason ? WAITING_REASON_LABELS[request.waitingReason] : REQUEST_STATUS_LABELS[request.status];
  return <span className={cn('inline-flex whitespace-nowrap rounded px-2 py-0.5 text-xs font-semibold', STATUS_STYLE[request.status])}>{label}</span>;
}

export function CategoryChip({ category }: { category: RequestCategory }) {
  const Icon = CATEGORY_ICONS[category];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-gray-700">
      <Icon className="h-4 w-4 text-gray-500" aria-hidden="true" />
      {REQUEST_CATEGORY_LABELS[category]}
    </span>
  );
}

const SLA_STYLE: Record<SlaState, { icon: LucideIcon; className: string; label: string }> = {
  'on-track': { icon: Clock, className: 'text-gray-700', label: 'On track' },
  'at-risk': { icon: AlertTriangle, className: 'bg-amber-50 text-amber-900 ring-1 ring-amber-200', label: 'At risk' },
  paused: { icon: PauseCircle, className: 'text-gray-600', label: 'Paused' },
  breached: { icon: AlertTriangle, className: 'bg-red-50 text-red-800 ring-1 ring-red-200', label: 'Breached' },
  met: { icon: CheckCircle2, className: 'text-green-800', label: 'Met' },
};

// After a label ("Response breached") the state reads as part of the sentence
const lowerAfterLabel = (text: string, hasLabel: boolean) => (hasLabel ? text.charAt(0).toLowerCase() + text.slice(1) : text);

// One SLA clock: icon + state word + time, so it never relies on colour alone
export function SlaChip({ clock, label, compact = false }: { clock: SlaClock; label?: string; compact?: boolean }) {
  const style = SLA_STYLE[clock.state];
  const Icon = style.icon;
  // Paused already says so in its description
  const text = clock.state === 'paused' ? describeClock(clock) : `${style.label} · ${describeClock(clock)}`;
  return (
    <span
      className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium', style.className)}
      title={`${label ? `${label}: ` : ''}${text}`}
    >
      <Icon className={cn('h-3.5 w-3.5 shrink-0', clock.state === 'at-risk' && 'text-amber-600', clock.state === 'breached' && 'text-red-600', clock.state === 'met' && 'text-green-600')} aria-hidden="true" />
      {label && <span className="font-semibold">{label}</span>}
      {lowerAfterLabel(compact ? (clock.state === 'breached' ? 'Breached' : describeClock(clock)) : text, !!label)}
    </span>
  );
}
