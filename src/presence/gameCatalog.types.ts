export interface GameCatalogEntry {
  id: string;
  name: string;
  exes: string[];
  argMatchers?: GameArgMatcher[];
}

export interface GameArgMatcher {
  exe: string;
  includes: string[];
}
