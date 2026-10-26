import type { InfoContent } from '@/components/common-component/info';
import { ROLE_LABELS, type UserRole } from '@/lib/mock-users';
import { COMPANY_PUBLISHER_ROLES, MAX_UPLOAD_BYTES, STORAGE_QUOTA_BYTES } from '@/services/apis/files/file-service';
import { formatFileSize } from './file-utils';

// The ⓘ next to the Files title. Roles that can share with the whole company (and System Admin) also see their extra powers.
export function getFilesInfo(role: UserRole, department: string): InfoContent {
  const extras = [
    ...(COMPANY_PUBLISHER_ROLES.includes(role) ? ['You can share a file with everyone in the company'] : []),
    ...(role === 'system_admin' ? ['You can delete files others shared with a department or the company (not their private ones)'] : []),
  ];

  return {
    title: 'About Files',
    description: "Find, view and share documents: company files, your team's files and your own.",
    sections: [
      {
        heading: 'What you can do here',
        items: [
          'Search by file name, or select a category card to show just that kind',
          'View or download any file you can see',
          `Upload files (up to ${formatFileSize(MAX_UPLOAD_BYTES)} each) and choose who can see them`,
          'Delete files you uploaded',
        ],
      },
      {
        heading: 'Good to know',
        items: [
          `You see company-wide files, ${department} team files and your own documents`,
          `Files you upload count towards your ${formatFileSize(STORAGE_QUOTA_BYTES)} of space`,
          'Deleting a file removes it for everyone it was shared with',
          'Task attachments are added from the task itself',
        ],
      },
      ...(extras.length ? [{ heading: `As ${ROLE_LABELS[role]}`, items: extras }] : []),
    ],
  };
}
