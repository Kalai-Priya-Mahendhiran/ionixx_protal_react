import type { SyntheticEvent } from 'react';
import { pointerWithin, rectIntersection, type CollisionDetection } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';

// Shared by the status board and the swimlane board

export type DropState = 'idle' | 'origin' | 'allowed' | 'blocked';

// Space picks a card up and drops it, so Enter stays free for opening the task
export const KEYBOARD_OPTIONS = { keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space'] } };

// Prefer the drop area under the pointer; fall back to overlap (keyboard dragging has no pointer)
export const collisionDetection: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length > 0 ? hits : rectIntersection(args);
};

// Keeps clicks, key presses and pointer-downs inside the "…" menu from opening the card or starting a drag
export const stopPropagation = (event: SyntheticEvent) => event.stopPropagation();

export const cardClass = (task: Task) =>
  cn('rounded-lg border border-gray-200 bg-white p-3 shadow-sm', task.isBlocked && task.status !== 'done' && 'border-l-4 border-l-red-500');

export const dropAreaClass = (dropState: DropState, isOver: boolean) =>
  cn(
    dropState === 'allowed' && 'bg-indigo-50 outline-dashed outline-2 outline-[#464EB8]/30',
    dropState === 'allowed' && isOver && 'bg-indigo-100/70 outline-[#464EB8]',
    dropState === 'blocked' && 'opacity-50',
  );
