import type {
  APIProfileBlock,
  APIProfileIntroMusic,
  APIUserProfile,
  AvatarFormat,
  Sizes,
} from "@mutualzz/types";
import { CDNRoutes, ImageFormat } from "@mutualzz/types";
import { REST } from "@stores/REST.store";
import { makeAutoObservable } from "mobx";

export class UserProfile {
  userId: string;
  configured: boolean;
  backgroundColor?: string | null;
  backgroundImage?: string | null;
  banner?: string | null;
  bio?: string | null;
  pageFontFamily?: string | null;
  introMusic?: APIProfileIntroMusic | null;
  blocks: APIProfileBlock[];
  updatedAt: Date;

  constructor(profile: APIUserProfile) {
    this.userId = profile.userId;
    this.configured = profile.configured;
    this.backgroundColor = profile.backgroundColor ?? null;
    this.backgroundImage = profile.backgroundImage ?? null;
    this.banner = profile.banner ?? null;
    this.bio = profile.bio ?? null;
    this.pageFontFamily = profile.pageFontFamily ?? null;
    this.introMusic = profile.introMusic ?? null;
    this.blocks = profile.blocks ?? [];
    this.updatedAt = new Date(profile.updatedAt);

    makeAutoObservable(this, {}, { autoBind: true });
  }

  update(profile: APIUserProfile) {
    this.configured = profile.configured;
    this.backgroundColor = profile.backgroundColor ?? null;
    this.backgroundImage = profile.backgroundImage ?? null;
    this.banner = profile.banner ?? null;
    this.bio = profile.bio ?? null;
    this.pageFontFamily = profile.pageFontFamily ?? null;
    this.introMusic = profile.introMusic ?? null;
    this.blocks = profile.blocks ?? [];
    this.updatedAt = new Date(profile.updatedAt);
    return this;
  }

  constructBannerUrl(
    format: AvatarFormat = ImageFormat.WebP,
    size: Sizes = 512,
    animated = false,
  ) {
    return this.constructBannerUrlFrom(this.banner, format, size, animated);
  }

  constructBannerUrlFrom(
    source: string | null | undefined,
    format: AvatarFormat = ImageFormat.WebP,
    size: Sizes = 512,
    animated = false,
  ) {
    if (!source) return null;
    if (source.startsWith("http")) return source;
    return REST.makeCDNUrl(
      CDNRoutes.profileBanner(this.userId, source, format, size, animated),
    );
  }

  constructBackgroundUrl(
    format: AvatarFormat = ImageFormat.WebP,
    size: Sizes = 1024,
    animated = false,
  ) {
    return this.constructBackgroundUrlFrom(
      this.backgroundImage,
      format,
      size,
      animated,
    );
  }

  constructBackgroundUrlFrom(
    source: string | null | undefined,
    format: AvatarFormat = ImageFormat.WebP,
    size: Sizes = 1024,
    animated = false,
  ) {
    if (!source) return null;
    if (source.startsWith("http")) return source;
    return REST.makeCDNUrl(
      CDNRoutes.profileBackground(
        this.userId,
        source,
        format,
        size,
        animated,
      ),
    );
  }

  constructBlockImageUrl(src: string) {
    if (src.startsWith("http")) return src;
    return REST.makeCDNUrl(
      CDNRoutes.profileImage(this.userId, src, ImageFormat.WebP, 512),
    );
  }

  constructIntroMusicAudioUrl(hash: string) {
    return REST.makeCDNUrl(CDNRoutes.profileMusic(this.userId, hash));
  }
}
