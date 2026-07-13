export type ProfileLinkKind =
  | "youtube"
  | "twitch"
  | "spotify"
  | "soundcloud"
  | "apple"
  | "deezer"
  | "bandcamp"
  | "itch"
  | "github"
  | "discord"
  | "twitter"
  | "instagram"
  | "tiktok"
  | "linkedin"
  | "reddit"
  | "website";

export interface ResolvedProfileUrl {
  kind: ProfileLinkKind;
  label: string;
  detail?: string;
  color: string;
  hostname: string;
}

const PLATFORM_COLORS: Record<ProfileLinkKind, string> = {
  youtube: "#FF0000",
  twitch: "#9146FF",
  spotify: "#1DB954",
  soundcloud: "#FF5500",
  apple: "#FA243C",
  deezer: "#A238FF",
  bandcamp: "#629AA9",
  itch: "#FA5C5C",
  github: "#24292F",
  discord: "#5865F2",
  twitter: "#1DA1F2",
  instagram: "#E4405F",
  tiktok: "#EE1D52",
  linkedin: "#0A66C2",
  reddit: "#FF4500",
  website: "#6366F1",
};

const slugToTitle = (value: string) =>
  decodeURIComponent(value)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const build = (
  kind: ProfileLinkKind,
  label: string,
  hostname: string,
  detail?: string,
): ResolvedProfileUrl => ({
  kind,
  label,
  detail,
  color: PLATFORM_COLORS[kind],
  hostname,
});

