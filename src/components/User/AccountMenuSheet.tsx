import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { ChangeOnlineStatusModal } from "@components/User/ChangeOnlineStatusModal";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import type { ProfileHeaderBlock } from "@mutualzz/types";
import {
  Box,
  Divider,
  IconButton,
  Typography,
  useTheme,
} from "@mutualzz/ui-native";
import {
  CameraIcon,
  GearIcon,
  PencilSimpleIcon,
  UserIcon,
} from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Image, Modal, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  visible: boolean;
  onClose: () => void;
}

const AVATAR_SIZE = 64;
const AVATAR_OVERLAP = AVATAR_SIZE / 2;

const DEFAULT_BANNER_HEIGHT_PERCENT = 58;
const BASE_BANNER_HEIGHT = 72;
const MIN_BANNER_HEIGHT = 48;
const MAX_BANNER_HEIGHT = 140;

export const AccountMenuSheet = observer(({ visible, onClose }: Props) => {
  const app = useAppStore();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { navigate } = useAppNavigation();
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  const account = app.account;
  if (!account) return null;

  const profile = app.profiles.get(account.id);
  const bannerUrl = profile?.constructBannerUrl();
  const customStatus = app.customStatus.effectiveText;

  const headerBlock = profile?.blocks.find(
    (block): block is ProfileHeaderBlock => block.type === "header",
  );
  const bannerHeightPercent =
    headerBlock?.bannerHeight ?? DEFAULT_BANNER_HEIGHT_PERCENT;
  const bannerHeight = Math.min(
    MAX_BANNER_HEIGHT,
    Math.max(
      MIN_BANNER_HEIGHT,
      Math.round(
        (bannerHeightPercent / DEFAULT_BANNER_HEIGHT_PERCENT) *
          BASE_BANNER_HEIGHT,
      ),
    ),
  );

  const go = (href: Parameters<typeof navigate>[0]) => {
    onClose();
    navigate(href);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Box
        style={{
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(0,0,0,0.45)",
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <Paper
          elevation={app.settings?.preferEmbossed ? 4 : 2}
          style={{
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            overflow: "hidden",
            gap: 12,
          }}
        >
          <Box style={{ position: "relative" }}>
            <Box
              style={{
                height: bannerHeight,
                backgroundColor: bannerUrl ? undefined : account.accentColor,
              }}
            >
              {bannerUrl ? (
                <Image
                  source={{ uri: bannerUrl }}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              ) : null}
            </Box>

            <IconButton
              variant="solid"
              color="neutral"
              padding={8}
              accessibilityLabel="Settings"
              onPress={() => go("/settings")}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                borderRadius: 9999,
              }}
            >
              <GearIcon weight="fill" size={18} />
            </IconButton>

            <Box
              style={{
                position: "absolute",
                left: 16,
                right: 16,
                bottom: -AVATAR_OVERLAP,
                height: AVATAR_SIZE,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Pressable onPress={() => setStatusModalOpen(true)}>
                <UserAvatar
                  user={account}
                  size={AVATAR_SIZE}
                  badge
                  showInvisible
                />
              </Pressable>

              <Pressable
                onPress={() => setStatusModalOpen(true)}
                style={{ flex: 1, minWidth: 0 }}
              >
                <Box
                  style={{
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    backgroundColor: theme.colors.surface,
                  }}
                >
                  <Typography
                    level="body-sm"
                    textColor={customStatus ? undefined : "muted"}
                    numberOfLines={1}
                  >
                    {customStatus || "Set a custom status..."}
                  </Typography>
                </Box>
              </Pressable>
            </Box>
          </Box>

          <Box
            style={{
              paddingTop: AVATAR_OVERLAP,
              paddingHorizontal: 16,
              gap: 12,
            }}
          >
            <Box style={{ gap: 2 }}>
              <Typography level="title-md">{account.displayName}</Typography>
              <Typography level="body-sm" textColor="muted">
                @{account.username}
              </Typography>
            </Box>

            <Divider />

            <Box
              style={{
                gap: 4,
                paddingBottom: Math.max(16, insets.bottom),
              }}
            >
              <Button
                variant="plain"
                horizontalAlign="left"
                startDecorator={<UserIcon size={20} weight="fill" />}
                onPress={() => go(`/users/${account.username}`)}
              >
                View Profile
              </Button>
              <Button
                variant="plain"
                horizontalAlign="left"
                startDecorator={<PencilSimpleIcon size={20} weight="fill" />}
                onPress={() => go("/settings/profile-editor")}
              >
                Customize Profile
              </Button>
              <Button
                variant="plain"
                horizontalAlign="left"
                startDecorator={<CameraIcon size={20} weight="fill" />}
                onPress={() => go("/settings/avatar-editor")}
              >
                Edit Avatar
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>

      <ChangeOnlineStatusModal
        visible={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onDone={() => {
          setStatusModalOpen(false);
          onClose();
        }}
      />
    </Modal>
  );
});
