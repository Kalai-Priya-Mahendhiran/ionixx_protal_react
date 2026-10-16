import { assetService, getAssetsHeldBy, resetAssets } from './asset-service';
import { expenseService, resetExpenses } from './expense-service';

const desk = { id: 'ADM001', role: 'admin' as const };
const employee = { id: 'EMP001', role: 'employee' as const };

describe('assetService', () => {
  beforeEach(() => resetAssets());

  it('adds assets with the next tag for their type', async () => {
    const asset = await assetService.create(desk, { type: 'laptop', model: 'ThinkPad X1' });
    expect(asset).toMatchObject({ tag: 'LAP-0008', status: 'in-stock' });
    await expect(assetService.create(desk, { type: 'laptop', model: 'Dup', tag: 'LAP-0008' })).rejects.toThrow('already in the asset log');
    await expect(assetService.create(employee, { type: 'laptop', model: 'Mine' })).rejects.toThrow('permission');
  });

  it('issues from stock and records returns in the history', async () => {
    const asset = await assetService.create(desk, { type: 'headset', model: 'Jabra' });
    await assetService.issue(desk, asset.id, 'EMP007', 'ADM-120');
    expect(getAssetsHeldBy('EMP007').map((item) => item.id)).toContain(asset.id);
    await expect(assetService.issue(desk, asset.id, 'EMP001')).rejects.toThrow('only assets in stock');

    const returned = await assetService.returnAsset(desk, asset.id, 'Good condition');
    expect(returned.status).toBe('in-stock');
    expect(returned.history.map((entry) => entry.action)).toEqual(['added', 'issued', 'returned']);
    expect(returned.history[1]).toMatchObject({ userId: 'EMP007', requestKey: 'ADM-120' });
  });

  it('shows everyone what they hold', async () => {
    expect((await assetService.listMine(employee)).map((asset) => asset.tag).sort()).toEqual(['IDC-0001', 'LAP-0001']);
  });

  it("won't retire or repair an issued asset", async () => {
    const [issued] = getAssetsHeldBy('EMP001');
    await expect(assetService.setStatus(desk, issued.id, 'retired')).rejects.toThrow('returned first');
  });
});

describe('expenseService', () => {
  beforeEach(() => resetExpenses());

  it('validates and records expenses for the Admin team only', async () => {
    const expense = await expenseService.create(desk, { date: '2026-10-01', category: 'supplies', vendor: ' Amazon ', amount: 1200.456, requestKey: 'adm-103' });
    expect(expense).toMatchObject({ vendor: 'Amazon', amount: 1200.46, requestKey: 'ADM-103', recordedById: 'ADM001' });
    await expect(expenseService.create(desk, { date: '2026-10-01', category: 'supplies', vendor: 'X', amount: 0 })).rejects.toThrow('above ₹0');
    await expect(expenseService.create(desk, { date: '2999-01-01', category: 'supplies', vendor: 'X', amount: 5 })).rejects.toThrow('future');
    await expect(expenseService.list(employee)).rejects.toThrow('permission');
  });
});
