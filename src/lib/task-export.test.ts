import { sampleProjects, sampleSprints, sampleTasks } from '@/lib/sample-data/tasks-sample-data';
import { EXPORT_COLUMNS, buildExportRows, toCsv, toCsvField } from './task-export';

const lookups = { projects: sampleProjects, sprints: sampleSprints, epics: [] };

describe('task export', () => {
  it('escapes CSV fields and neutralises formulas', () => {
    expect(toCsvField('Plain')).toBe('Plain');
    expect(toCsvField('Fix login, then logout')).toBe('"Fix login, then logout"');
    expect(toCsvField('Say "hi"')).toBe('"Say ""hi"""');
    expect(toCsvField('Line 1\nLine 2')).toBe('"Line 1\nLine 2"');
    expect(toCsvField('=SUM(A1:A2)')).toBe("'=SUM(A1:A2)");
    expect(toCsvField(4.5)).toBe('4.5');
  });

  it('writes a header row plus one row per task, starting with a UTF-8 byte-order mark', () => {
    const tasks = sampleTasks.slice(0, 3);
    const csv = toCsv(tasks, lookups);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const lines = csv.slice(1).split('\r\n');
    expect(lines).toHaveLength(4);
    expect(lines[0]).toBe(EXPORT_COLUMNS.map((column) => column.header).join(','));
    expect(lines[1].startsWith(`${tasks[0].key},`)).toBe(true);
  });

  it('fills project, people and sprint names instead of IDs', () => {
    const task = sampleTasks.find((item) => item.key === 'IXP-102')!;
    const [row] = buildExportRows([task], lookups);
    const value = (header: string) => row[EXPORT_COLUMNS.findIndex((column) => column.header === header)];
    expect(value('Project')).toBe('Ionixx Portal');
    expect(value('Assignee')).toBe('Kalai Priya');
    expect(value('Department')).toBe('Engineering');
    expect(value('Sprint')).toBe('IXP Sprint 15');
    expect(value('Status')).toBe('In Progress');
  });
});
