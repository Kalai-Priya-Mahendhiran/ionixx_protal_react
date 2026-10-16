import { ROUTES } from '@/lib/constants';

// Each request has its own shareable page, e.g. /service-desk/ADM-104
export const requestPath = (key: string) => `${ROUTES.ServiceDesk}/${key}`;
