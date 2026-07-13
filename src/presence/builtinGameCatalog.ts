import type { GameCatalogEntry } from "./gameCatalog.types";

export const FALLBACK_GAME_CATALOG: GameCatalogEntry[] = [
  { id: "counter-strike-2", name: "Counter-Strike 2", exes: ["cs2.exe"] },
  { id: "valorant", name: "VALORANT", exes: ["valorant-win64-shipping.exe"] },
  {
    id: "minecraft",
    name: "Minecraft",
    exes: ["minecraft.exe", "minecraft.windows.exe"]
  },
  { id: "league-of-legends", name: "League of Legends", exes: ["lol.exe"] },
  { id: "fortnite", name: "Fortnite", exes: ["fortniteclient-win64-shipping.exe"] },
  { id: "roblox", name: "Roblox", exes: ["robloxplayerbeta.exe"] }
];
