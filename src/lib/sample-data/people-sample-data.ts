/*
 * Personal dates for the sample directory, merged into USER_DIRECTORY at start-up.
 * Birthdays are spread around "today" so the dashboard celebrations always have something to show.
 */

const around = (offsetDays: number, year: number) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return `${year}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// YYYY-MM-DD
export const SAMPLE_BIRTH_DATES: Record<string, string> = {
  EMP001: around(14, 1998),
  EMP002: around(0, 1994),
  EMP003: around(5, 1997),
  EMP004: around(40, 1995),
  EMP005: around(-3, 1993),
  EMP006: around(21, 2001),
  EMP007: around(75, 2000),
  PM001: around(9, 1988),
  HR001: around(-20, 1990),
  ADM001: around(60, 1986),
  SYS001: around(27, 1992),
  EXE001: around(110, 1980),
  ADM002: around(2, 1996),
  ADM003: around(150, 1999),
};
