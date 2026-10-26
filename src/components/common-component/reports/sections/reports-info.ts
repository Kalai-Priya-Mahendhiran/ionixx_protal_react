import type { InfoContent } from '@/components/common-component/info';
import { REPORT_DATE_RANGES } from '@/lib/constants';
import { REPORT_TYPES } from './reports-meta';

// The ⓘ next to the Reports title
export const REPORTS_INFO: InfoContent = {
  title: 'About Reports',
  description: 'See summaries of attendance, leave, time and tasks for a period you choose.',
  sections: [
    { heading: 'Reports you can open', items: REPORT_TYPES.map((report) => `${report.label}: ${report.description}`) },
    {
      heading: 'What you can do here',
      items: [
        'Pick a report from the list on the left to see it',
        `Choose the period it covers: ${REPORT_DATE_RANGES.map((range) => range.label).join(', ')}`,
      ],
    },
  ],
};
