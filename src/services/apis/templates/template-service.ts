import { can, type PermissionUser } from '@/lib/permissions/task-permissions';
import { sampleTaskTemplates } from '@/lib/sample-data/task-template-sample-data';
import { REQUEST_CATEGORIES } from '@/lib/desk-config';
import { generateId } from '@/lib/utils';
import type { TaskTemplate } from '@/types';
import { auditService } from '../audit/audit-service';

/*
 * HR task templates (onboarding, offboarding, custom checklists).
 * In-memory mock (lasts until refresh); each method mirrors an endpoint in `endpoints.taskTemplates`.
 * Applying a template creates tasks, so that lives in taskService.applyTemplate.
 */

export type TaskTemplateInput = Pick<TaskTemplate, 'name' | 'kind' | 'description' | 'items'>;

const MOCK_LATENCY_MS = 200;
const MAX_ITEMS = 30;

let templates: TaskTemplate[] = sampleTaskTemplates.map((template) => ({ ...template, items: template.items.map((item) => ({ ...item })) }));

const delay = () => new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));

function assertCanManage(actor: PermissionUser) {
  if (!can(actor, 'template.manage')) throw new Error("You don't have permission to manage templates");
}

function validate(input: TaskTemplateInput, ignoreId?: string) {
  const name = input.name.trim();
  if (!name) throw new Error('Give the template a name');
  if (templates.some((template) => template.id !== ignoreId && template.name.toLowerCase() === name.toLowerCase())) {
    throw new Error(`A template called "${name}" already exists`);
  }
  if (input.items.length === 0) throw new Error('Add at least one item');
  if (input.items.length > MAX_ITEMS) throw new Error(`A template can have at most ${MAX_ITEMS} items`);
  input.items.forEach((item, index) => {
    if (!item.title.trim()) throw new Error(`Item ${index + 1} needs a title`);
    if (item.owner === 'specific' && !item.ownerId) throw new Error(`Choose a person for "${item.title}"`);
    if (item.owner === 'admin' && item.requestCategory && !REQUEST_CATEGORIES.includes(item.requestCategory)) throw new Error(`Choose a request category for "${item.title}"`);
  });
}

const normalize = (input: TaskTemplateInput): TaskTemplateInput => ({
  ...input,
  name: input.name.trim(),
  description: input.description?.trim() || undefined,
  items: input.items.map((item) => ({
    ...item,
    id: item.id || generateId(),
    title: item.title.trim(),
    ownerId: item.owner === 'specific' ? item.ownerId : undefined,
    requestCategory: item.owner === 'admin' ? (item.requestCategory ?? 'other') : undefined,
  })),
});

export const templateService = {
  // GET /api/task-templates
  async list(actor: PermissionUser): Promise<TaskTemplate[]> {
    await delay();
    assertCanManage(actor);
    return templates;
  },

  // Used by taskService.applyTemplate
  get(id: string): TaskTemplate {
    const template = templates.find((item) => item.id === id);
    if (!template) throw new Error('Template not found');
    return template;
  },

  // POST /api/task-templates
  async create(actor: PermissionUser, input: TaskTemplateInput): Promise<TaskTemplate> {
    await delay();
    assertCanManage(actor);
    validate(input);
    const template: TaskTemplate = { ...normalize(input), id: generateId(), updatedById: actor.id, updatedAt: new Date().toISOString() };
    templates = [...templates, template];
    auditService.record({ actorId: actor.id, entity: 'template', entityKey: template.name, action: 'created', summary: `Template created with ${template.items.length} items` });
    return template;
  },

  // PUT /api/task-templates/:id — checklists already created from it are not changed
  async update(actor: PermissionUser, id: string, input: TaskTemplateInput): Promise<TaskTemplate> {
    await delay();
    assertCanManage(actor);
    templateService.get(id);
    validate(input, id);
    const updated: TaskTemplate = { ...normalize(input), id, updatedById: actor.id, updatedAt: new Date().toISOString() };
    templates = templates.map((template) => (template.id === id ? updated : template));
    auditService.record({ actorId: actor.id, entity: 'template', entityKey: updated.name, action: 'updated', summary: `Template saved (${updated.items.length} items)` });
    return updated;
  },

  // DELETE /api/task-templates/:id — existing checklists stay
  async remove(actor: PermissionUser, id: string): Promise<void> {
    await delay();
    assertCanManage(actor);
    const removed = templateService.get(id);
    templates = templates.filter((template) => template.id !== id);
    auditService.record({ actorId: actor.id, entity: 'template', entityKey: removed.name, action: 'deleted', summary: 'Template deleted' });
  },
};
