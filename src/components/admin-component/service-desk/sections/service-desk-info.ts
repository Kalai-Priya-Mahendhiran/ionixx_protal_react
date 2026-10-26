import type { InfoContent } from '@/components/common-component/info';
import { DESKS } from '@/lib/desk-config';

// The ⓘ next to the Service Desk title. Desk-team members also see how the queue works.
export function getServiceDeskInfo(isDesk: boolean): InfoContent {
  return {
    title: `About ${isDesk ? 'Service Desk' : 'My Requests'}`,
    description: "One place to ask a support team for help and follow it until it's done, instead of chasing it over chat or email.",
    sections: [
      { heading: 'Who handles what', items: DESKS.map((desk) => `${desk.team}: ${desk.summary}`) },
      {
        heading: 'What you can do here',
        items: [
          'Raise a request: pick a category, add details and files, and it goes to the right team',
          'Follow its status and reply to the team in My Requests',
          'Each category has a target time for the first response and for resolving it',
        ],
      },
      ...(isDesk
        ? [
            {
              heading: 'For your team',
              items: ['The Request queue holds the requests your team handles', "Assign them, update their status, and reply or add internal notes the requester doesn't see"],
            },
          ]
        : []),
    ],
  };
}
