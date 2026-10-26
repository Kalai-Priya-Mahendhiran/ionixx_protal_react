import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { InfoPopover, type InfoContent } from '@/components/common-component/info';
import { cn } from '@/lib/utils';

/*
 * The one page header for every screen: indigo→violet gradient, icon tile, title and a one-line description.
 *
 *   <PageHeader icon={CalendarDays} title="Leave Tracker" description="Manage your leave requests and track your leave balance" />
 *
 * Buttons go in `actions` and should use the two header button styles below so they read on the gradient;
 * a small status pill (e.g. "Read only") goes in `badge`. What the screen is for goes in `info` (an InfoContent), shown by InfoPopover as an ⓘ
 * next to the title.
 */

// The gradient surface itself, for headers with their own layout (e.g. the Profile card); add an inner `relative` wrapper
export const pageHeaderSurfaceClass = 'relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white';
const PageHeaderShade = () => <div className="absolute inset-0 bg-black/10" />;
export { PageHeaderShade };

// Main action on the gradient (white button)
export const headerPrimaryButtonClass = 'bg-white text-[#464EB8] hover:bg-white/90 shadow-sm';
// Secondary action on the gradient (glass button)
export const headerSecondaryButtonClass = 'border border-white/30 bg-white/15 text-white hover:bg-white/25 hover:text-white';
// Pill next to the title, e.g. "Read only"
export const headerBadgeClass = 'inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white';

interface PageHeaderProps {
  icon: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  badge?: ReactNode;
  // About this screen: its purpose and what you can do here
  info?: InfoContent;
  className?: string;
}

export function PageHeader({ icon: Icon, title, description, actions, badge, info, className }: PageHeaderProps) {
  return (
    <div className={cn(pageHeaderSurfaceClass, 'px-6 py-4', className)}>
      <PageHeaderShade />
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <div className="shrink-0 rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
            <Icon className="h-7 w-7 text-white" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{title}</h1>
              {info && <InfoPopover content={info} />}
              {badge}
            </div>
            {description && <p className="mt-0.5 text-sm text-white/90">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
