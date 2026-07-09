import { IconButton } from "@components/IconButton";
import { PostComposer } from "@components/Feed/PostComposer";
import { Paper } from "@components/Paper";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import { Box, Modal, Typography, useTheme } from "@mutualzz/ui-native";
import { useQueryClient } from "@tanstack/react-query";
import type { Href } from "expo-router";
import { usePathname } from "expo-router";
import { HouseIcon, PaletteIcon, PlusIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

const TABS = [
  { label: "For You", href: "/(tabs)/feed" as Href },
  { label: "Friends", href: "/(tabs)/feed/friends" as Href },
  { label: "Saved", href: "/(tabs)/feed/saved" as Href },
  { label: "Scheduled", href: "/(tabs)/feed/scheduled" as Href },
] as const;

export const FeedHeader = observer(() => {
  const app = useAppStore();
  const { theme } = useTheme();
  const { navigate } = useAppNavigation();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const username = app.account?.username;
  const [composeOpen, setComposeOpen] = useState(false);
  const isForYou = pathname === "/feed" || pathname === "/feed/";

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
                key={tab.label}
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
                  {tab.label}
                </Typography>
              </Pressable>
            );
          })}
        </ScrollView>

        {username ? (
          <Box style={{ flexDirection: "row", gap: 4, flexShrink: 0 }}>
            {isForYou ? (
              <IconButton
                padding={6}
                accessibilityLabel="Create post"
                onPress={() => setComposeOpen(true)}
              >
                <PlusIcon size={20} weight="bold" />
              </IconButton>
            ) : null}
            <IconButton
              padding={6}
              accessibilityLabel="My profile"
              onPress={openMyProfile}
            >
              <HouseIcon size={20} weight="fill" />
            </IconButton>
            <IconButton
              padding={6}
              accessibilityLabel="Customize profile"
              onPress={openProfileEditor}
            >
              <PaletteIcon size={20} weight="fill" />
            </IconButton>
          </Box>
        ) : null}
      </Box>

      <Modal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        layout="fullscreen"
        showCloseButton={false}
        style={{
          justifyContent: "flex-end",
          alignItems: "stretch",
          backgroundColor: "transparent",
          paddingVertical: 0,
        }}
      >
        <View
          pointerEvents="box-none"
          style={{ flex: 1, justifyContent: "flex-end", width: "100%" }}
        >
          <Paper
            style={{
              maxHeight: "85%",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 16,
              gap: 12,
            }}
            elevation={app.settings?.preferEmbossed ? 4 : 2}
          >
            <Typography level="body-lg" weight={700}>
              Create post
            </Typography>
            <PostComposer
              onPosted={() => {
                void queryClient.invalidateQueries({
                  queryKey: ["posts", "for-you"],
                });
                setComposeOpen(false);
              }}
            />
          </Paper>
        </View>
      </Modal>
    </Box>
  );
});
