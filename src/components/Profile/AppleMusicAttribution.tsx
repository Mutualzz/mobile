import { Stack, Typography } from "@mutualzz/ui-native";
import { Image } from "expo-image";
import appleMusicBadge from "../../../assets/brands/apple-music-badge.svg";
import { useTranslation } from "react-i18next";
import { Linking, Pressable } from "react-native";

const MIN_BADGE_HEIGHT = 30;
const CLEAR_SPACE_RATIO = 0.1;
const BADGE_ASPECT_RATIO = 104.7746 / 41;
const APPLE_MUSIC_URL = "https://music.apple.com";

interface Props {
  trackUrl?: string | null;
  badgeHeight?: number;
  showBadge?: boolean;
}

export function AppleMusicAttribution({
  trackUrl,
  badgeHeight = MIN_BADGE_HEIGHT,
  showBadge = true,
}: Props) {
  const { t } = useTranslation("settings");
  const height = Math.max(badgeHeight, MIN_BADGE_HEIGHT);
  const href = trackUrl || APPLE_MUSIC_URL;

  return (
    <Stack
      direction="row"
      alignItems="center"
      style={{ flexWrap: "wrap", gap: 8 }}
    >
      {showBadge && (
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={t("profile.music.listenOnAppleMusic")}
          onPress={() => {
            Linking.openURL(href).catch(() => {});
          }}
          style={{ padding: height * CLEAR_SPACE_RATIO }}
        >
          <Image
            source={appleMusicBadge}
            contentFit="contain"
            style={{ height, width: height * BADGE_ASPECT_RATIO }}
          />
        </Pressable>
      )}
      <Typography level="body-xs" textColor="muted">
        {t("profile.music.courtesyOfItunes")}
      </Typography>
    </Stack>
  );
}
