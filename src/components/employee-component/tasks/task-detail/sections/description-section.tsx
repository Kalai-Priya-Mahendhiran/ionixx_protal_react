import type { Task } from '@/types';
import { CollapsibleSection } from './collapsible-section';
import { InlineTextarea } from './inline-fields';
import type { SaveField } from './task-detail-meta';

export function DescriptionSection({ task, canEdit, saveField }: { task: Task; canEdit: boolean; saveField: SaveField }) {
  return (
    <CollapsibleSection title="Description">
      <InlineTextarea
        value={task.description}
        onSave={(description) => saveField('Description', { description })}
        editable={canEdit}
        ariaLabel="Description"
        placeholder="Context, steps to reproduce or acceptance criteria"
        emptyText={canEdit ? 'Add a description…' : 'No description.'}
      />
    </CollapsibleSection>
  );
}
