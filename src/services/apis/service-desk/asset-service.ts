import { ASSET_STATUS_LABELS, ASSET_TAG_PREFIX, ASSET_TYPES, ASSET_TYPE_LABELS } from '@/lib/desk-config';
import { canManageAssets } from '@/lib/permissions/desk-permissions';
import type { PermissionUser } from '@/lib/permissions/task-permissions';
import { sampleAssets } from '@/lib/sample-data/service-desk-sample-data';
import { getUserById } from '@/lib/user-directory';
import { generateId } from '@/lib/utils';
import type { Asset, AssetHistoryEntry, AssetStatus, AssetType } from '@/types';
import { auditService } from '../audit/audit-service';
import { notificationService } from '../notifications/notification-service';

/*
 * Asset log: what the company owns and who holds it. In-memory mock (resets on refresh).
 * Endpoints: GET/POST /api/assets, PATCH /api/assets/:id, POST /api/assets/:id/issue|return,
 * GET /api/assets/mine. Only the Admin team manages assets; everyone can see what they hold.
 */

export interface AssetInput {
  type: AssetType;
  model: string;
  serialNumber?: string;
  tag?: string; // generated when left empty
}

const MOCK_LATENCY_MS = 150;

let assets: Asset[] = sampleAssets.map((asset) => ({ ...asset, history: [...asset.history] }));

const delay = () => new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
const now = () => new Date().toISOString();
const nameOf = (id?: string) => (id ? (getUserById(id)?.name ?? 'Someone') : 'Nobody');

function assertCanManage(actor: PermissionUser) {
  if (!canManageAssets(actor)) throw new Error("You don't have permission to manage assets");
}

function findAsset(id: string): Asset {
  const asset = assets.find((item) => item.id === id);
  if (!asset) throw new Error('That asset no longer exists');
  return asset;
}

function nextTag(type: AssetType): string {
  const prefix = ASSET_TAG_PREFIX[type];
  const highest = assets.filter((asset) => asset.tag.startsWith(`${prefix}-`)).reduce((max, asset) => Math.max(max, Number(asset.tag.split('-')[1]) || 0), 0);
  return `${prefix}-${String(highest + 1).padStart(4, '0')}`;
}

function record(asset: Asset, entry: Omit<AssetHistoryEntry, 'id' | 'at'>, changes: Partial<Asset>, summary: string): Asset {
  const updated: Asset = { ...asset, ...changes, history: [...asset.history, { ...entry, id: generateId(), at: now() }] };
  assets = assets.map((item) => (item.id === asset.id ? updated : item));
  auditService.record({ actorId: entry.actorId, entity: 'asset', entityKey: asset.tag, action: entry.action, summary });
  return updated;
}

// What a person holds now; used for "My assets" and offboarding "collect assets" requests
export function getAssetsHeldBy(userId: string): Asset[] {
  return assets.filter((asset) => asset.status === 'issued' && asset.assignedToId === userId);
}

export const assetService = {
  // GET /api/assets
  async list(actor: PermissionUser): Promise<Asset[]> {
    await delay();
    assertCanManage(actor);
    return [...assets].sort((a, b) => a.tag.localeCompare(b.tag));
  },

  // GET /api/assets/mine
  async listMine(actor: PermissionUser): Promise<Asset[]> {
    await delay();
    return getAssetsHeldBy(actor.id);
  },

  // POST /api/assets
  async create(actor: PermissionUser, input: AssetInput): Promise<Asset> {
    await delay();
    assertCanManage(actor);
    if (!ASSET_TYPES.includes(input.type)) throw new Error('Choose an asset type');
    const model = input.model.trim();
    if (!model) throw new Error('Add the make and model');
    const tag = (input.tag?.trim() || nextTag(input.type)).toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9-]{1,19}$/.test(tag)) throw new Error('Asset tags use letters, numbers and dashes, e.g. LAP-0012');
    if (assets.some((asset) => asset.tag === tag)) throw new Error(`${tag} is already in the asset log`);
    const serialNumber = input.serialNumber?.trim() || undefined;
    if (serialNumber && assets.some((asset) => asset.serialNumber?.toLowerCase() === serialNumber.toLowerCase())) {
      throw new Error(`Serial number ${serialNumber} is already in the asset log`);
    }
    const asset: Asset = { id: generateId(), tag, type: input.type, model, serialNumber, status: 'in-stock', history: [{ id: generateId(), action: 'added', actorId: actor.id, at: now() }] };
    assets = [...assets, asset];
    auditService.record({ actorId: actor.id, entity: 'asset', entityKey: tag, action: 'created', summary: `Added ${ASSET_TYPE_LABELS[input.type].toLowerCase()} ${model}` });
    return asset;
  },

  // POST /api/assets/:id/issue
  async issue(actor: PermissionUser, id: string, userId: string, requestKey?: string): Promise<Asset> {
    await delay();
    assertCanManage(actor);
    const asset = findAsset(id);
    if (asset.status !== 'in-stock') throw new Error(`${asset.tag} is ${ASSET_STATUS_LABELS[asset.status].toLowerCase()}; only assets in stock can be issued`);
    if (!getUserById(userId)) throw new Error('Choose who receives it');
    const updated = record(asset, { action: 'issued', userId, actorId: actor.id, requestKey }, { status: 'issued', assignedToId: userId, issuedAt: now() }, `Issued to ${nameOf(userId)}${requestKey ? ` (${requestKey})` : ''}`);
    notificationService.notify([userId], actor.id, { type: 'info', title: `${asset.tag} issued to you`, message: `${ASSET_TYPE_LABELS[asset.type]}: ${asset.model}`, actionUrl: '/service-desk' });
    return updated;
  },

  // POST /api/assets/:id/return
  async returnAsset(actor: PermissionUser, id: string, note?: string, requestKey?: string): Promise<Asset> {
    await delay();
    assertCanManage(actor);
    const asset = findAsset(id);
    if (asset.status !== 'issued') throw new Error(`${asset.tag} isn't issued to anyone`);
    return record(
      asset,
      { action: 'returned', userId: asset.assignedToId, actorId: actor.id, note: note?.trim() || undefined, requestKey },
      { status: 'in-stock', assignedToId: undefined, issuedAt: undefined },
      `Returned by ${nameOf(asset.assignedToId)}`,
    );
  },

  // PATCH /api/assets/:id { status } — send for repair, back to stock, or retire
  async setStatus(actor: PermissionUser, id: string, status: Exclude<AssetStatus, 'issued'>, note?: string): Promise<Asset> {
    await delay();
    assertCanManage(actor);
    const asset = findAsset(id);
    if (asset.status === 'issued') throw new Error(`Record ${asset.tag} as returned first`);
    if (asset.status === 'retired') throw new Error(`${asset.tag} is retired`);
    if (asset.status === status) return asset;
    const action = status === 'in-repair' ? 'repair' : status === 'retired' ? 'retired' : 'updated';
    return record(asset, { action, actorId: actor.id, note: note?.trim() || undefined }, { status }, `Status: ${ASSET_STATUS_LABELS[asset.status]} → ${ASSET_STATUS_LABELS[status]}`);
  },
};

// Test helper
export function resetAssets() {
  assets = sampleAssets.map((asset) => ({ ...asset, history: [...asset.history] }));
}
