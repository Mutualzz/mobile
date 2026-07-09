import type {
  APIMobileProfileBlock,
  APIProfileBlock,
  APIProfileMusic,
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
  profileMusic?: APIProfileMusic | null;
  blocks: APIProfileBlock[];
  mobileBlocks: APIMobileProfileBlock[];
  updatedAt: Date;

  constructor(profile: APIUserProfile) {
    this.userId = profile.userId;
    this.configured = profile.configured;
    this.backgroundColor = profile.backgroundColor ?? null;
    this.backgroundImage = profile.backgroundImage ?? null;
    this.banner = profile.banner ?? null;
    this.bio = profile.bio ?? null;
    this.pageFontFamily = profile.pageFontFamily ?? null;
    this.profileMusic = profile.profileMusic ?? null;
    this.blocks = profile.blocks ?? [];
    this.mobileBlocks = profile.mobileBlocks ?? [];
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
    this.profileMusic = profile.profileMusic ?? null;
    this.blocks = profile.blocks ?? [];
    this.mobileBlocks = profile.mobileBlocks ?? [];
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
    animated?: boolean,
  ) {
    if (!source) return null;
    if (source.startsWith("http")) return source;
    const isAnimated = animated ?? source.startsWith("a_");
    return REST.makeCDNUrl(
      CDNRoutes.profileBanner(this.userId, source, format, size, isAnimated),
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
    animated?: boolean,
  ) {
    if (!source) return null;
    if (source.startsWith("http")) return source;
    const isAnimated = animated ?? source.startsWith("a_");
    return REST.makeCDNUrl(
      CDNRoutes.profileBackground(
        this.userId,
        source,
        format,
        size,
        isAnimated,
      ),
    );
  }

  constructBlockImageUrl(
    source: string | null | undefined,
    format: AvatarFormat = ImageFormat.WebP,
    size: Sizes = 512,
    animated?: boolean,
  ) {
    if (!source) return null;
    if (source.startsWith("http")) return source;
    const isAnimated = animated ?? source.startsWith("a_");
    return REST.makeCDNUrl(
      CDNRoutes.profileImage(this.userId, source, format, size, isAnimated),
    );
  }

  constructProfileMusicAudioUrl(hash: string) {
    return REST.makeCDNUrl(CDNRoutes.profileMusic(this.userId, hash));
  }
}
