import type { InfoContent } from '@/components/common-component/info';

// The ⓘ next to the Desk Reports title; the numbers cover only the teams the viewer works on
export function getDeskReportsInfo(teams: string[], periods: string[]): InfoContent {
  return {
    title: 'About Desk Reports',
    description: 'See how the service desk is doing: how many requests come in, how fast they are handled, and what the office spends.',
    sections: [
      {
        heading: 'What you can see here',
        items: [
          'Requests raised, still open, and how many met their target times',
          'Requests and resolution times for each category',
          'Requests raised and resolved over the last few months, next to office spend',
          'Requests that went past their target time and by how much, with open ones first',
        ],
      },
      {
        heading: 'Good to know',
        items: [
          ...(teams.length ? [`Request numbers cover the teams you work on: ${teams.join(', ')}`] : []),
          `Choose the period at the top: ${periods.join(', ')}`,
          'Time a request spends Waiting is not counted towards its resolution time',
        ],
      },
    ],
  };
}
