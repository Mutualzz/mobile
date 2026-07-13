import { CDNRoutes, type Sizes } from "@mutualzz/types";
import { REST } from "@stores/REST.store";
import type { GameCatalogEntry } from "./gameCatalog.types";
import {
  findOfficialGameById,
  findOfficialGameByName
} from "./remoteGameCatalog";

const CDN_ICON_SIZES: Sizes[] = [16, 32, 64, 128, 256, 512, 1024];

function nearestIconSize(size: number): Sizes {
  return CDN_ICON_SIZES.reduce((best, candidate) =>
    Math.abs(candidate - size) < Math.abs(best - size) ? candidate : best
  );
}

function isRemoteCatalogAppId(id: string) {
  return /^\d+$/.test(id.trim());
}

export function resolveCatalogIconUrl(applicationId: string, size = 64): string {
  return REST.makeCDNUrl(
    CDNRoutes.appIcon(applicationId, nearestIconSize(size))
  );
}

export function resolveBuiltinIconUrl(
  entry: GameCatalogEntry,
  size = 64
): string {
  return resolveCatalogIconUrl(entry.id, size);
}

export function resolvePlayingActivityIconUrl(
  name: string,
  size = 64,
  applicationId?: string | null
): string | null {
  const appId = applicationId?.trim();
  if (appId && isRemoteCatalogAppId(appId)) {
    return resolveCatalogIconUrl(appId, size);
  }

  if (appId) {
    const officialById = findOfficialGameById(appId);
    if (officialById) return resolveBuiltinIconUrl(officialById, size);
  }

  const official = findOfficialGameByName(name);
  if (!official) return null;
  return resolveBuiltinIconUrl(official, size);
}
