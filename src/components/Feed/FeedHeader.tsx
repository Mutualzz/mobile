import { IconButton } from "@components/IconButton";
import { PostComposer } from "@components/Feed/PostComposer";
import { BottomSheet } from "@components/Keyboard/BottomSheet";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { useQueryClient } from "@tanstack/react-query";
import type { Href } from "expo-router";
import { usePathname } from "expo-router";
import { HouseIcon, PaletteIcon, PlusIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView } from "react-native";

const TABS = [
  { labelKey: "feed.tabs.forYou", href: "/(tabs)/feed" as Href },
  { labelKey: "feed.tabs.friends", href: "/(tabs)/feed/friends" as Href },
  { labelKey: "feed.tabs.saved", href: "/(tabs)/feed/saved" as Href },
  { labelKey: "feed.tabs.scheduled", href: "/(tabs)/feed/scheduled" as Href },
] as const;

export const FeedHeader = observer(() => {
  const app = useAppStore();
  const { t } = useTranslation("chat");
  const { theme } = useTheme();
  const { navigate } = useAppNavigation();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const username = app.account?.username;
  const [composeOpen, setComposeOpen] = useState(false);
  const isScheduled =
    pathname === "/feed/scheduled" || pathname.endsWith("/feed/scheduled");
  const canCompose = !isScheduled;

  const isActive = (suffix: string) => {
    if (suffix === "/feed") {
      return pathname === "/feed" || pathname === "/feed/";
    }
    return pathname === suffix || pathname.endsWith(suffix);
  };

  const openMyProfile = () => {
    if (!username) return;
    navigate(`/users/${username}` as Href);
  };

  const openProfileEditor = () => {
    navigate("/settings/profile-editor");
  };

  return (
    <Box
      style={{
        borderBottomWidth: 1,
        borderBottomColor: `${theme.typography.colors.muted}30`,
        paddingVertical: 8,
        gap: 8,
      }}
    >
      <Box
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          gap: 8,
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{ gap: 8 }}
        >
          {TABS.map((tab) => {
            const suffix = tab.href.toString().replace("/(tabs)", "");
            const active = isActive(suffix);

            return (
              <Pressable
                key={tab.labelKey}
                onPress={() => navigate(tab.href)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: active
                    ? theme.colors.primary
                    : `${theme.typography.colors.muted}20`,
                }}
              >
                <Typography level="body-sm" weight={active ? 700 : 500}>
                  {t(tab.labelKey)}
                </Typography>
              </Pressable>
            );
          })}
        </ScrollView>

        {username && (
          <Box style={{ flexDirection: "row", gap: 4, flexShrink: 0 }}>
            {canCompose && (
              <IconButton
                padding={6}
                accessibilityLabel={t("feed.header.createPost")}
                onPress={() => setComposeOpen(true)}
              >
                <PlusIcon size={20} weight="bold" />
              </IconButton>
            )}
            <IconButton
              padding={6}
              accessibilityLabel={t("feed.header.myProfile")}
              onPress={openMyProfile}
            >
              <HouseIcon size={20} weight="fill" />
            </IconButton>
            <IconButton
              padding={6}
              accessibilityLabel={t("feed.header.customizeProfile")}
              onPress={openProfileEditor}
            >
              <PaletteIcon size={20} weight="fill" />
            </IconButton>
          </Box>
        )}
      </Box>

      <BottomSheet
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        title={t("feed.header.createPostSheetTitle")}
        maxHeight="85%"
        elevation={app.settings?.preferEmbossed ? 4 : 2}
      >
        <PostComposer
          onPosted={() => {
            void queryClient.invalidateQueries({
              queryKey: ["posts", "for-you"],
            });
            void queryClient.invalidateQueries({
              queryKey: ["posts", "friends"],
            });
            setComposeOpen(false);
          }}
        />
      </BottomSheet>
    </Box>
  );
});
