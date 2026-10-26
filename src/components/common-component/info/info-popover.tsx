import * as Popover from '@radix-ui/react-popover';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/*
 * The ⓘ "About this screen" popover. Every screen passes its own content, so they all read the same way:
 *
 *   <InfoPopover content={{ title: 'About Attendance', description: 'Check in and see your month', sections: [...] }} />
 *
 * PageHeader shows it next to the title through its `info` prop. Opens on click, so it works on touch and keyboard too.
 */

export interface InfoSection {
  heading: string;
  // A short paragraph, a list, or both
  text?: string;
  items?: string[];
}

export interface InfoContent {
  title: string;
  description?: string;
  sections?: InfoSection[];
}

interface InfoPopoverProps {
  content: InfoContent;
  className?: string;
}

export function InfoPopover({ content, className }: InfoPopoverProps) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={content.title}
          className={cn(
            'inline-flex rounded-full bg-white p-0.5 text-blue-600 shadow-sm transition-colors hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300',
            className,
          )}
        >
          <Info className="h-4 w-4" aria-hidden="true" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          collisionPadding={12}
          className="z-[70] w-[22rem] max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white text-sm leading-relaxed text-gray-700 shadow-xl"
        >
          {/* Scrolls inside when the content is long or the screen is short; never taller than the space available */}
          <div className="app-scrollbar max-h-[min(24rem,calc(var(--radix-popover-content-available-height)-1rem))] space-y-3 overflow-y-auto p-4">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
              <div>
                <p className="font-semibold text-gray-900">{content.title}</p>
                {content.description && <p className="mt-1">{content.description}</p>}
              </div>
            </div>
            {content.sections?.map((section) => (
              <div key={section.heading}>
                <p className="font-medium text-gray-900">{section.heading}</p>
                {section.text && <p className="mt-1">{section.text}</p>}
                {section.items && (
                  <ul className="mt-1 list-disc space-y-1 pl-4">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
