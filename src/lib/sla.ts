import type { AdminRequest, SlaTarget } from '@/types';

/*
 * Service desk SLA clocks. Response: from raising until an Admin first replies or picks the request up.
 * Resolution: from raising until it is resolved, with the clock paused while the request is Waiting.
 * Calendar hours for now; the backend can switch to business hours without changing the screens.
 */

export type SlaState = 'on-track' | 'at-risk' | 'paused' | 'breached' | 'met';

export interface SlaClock {
  state: SlaState;
  targetMs: number;
  elapsedMs: number;
  // Negative once breached
  remainingMs: number;
  // When the clock runs out (moves later while paused)
  dueAt: string;
  // When the clock stopped (response given / resolved), if it has
  stoppedAt?: string;
}

export interface SlaStatus {
  response: SlaClock;
  resolution: SlaClock;
  breached: boolean;
}

const HOUR_MS = 60 * 60 * 1000;
// "At risk" once less than this share of the target is left
export const AT_RISK_SHARE = 0.25;

type SlaRequest = Pick<AdminRequest, 'createdAt' | 'firstResponseAt' | 'resolvedAt' | 'waitingSince' | 'pausedMs' | 'status'>;

function clock(targetHours: number, startMs: number, endMs: number, pausedMs: number, stopped: boolean, paused: boolean): SlaClock {
  const targetMs = targetHours * HOUR_MS;
  const elapsedMs = Math.max(0, endMs - startMs - pausedMs);
  const remainingMs = targetMs - elapsedMs;
  const state: SlaState = stopped
    ? remainingMs >= 0
      ? 'met'
      : 'breached'
    : remainingMs < 0
      ? 'breached'
      : paused
        ? 'paused'
        : remainingMs <= targetMs * AT_RISK_SHARE
          ? 'at-risk'
          : 'on-track';
  return {
    state,
    targetMs,
    elapsedMs,
    remainingMs,
    dueAt: new Date(startMs + targetMs + pausedMs).toISOString(),
    stoppedAt: stopped ? new Date(endMs).toISOString() : undefined,
  };
}

export function getSlaStatus(request: SlaRequest, target: SlaTarget, now: Date = new Date()): SlaStatus {
  const start = new Date(request.createdAt).getTime();
  const nowMs = now.getTime();

  const responseEnd = request.firstResponseAt ? new Date(request.firstResponseAt).getTime() : nowMs;
  const response = clock(target.responseHours, start, responseEnd, 0, !!request.firstResponseAt, false);

  // Time paused so far, including the current Waiting stretch
  const pausedNow = request.waitingSince && !request.resolvedAt ? Math.max(0, nowMs - new Date(request.waitingSince).getTime()) : 0;
  const resolutionEnd = request.resolvedAt ? new Date(request.resolvedAt).getTime() : nowMs;
  const resolution = clock(target.resolutionHours, start, resolutionEnd, request.pausedMs + pausedNow, !!request.resolvedAt, request.status === 'waiting');

  return { response, resolution, breached: response.state === 'breached' || resolution.state === 'breached' };
}

// "45m", "3h 20m", "2d 4h"
export function formatDuration(ms: number): string {
  const minutes = Math.round(Math.abs(ms) / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return minutes % 60 ? `${hours}h ${minutes % 60}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  return hours % 24 ? `${days}d ${hours % 24}h` : `${days}d`;
}

// e.g. "2h left", "Breached 3h ago", "Paused · 5h left", "Met in 1h 10m"
export function describeClock(sla: SlaClock): string {
  switch (sla.state) {
    case 'met':
      return `Met in ${formatDuration(sla.elapsedMs)}`;
    case 'breached':
      return sla.stoppedAt ? `Missed by ${formatDuration(sla.remainingMs)}` : `Breached ${formatDuration(sla.remainingMs)} ago`;
    case 'paused':
      return `Paused · ${formatDuration(sla.remainingMs)} left`;
    default:
      return `${formatDuration(sla.remainingMs)} left`;
  }
}