const parseYoutube = (
  parsed: URL,
  host: string,
  path: string,
): ResolvedProfileUrl | null => {
  if (!host.includes("youtube.com") && host !== "youtu.be") return null;

  const videoFromPath = path.match(/\/(?:watch\/|embed\/|shorts\/|live\/|v\/)([a-zA-Z0-9_-]{11})/);
  const videoFromQuery = parsed.searchParams.get("v");
  const videoFromShort = host === "youtu.be" ? path.slice(1).split(/[/?#]/)[0] : null;
  const videoId =
    (videoFromQuery && /^[a-zA-Z0-9_-]{11}$/.test(videoFromQuery) ? videoFromQuery : null) ??
    videoFromPath?.[1] ??
    (videoFromShort && /^[a-zA-Z0-9_-]{11}$/.test(videoFromShort) ? videoFromShort : null);
  if (videoId) return build("youtube", "YouTube Video", host, videoId);

  const playlistId = parsed.searchParams.get("list");
  if (playlistId && (path.includes("/playlist") || videoFromQuery)) {
    return build("youtube", "YouTube Playlist", host, playlistId);
  }

  const channelHandle = path.match(/^\/@([a-zA-Z0-9._-]+)/)?.[1];
  if (channelHandle) return build("youtube", "YouTube Channel", host, `@${channelHandle}`);

  const channelId = path.match(/^\/channel\/([a-zA-Z0-9_-]+)/)?.[1];
  if (channelId) return build("youtube", "YouTube Channel", host, channelId);

  return build("youtube", "YouTube", host, path !== "/" ? path : undefined);
};

const parseTwitch = (host: string, path: string): ResolvedProfileUrl | null => {
  if (!host.includes("twitch.tv")) return null;

  const videoId = path.match(/^\/videos\/(\d+)/)?.[1];
  if (videoId) return build("twitch", "Twitch Video", host, videoId);

  const clipId =
    path.match(/^\/clip\/([\w-]+)/)?.[1] ??
    (host === "clips.twitch.tv" ? path.slice(1).split(/[/?#]/)[0] : null);
  if (clipId) return build("twitch", "Twitch Clip", host, clipId);

  const channel = path.match(/^\/([a-zA-Z0-9_]+)$/)?.[1];
  if (channel && !["directory", "downloads", "jobs"].includes(channel)) {
    return build("twitch", "Twitch Channel", host, channel);
  }

  return build("twitch", "Twitch", host);
};

const parseSpotify = (host: string, path: string): ResolvedProfileUrl | null => {
  if (!host.includes("spotify.com")) return null;
  const match = path.match(/^\/(track|album|playlist|artist|episode|show)\/([a-zA-Z0-9]+)/);
  if (!match) return build("spotify", "Spotify", host);

  const [, type, id] = match;
  const label =
    type === "track" || type === "episode"
      ? "Spotify Track"
      : type === "album" || type === "show"
        ? "Spotify Album"
        : type === "playlist"
          ? "Spotify Playlist"
          : "Spotify Artist";
  return build("spotify", label, host, id);
};

const parseSoundcloud = (host: string, path: string): ResolvedProfileUrl | null => {
  if (!host.includes("soundcloud.com")) return null;

  if (path.match(/^\/[\w-]+\/sets\//)) {
    const detail = path.split("/").filter(Boolean).slice(-1)[0];
    return build("soundcloud", "SoundCloud Playlist", host, slugToTitle(detail));
  }

  if (path.match(/^\/[\w-]+\/[\w-]+/)) {
    const parts = path.split("/").filter(Boolean);
    return build("soundcloud", "SoundCloud Track", host, slugToTitle(parts[parts.length - 1]));
  }

  const profile = path.match(/^\/([\w-]+)$/)?.[1];
  if (profile && !["discover", "stream", "you", "pages"].includes(profile)) {
    return build("soundcloud", "SoundCloud Artist", host, slugToTitle(profile));
  }

  return build("soundcloud", "SoundCloud", host);
};

const parseApple = (host: string, path: string): ResolvedProfileUrl | null => {
  if (!host.includes("music.apple.com") && !host.includes("itunes.apple.com")) return null;

  const match = path.match(/^\/[a-z]{2}\/(album|playlist|artist|song|music-video)\/([^/]+)\/(\d+)/);
  if (!match) return build("apple", "Apple Music", host);

  const [, type, slug] = match;
  const label =
    type === "song" || type === "music-video"
      ? "Apple Music Song"
      : type === "album"
        ? "Apple Music Album"
        : type === "playlist"
          ? "Apple Music Playlist"
          : "Apple Music Artist";
  return build("apple", label, host, slugToTitle(slug));
};

const parseDeezer = (host: string, path: string): ResolvedProfileUrl | null => {
  if (!host.includes("deezer.com")) return null;
  const match = path.match(/\/(track|album|playlist|artist)\/(\d+)/);
  if (!match) return build("deezer", "Deezer", host);

  const [, type, id] = match;
  const label =
    type === "track"
      ? "Deezer Track"
      : type === "album"
        ? "Deezer Album"
        : type === "playlist"
          ? "Deezer Playlist"
          : "Deezer Artist";
  return build("deezer", label, host, id);
};

const parseBandcamp = (host: string, path: string): ResolvedProfileUrl | null => {
  if (!host.includes("bandcamp.com")) return null;

  const isArtistSubdomain = host.endsWith(".bandcamp.com") && host !== "bandcamp.com";

  if (path.includes("/album/")) {
    const detail = path.split("/album/")[1]?.split(/[/?#]/)[0];
    return build("bandcamp", "Bandcamp Album", host, detail ? slugToTitle(detail) : undefined);
  }

  if (path.includes("/track/")) {
    const detail = path.split("/track/")[1]?.split(/[/?#]/)[0];
    return build("bandcamp", "Bandcamp Track", host, detail ? slugToTitle(detail) : undefined);
  }

  if (isArtistSubdomain) {
    const artist = host.replace(".bandcamp.com", "");
    return build("bandcamp", "Bandcamp Artist", host, slugToTitle(artist));
  }

  return build("bandcamp", "Bandcamp", host);
};

const parseItch = (host: string, path: string): ResolvedProfileUrl | null => {
  if (!host.includes("itch.io")) return null;

  const isCreatorSubdomain = host.endsWith(".itch.io") && host !== "itch.io";

  if (isCreatorSubdomain) {
    const creator = host.replace(".itch.io", "");
    const game = path.match(/^\/([\w-]+)/)?.[1];
    if (game) return build("itch", "itch.io Game", host, slugToTitle(game));
    return build("itch", "itch.io Profile", host, slugToTitle(creator));
  }

  const profile = path.match(/^\/profile\/([\w-]+)/)?.[1];
  if (profile) return build("itch", "itch.io Profile", host, slugToTitle(profile));

  return build("itch", "itch.io", host, path !== "/" ? path : undefined);
};

const parseGithub = (host: string, path: string): ResolvedProfileUrl | null => {
  if (host !== "github.com") return null;
  const parts = path.split("/").filter(Boolean);
  if (parts.length >= 2) return build("github", "GitHub Repository", host, `${parts[0]}/${parts[1]}`);
  if (parts.length === 1) return build("github", "GitHub Profile", host, parts[0]);
  return build("github", "GitHub", host);
};

const parseDiscord = (host: string, path: string): ResolvedProfileUrl | null => {
  if (host === "discord.gg" || host.includes("discord.com")) {
    const invite = host === "discord.gg" ? path.slice(1) : path.match(/invite\/([\w-]+)/)?.[1];
    if (invite) return build("discord", "Discord Invite", host, invite);
    return build("discord", "Discord", host);
  }
  return null;
};

const parseTwitter = (host: string, path: string): ResolvedProfileUrl | null => {
  if (!["twitter.com", "x.com", "mobile.twitter.com"].includes(host)) return null;
  const parts = path.split("/").filter(Boolean);
  if (parts.length >= 3 && ["status", "post"].includes(parts[1])) {
    return build("twitter", "X Post", host, `@${parts[0]}`);
  }
  if (parts.length >= 1) return build("twitter", "X Profile", host, `@${parts[0]}`);
  return build("twitter", "X", host);
};

const parseInstagram = (host: string, path: string): ResolvedProfileUrl | null => {
  if (!host.includes("instagram.com")) return null;
  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "p" || parts[0] === "reel") return build("instagram", "Instagram Post", host);
  if (parts[0]) return build("instagram", "Instagram Profile", host, `@${parts[0]}`);
  return build("instagram", "Instagram", host);
};

const parseTiktok = (host: string, path: string): ResolvedProfileUrl | null => {
  if (!host.includes("tiktok.com")) return null;
  if (path.includes("/video/")) return build("tiktok", "TikTok Video", host);
  const handle = path.match(/^\/@([a-zA-Z0-9._]+)/)?.[1];
  if (handle) return build("tiktok", "TikTok Profile", host, `@${handle}`);
  return build("tiktok", "TikTok", host);
};

const parseLinkedin = (host: string, path: string): ResolvedProfileUrl | null => {
  if (!host.includes("linkedin.com")) return null;
  if (path.startsWith("/in/")) return build("linkedin", "LinkedIn Profile", host, path.split("/")[2]);
  if (path.startsWith("/company/")) return build("linkedin", "LinkedIn Company", host, path.split("/")[2]);
  return build("linkedin", "LinkedIn", host);
};

const parseReddit = (host: string, path: string): ResolvedProfileUrl | null => {
  if (!host.includes("reddit.com")) return null;
  if (path.startsWith("/r/")) return build("reddit", "Subreddit", host, `r/${path.split("/")[2]}`);
  if (path.startsWith("/u/") || path.startsWith("/user/")) {
    return build("reddit", "Reddit Profile", host, `u/${path.split("/")[2]}`);
  }
  return build("reddit", "Reddit", host);
};

export const resolveProfileUrl = (url: string): ResolvedProfileUrl | null => {
  const trimmed = url.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }

  const host = parsed.hostname.replace(/^www\./, "").toLowerCase();
  const path = parsed.pathname;

  return (
    parseYoutube(parsed, host, path) ??
    parseTwitch(host, path) ??
    parseSpotify(host, path) ??
    parseSoundcloud(host, path) ??
    parseApple(host, path) ??
    parseDeezer(host, path) ??
    parseBandcamp(host, path) ??
    parseItch(host, path) ??
    parseGithub(host, path) ??
    parseDiscord(host, path) ??
    parseTwitter(host, path) ??
    parseInstagram(host, path) ??
    parseTiktok(host, path) ??
    parseLinkedin(host, path) ??
    parseReddit(host, path) ??
    build("website", slugToTitle(host.split(".")[0] || "Website"), host, path !== "/" ? path : undefined)
  );
};

export const formatProfileUrlLabel = (resolved: ResolvedProfileUrl) =>
  resolved.detail ? `${resolved.label} · ${resolved.detail}` : resolved.label;
