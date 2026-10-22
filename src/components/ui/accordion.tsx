import { useId, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/*
 * A basic accordion: one item open at a time, the first open by default.
 * Opening another item closes the current one; clicking the open item closes it.
 *
 *   <Accordion items={[{ id: 'a', title: 'Question', content: <p>Answer</p> }]} />
 */

export interface AccordionItem {
  id: string;
  title: ReactNode;
  content: ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  // Which item starts open; defaults to the first. Pass null to start with all closed.
  defaultOpenId?: string | null;
  className?: string;
}

export function Accordion({ items, defaultOpenId, className }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId === undefined ? (items[0]?.id ?? null) : defaultOpenId);
  const baseId = useId();

  return (
    <div className={cn('divide-y divide-gray-100 rounded-lg border border-gray-200', className)}>
      {items.map((item) => {
        const open = item.id === openId;
        const buttonId = `${baseId}-${item.id}-button`;
        const panelId = `${baseId}-${item.id}-panel`;
        return (
          <div key={item.id}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenId(open ? null : item.id)}
                className={cn(
                  'flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-gray-50',
                  open ? 'text-[#464EB8]' : 'text-gray-800',
                )}
              >
                {item.title}
                <ChevronDown className={cn('h-4 w-4 shrink-0 text-gray-400 transition-transform', open && 'rotate-180 text-[#464EB8]')} aria-hidden="true" />
              </button>
            </h3>
            {open && (
              <div id={panelId} role="region" aria-labelledby={buttonId} className="px-4 pb-4">
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
