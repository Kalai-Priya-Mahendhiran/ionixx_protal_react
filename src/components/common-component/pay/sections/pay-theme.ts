import { useEffect } from 'react';

/*
 * Pay & Tax colours, taken from the portal's stat-card tones (as on the Leave Tracker cards):
 * teal for take home, purple for deductions, pink for "partially approved".
 *
 * They are CSS variables on <html>, so dialogs and side panels (rendered outside the page) use them too:
 *   --pay-take / --pay-ded         take home / deductions (donut, bars, legend dots)
 *   --pay-tint / --pay-line        light background and border for highlighted boxes
 *   --pay-deep                     readable text on the tint
 *   --pay-approved-bg / -fg        "Approved" label
 *   --pay-partial-bg / -fg         "Partially Approved" label and the "tax for the year" tile
 */

export const PAY_THEME = {
  take: '#14B8A6',
  ded: '#A855F7',
  tint: '#F0FDFA',
  line: '#99F6E4',
  deep: '#115E59',
  approved: ['#CCFBF1', '#0F766E'],
  partial: ['#FCE7F3', '#BE185D'],
} as const;

// Sets the colour variables while the Pay & Tax page is open
export function usePayTheme() {
  useEffect(() => {
    const style = document.documentElement.style;
    const vars: Record<string, string> = {
      '--pay-take': PAY_THEME.take,
      '--pay-ded': PAY_THEME.ded,
      '--pay-tint': PAY_THEME.tint,
      '--pay-line': PAY_THEME.line,
      '--pay-deep': PAY_THEME.deep,
      '--pay-approved-bg': PAY_THEME.approved[0],
      '--pay-approved-fg': PAY_THEME.approved[1],
      '--pay-partial-bg': PAY_THEME.partial[0],
      '--pay-partial-fg': PAY_THEME.partial[1],
    };
    for (const [name, value] of Object.entries(vars)) style.setProperty(name, value);
  }, []);
}

// For the printed payslip, which opens in its own window without the CSS variables
export const currentPayTheme = () => PAY_THEME;
