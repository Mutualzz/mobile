import type { ProfileLinkKind } from "@components/Profile/widgets/blocks/profileLink.utils";
import {
  AppleLogoIcon,
  DiscordLogoIcon,
  GithubLogoIcon,
  GlobeIcon,
  InstagramLogoIcon,
  LinkIcon,
  LinkedinLogoIcon,
  MusicNotesIcon,
  RedditLogoIcon,
  SoundcloudLogoIcon,
  SpotifyLogoIcon,
  TiktokLogoIcon,
  TwitchLogoIcon,
  TwitterLogoIcon,
  YoutubeLogoIcon,
} from "phosphor-react-native";

interface Props {
  kind: ProfileLinkKind;
  size?: number;
  color?: string;
}

export function ProfileLinkKindIcon({ kind, size, color }: Props) {
  switch (kind) {
    case "youtube":
      return <YoutubeLogoIcon weight="fill" size={size} color={color} />;
    case "twitch":
      return <TwitchLogoIcon weight="fill" size={size} color={color} />;
    case "spotify":
      return <SpotifyLogoIcon weight="fill" size={size} color={color} />;
    case "soundcloud":
      return <SoundcloudLogoIcon weight="fill" size={size} color={color} />;
    case "apple":
      return <AppleLogoIcon weight="fill" size={size} color={color} />;
    case "deezer":
    case "bandcamp":
      return <MusicNotesIcon weight="fill" size={size} color={color} />;
    case "github":
      return <GithubLogoIcon weight="fill" size={size} color={color} />;
    case "discord":
      return <DiscordLogoIcon weight="fill" size={size} color={color} />;
    case "twitter":
      return <TwitterLogoIcon weight="fill" size={size} color={color} />;
    case "instagram":
      return <InstagramLogoIcon weight="fill" size={size} color={color} />;
    case "tiktok":
      return <TiktokLogoIcon weight="fill" size={size} color={color} />;
    case "linkedin":
      return <LinkedinLogoIcon weight="fill" size={size} color={color} />;
    case "reddit":
      return <RedditLogoIcon weight="fill" size={size} color={color} />;
    case "website":
      return <GlobeIcon weight="fill" size={size} color={color} />;
    default:
      return <LinkIcon weight="bold" size={size} color={color} />;
  }
}
