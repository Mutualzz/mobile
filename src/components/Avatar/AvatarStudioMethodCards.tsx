import { Paper } from "@components/Paper";
import { useSettingsIconColor } from "@components/UserSettings/settingsTheme";
import { Box, Typography } from "@mutualzz/ui-native";
import {
  CaretRightIcon,
  ImagesIcon,
  PaintBrushIcon,
  UploadSimpleIcon,
} from "phosphor-react-native";
import { Pressable } from "react-native";
import { useTranslation } from "react-i18next";

const METHOD_CARDS = [
  {
    method: "upload",
    titleKey: "profile.methodUpload",
    descriptionKey: "profile.methodUploadDescriptionMobile",
    icon: UploadSimpleIcon,
  },
  {
    method: "draw",
    titleKey: "profile.methodDraw",
    descriptionKey: "profile.methodDrawDescription",
    icon: PaintBrushIcon,
  },
  {
    method: "avatars",
    titleKey: "profile.methodAvatars",
    descriptionKey: "profile.methodAvatarsDescription",
    icon: ImagesIcon,
  },
] as const;

export type AvatarStudioMethod = (typeof METHOD_CARDS)[number]["method"];

interface Props {
  embossed?: boolean;
  onUpload: () => void;
  onDraw: () => void;
  onAvatars: () => void;
}

export function AvatarStudioMethodCards({
  embossed = false,
  onUpload,
  onDraw,
  onAvatars,
}: Props) {
  const { t } = useTranslation("settings");
  const iconColor = useSettingsIconColor();
  const mutedIconColor = useSettingsIconColor("neutral");

  const handlers: Record<AvatarStudioMethod, () => void> = {
    upload: onUpload,
    draw: onDraw,
    avatars: onAvatars,
  };

  return (
    <Box style={{ gap: 8 }}>
      {METHOD_CARDS.map((card) => {
        const Icon = card.icon;
        const title = t(card.titleKey);

        return (
          <Pressable
            key={card.method}
            onPress={handlers[card.method]}
            accessibilityRole="button"
            accessibilityLabel={title}
          >
            <Paper
              variant="soft"
              style={{
                padding: 12,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                minWidth: 0,
              }}
              elevation={embossed ? 1 : 0}
            >
              <Paper
                variant="plain"
                style={{
                  padding: 8,
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={22} weight="fill" color={iconColor} />
              </Paper>
              <Box style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <Typography level="body-sm" weight={700}>
                  {title}
                </Typography>
                <Typography
                  level="body-xs"
                  textColor="muted"
                  truncate="double"
                >
                  {t(card.descriptionKey)}
                </Typography>
              </Box>
              <CaretRightIcon
                size={18}
                weight="bold"
                color={mutedIconColor}
                style={{ flexShrink: 0 }}
              />
            </Paper>
          </Pressable>
        );
      })}
    </Box>
  );
}
