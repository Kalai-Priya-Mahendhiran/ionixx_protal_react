import { describeClock, formatDuration, getSlaStatus } from '@/lib/sla';

const NOW = new Date('2026-10-16T12:00:00.000Z');
const hoursBefore = (hours: number) => new Date(NOW.getTime() - hours * 3600000).toISOString();
const target = { responseHours: 2, resolutionHours: 24 };
const base = { status: 'open' as const, pausedMs: 0 };

describe('getSlaStatus()', () => {
  it('is on track early, at risk near the end and breached after', () => {
    expect(getSlaStatus({ ...base, createdAt: hoursBefore(0.5) }, target, NOW).response.state).toBe('on-track');
    expect(getSlaStatus({ ...base, createdAt: hoursBefore(1.6) }, target, NOW).response.state).toBe('at-risk');
    const late = getSlaStatus({ ...base, createdAt: hoursBefore(3) }, target, NOW);
    expect(late.response.state).toBe('breached');
    expect(late.breached).toBe(true);
    expect(describeClock(late.response)).toBe('Breached 1h ago');
  });

  it('stops the response clock at the first response', () => {
    const sla = getSlaStatus({ ...base, status: 'in-progress', createdAt: hoursBefore(10), firstResponseAt: hoursBefore(9) }, target, NOW);
    expect(sla.response.state).toBe('met');
    expect(describeClock(sla.response)).toBe('Met in 1h');
    expect(sla.resolution.state).toBe('on-track');
  });

  it('pauses the resolution clock while waiting and pushes the due time out', () => {
    // 30h old, but 10h of that was spent waiting earlier and it has been waiting for the last 4h
    const sla = getSlaStatus(
      { status: 'waiting', createdAt: hoursBefore(30), firstResponseAt: hoursBefore(29), waitingSince: hoursBefore(4), pausedMs: 10 * 3600000 },
      target,
      NOW,
    );
    expect(sla.resolution.state).toBe('paused');
    expect(sla.resolution.elapsedMs).toBe(16 * 3600000);
    expect(sla.resolution.dueAt).toBe(new Date(NOW.getTime() + 8 * 3600000).toISOString());
  });

  it('marks a late resolution as missed even once resolved', () => {
    const sla = getSlaStatus({ ...base, status: 'resolved', createdAt: hoursBefore(40), firstResponseAt: hoursBefore(39), resolvedAt: hoursBefore(10) }, target, NOW);
    expect(sla.resolution.state).toBe('breached');
    expect(describeClock(sla.resolution)).toBe('Missed by 6h');
  });
});

describe('formatDuration()', () => {
  it('reads naturally', () => {
    expect(formatDuration(45 * 60000)).toBe('45m');
    expect(formatDuration(200 * 60000)).toBe('3h 20m');
    expect(formatDuration(52 * 3600000)).toBe('2d 4h');
    expect(formatDuration(-2 * 3600000)).toBe('2h');
  });
});
