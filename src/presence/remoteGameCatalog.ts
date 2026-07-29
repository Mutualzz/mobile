import AsyncStorage from "@react-native-async-storage/async-storage";
import type { GameCatalogEntry } from "./gameCatalog.types";
import { FALLBACK_GAME_CATALOG } from "./builtinGameCatalog";

const STORAGE_KEY = "mutualzz.remoteGameCatalog";

interface RemoteCatalogPayload {
  updatedAt: number;
  games: GameCatalogEntry[];
}

let memoryCatalog: GameCatalogEntry[] | null = null;
let memoryUpdatedAt = 0;
let loadPromise: Promise<void> | null = null;
let catalogByName = new Map<string, GameCatalogEntry>();
let catalogById = new Map<string, GameCatalogEntry>();

function rebuildNameIndex(games: GameCatalogEntry[]) {
  catalogByName = new Map();
  catalogById = new Map();
  for (const entry of games) {
    catalogByName.set(entry.name.trim().toLowerCase(), entry);
    catalogById.set(entry.id, entry);
  }
}

function setCatalog(games: GameCatalogEntry[], updatedAt: number) {
  memoryCatalog = games;
  memoryUpdatedAt = updatedAt;
  rebuildNameIndex(games);
}

function normalizeEntry(entry: GameCatalogEntry): GameCatalogEntry | null {
  const id = typeof entry.id === "string" ? entry.id.trim() : "";
  const name = typeof entry.name === "string" ? entry.name.trim() : "";
  const exes = Array.isArray(entry.exes)
    ? entry.exes
        .filter((exe): exe is string => typeof exe === "string")
        .map((exe) => exe.trim().toLowerCase())
        .filter(Boolean)
    : [];
  if (!id || !name || !exes.length) return null;
  return { id, name, exes };
}

async function readCached(): Promise<RemoteCatalogPayload | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RemoteCatalogPayload;
    if (!parsed || !Array.isArray(parsed.games)) return null;
    const games = parsed.games
      .map((entry) => normalizeEntry(entry))
      .filter((entry): entry is GameCatalogEntry => entry !== null);
    if (!games.length) return null;
    return {
      updatedAt:
        typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now(),
      games
    };
  } catch {
    return null;
  }
}

async function writeCached(payload: RemoteCatalogPayload) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

async function hydrateFromCache() {
  if (memoryCatalog) return;
  const cached = await readCached();
  if (cached) {
    setCatalog(cached.games, cached.updatedAt);
    return;
  }
  setCatalog(FALLBACK_GAME_CATALOG, 0);
}

export function findOfficialGameByName(name: string): GameCatalogEntry | null {
  if (!memoryCatalog) return null;
  const key = name.trim().toLowerCase();
  if (!key) return null;
  return catalogByName.get(key) ?? null;
}

export function findOfficialGameById(id: string): GameCatalogEntry | null {
  if (!memoryCatalog) return null;
  const key = id.trim();
  if (!key) return null;
  return catalogById.get(key) ?? null;
}

export function getOfficialGameCatalog(): GameCatalogEntry[] {
  return memoryCatalog ?? FALLBACK_GAME_CATALOG;
}

export async function ensureRemoteGameCatalog(
  fetcher: () => Promise<RemoteCatalogPayload>
): Promise<void> {
  await hydrateFromCache();
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const payload = await fetcher();
      const games = (payload.games ?? [])
        .map((entry) => normalizeEntry(entry))
        .filter((entry): entry is GameCatalogEntry => entry !== null);
      if (!games.length) return;

      const updatedAt =
        typeof payload.updatedAt === "number" ? payload.updatedAt : Date.now();
      setCatalog(games, updatedAt);
      await writeCached({ updatedAt, games });
    } catch {
      return;
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
}

export async function initRemoteGameCatalog() {
  await hydrateFromCache();
}
