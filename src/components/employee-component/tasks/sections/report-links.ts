import { ROUTES } from '@/lib/constants';

// Read-only project summary, e.g. /tasks/project/IXP
export const projectSummaryPath = (projectKey: string) => `${ROUTES.Tasks}/project/${projectKey}`;
