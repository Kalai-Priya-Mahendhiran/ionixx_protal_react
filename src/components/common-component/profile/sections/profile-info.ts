import type { InfoContent } from '@/components/common-component/info';

// The ⓘ next to the name on the Profile header; the section names come from the page's tabs
export function getProfileInfo(sections: string[]): InfoContent {
  return {
    title: 'About My Profile',
    description: 'Your personal, education, work and bank details, kept in one place.',
    sections: [
      {
        heading: 'What you can do here',
        items: [
          'Select Edit Profile to change your details, then Save Changes',
          `Use the tabs to jump to a section: ${sections.join(', ')}`,
          'Add qualifications, certifications and previous jobs',
          'Change your photo while editing (JPEG or PNG, up to 5 MB)',
        ],
      },
      {
        heading: 'Good to know',
        items: [
          'Your employee ID and name cannot be changed here',
          'Fields marked * are required; if one is missing, saving takes you to it',
          'Consent needs all three agreements and your typed name as an e-signature',
        ],
      },
    ],
  };
}
