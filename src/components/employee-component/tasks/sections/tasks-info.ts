import type { InfoContent, InfoSection } from '@/components/common-component/info';
import type { TaskSection, TaskView } from '@/lib/permissions/task-permissions';
import { TASK_SECTION_META, TASK_VIEW_META } from './task-config';
import { MY_TASKS_TABS } from './task-utils';

// What each view is for, in one sentence
const VIEW_PURPOSE: Record<TaskView, string> = {
  'my-tasks': "Keep track of the work given to you, the tasks you've created and the ones you're watching.",
  'team-board': "See your team's work in one place, from new tasks to done, and step in where it's stuck.",
  'hr-tasks': 'Run onboarding, offboarding and other HR processes as checklists of tasks.',
  'all-projects': 'See every task across projects and departments in one place.',
  settings: 'Decide how tasks work for everyone: the statuses, types and labels, who can do what, and automatic rules.',
  'exec-dashboard': 'A read-only summary of how work is going across projects.',
};

// What each tool tab does; the tab names come from the tabs themselves
const SECTION_PURPOSE: Record<Exclude<TaskSection, 'board'>, string> = {
  workload: 'see how much open work each person has and who is overloaded',
  sprints: 'see the backlog and what each sprint holds, and plan sprints if you are allowed to',
  approvals: 'review finished work, then approve it or send it back with a note',
  projects: 'create projects and edit their details',
  checklists: "follow each employee's onboarding or offboarding checklist",
  templates: 'reusable checklists that create every task for an employee in one go',
  workflow: 'choose the statuses tasks move through and which moves are allowed',
  fields: 'rename task types and priorities, and manage labels',
  permissions: 'choose what each role can do with tasks',
  automation: 'set up rules that act on their own, such as letting someone know when a task is overdue',
  audit: 'see who changed what and when',
};

interface TasksInfoOptions {
  view: TaskView;
  // The tool tabs this person sees on this view
  sections: TaskSection[];
  canCreate: boolean;
  readOnly: boolean;
}

// The ⓘ next to the Tasks title: what this view is for, plus the tool tabs this person actually has
export function getTasksInfo({ view, sections, canCreate, readOnly }: TasksInfoOptions): InfoContent {
  const tools = sections.filter((section): section is Exclude<TaskSection, 'board'> => section !== 'board');
  const toolsSection: InfoSection[] = tools.length
    ? [
        {
          heading: view === 'settings' ? 'Settings tabs' : 'Your extra tabs',
          items: tools.map((section) => `${TASK_SECTION_META[section].label}: ${SECTION_PURPOSE[section]}`),
        },
      ]
    : [];

  const base = { title: `About ${TASK_VIEW_META[view].title}`, description: VIEW_PURPOSE[view] };

  if (view === 'settings') {
    return {
      ...base,
      sections: [...toolsSection, { heading: 'Good to know', items: ["Changes here apply to everyone's tasks once you save them"] }],
    };
  }

  if (view === 'exec-dashboard') {
    return {
      ...base,
      sections: [
        {
          heading: 'What you can see here',
          items: [
            'How much is done, open, overdue or blocked',
            'Progress for each project and how much gets finished each week',
            'Tasks that need attention, and how the current sprint is going',
          ],
        },
        { heading: 'Good to know', items: ['Nothing can be changed from here; use Browse all tasks to open the tasks themselves'] },
      ],
    };
  }

  const doItems = [
    ...(view === 'my-tasks' ? [`Switch between your lists: ${MY_TASKS_TABS.map((tab) => tab.label).join(', ')}`] : []),
    'Show tasks as a board or a list, and narrow them down with search and filters',
    ...(canCreate ? ['Create a task with Create Task, or press C'] : []),
    'Save filters you use often, and export what you see to CSV or Excel',
  ];

  const goodToKnow = [
    ...(readOnly ? ['You can view tasks here but not create or change them'] : []),
    ...(tools.length && view !== 'my-tasks' ? ['Overdue and blocked work is listed at the top of the board so you can step in'] : []),
    'Open a task to see its details, comments and history',
    'Press ? to see the keyboard shortcuts',
  ];

  return {
    ...base,
    sections: [{ heading: 'What you can do here', items: doItems }, ...toolsSection, { heading: 'Good to know', items: goodToKnow }],
  };
}
