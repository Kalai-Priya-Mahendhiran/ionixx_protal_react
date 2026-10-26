import type { InfoContent } from '@/components/common-component/info';
import { ASSET_STATUS_LABELS, ASSET_TYPES, ASSET_TYPE_LABELS } from '@/lib/desk-config';

// The ⓘ next to the Asset Log title
export const ASSET_LOG_INFO: InfoContent = {
  title: 'About Asset Log',
  description: 'A record of company equipment and who has it right now.',
  sections: [
    {
      heading: 'What you can do here',
      items: [
        `Add an asset: ${ASSET_TYPES.map((type) => ASSET_TYPE_LABELS[type]).join(', ')}`,
        'Issue an asset in stock to someone (linked to their request if there is one), and record it when they return it',
        'Send an asset for repair, bring it back into stock, or retire it',
        'Find an asset by its tag, model, serial number or the person who has it',
      ],
    },
    {
      heading: 'Good to know',
      items: [
        `Each asset shows its status: ${Object.values(ASSET_STATUS_LABELS).join(', ')}`,
        'Each asset keeps a history of who had it and what happened to it',
        "Retired assets stay in the log for the record but can't be issued again",
      ],
    },
  ],
};
