import { canDeleteFile, canSeeFile, fileService } from './file-service';
import type { File as PortalFile } from '@/types';

const employee = { id: 'EMP001', role: 'employee' as const }; // Engineering
const manager = { id: 'PM001', role: 'project_manager' as const }; // Engineering
const hr = { id: 'HR001', role: 'hr' as const }; // Human Resources
const sysAdmin = { id: 'SYS001', role: 'system_admin' as const }; // IT

const names = (files: PortalFile[]) => files.map((file) => file.name);

describe('file visibility', () => {
  it('shows company files to everyone', async () => {
    for (const actor of [employee, manager, hr, sysAdmin]) expect(names(await fileService.list(actor))).toContain('Employee Handbook 2026.pdf');
  });

  it('shows department files only to that department', async () => {
    expect(names(await fileService.list(employee))).toContain('Coding Standards.docx');
    expect(names(await fileService.list(manager))).toContain('Coding Standards.docx');
    expect(names(await fileService.list(hr))).not.toContain('Coding Standards.docx');
    expect(names(await fileService.list(hr))).toContain('Offer Letter Template.docx');
  });

  it('limits role files to those roles', async () => {
    expect(names(await fileService.list(hr))).toContain('Salary Bands FY 2026-27.xlsx');
    expect(names(await fileService.list(employee))).not.toContain('Salary Bands FY 2026-27.xlsx');
    expect(names(await fileService.list(manager))).toContain('Performance Review Guide – Managers.pdf');
    expect(names(await fileService.list(employee))).not.toContain('Performance Review Guide – Managers.pdf');
  });

  it('keeps private documents to their owner', async () => {
    const mine = (await fileService.list(employee)).filter((file) => file.accessLevel === 'private');
    expect(mine.length).toBeGreaterThan(0);
    expect(mine.every((file) => file.ownerId === employee.id)).toBe(true);
    expect((await fileService.list(hr)).some((file) => file.ownerId === employee.id)).toBe(false);
  });

  it('shares an upload with the uploader’s department only', async () => {
    const upload = new File(['notes'], 'Sprint notes.txt', { type: 'text/plain' });
    const stored = await fileService.upload(employee, upload, { category: 'department', access: 'department' });
    expect(stored.department).toBe('Engineering');
    expect(canSeeFile(manager, stored)).toBe(true);
    expect(canSeeFile(hr, stored)).toBe(false);
  });

  it('lets only some roles publish to the whole company', async () => {
    const upload = new File(['x'], 'All hands.pdf', { type: 'application/pdf' });
    await expect(fileService.upload(employee, upload, { category: 'general', access: 'public' })).rejects.toThrow(/whole company/);
    await expect(fileService.upload(hr, upload, { category: 'general', access: 'public' })).resolves.toMatchObject({ accessLevel: 'public' });
  });

  it('lets people delete only their own uploads', async () => {
    const stored = await fileService.upload(employee, new File(['x'], 'Draft.txt'), { category: 'personal' });
    expect(canDeleteFile(employee, stored)).toBe(true);
    expect(canDeleteFile(manager, stored)).toBe(false);
    await expect(fileService.remove(manager, stored.id)).rejects.toThrow();
    await fileService.remove(employee, stored.id);
    expect(names(await fileService.list(employee))).not.toContain('Draft.txt');
  });
});
