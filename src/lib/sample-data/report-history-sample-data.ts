/*
 * Weekly totals for past weeks, as the reporting API would return them
 * (GET /api/reports/tasks/throughput). Index 0 is 8 weeks ago, the last entry is last week;
 * live tasks add to these, and the current week comes from live tasks only.
 */
export const sampleWeeklyHistory: { created: number; completed: number }[] = [
  { created: 7, completed: 5 },
  { created: 9, completed: 6 },
  { created: 6, completed: 8 },
  { created: 8, completed: 7 },
  { created: 10, completed: 6 },
  { created: 7, completed: 9 },
  { created: 9, completed: 8 },
  { created: 8, completed: 7 },
];
