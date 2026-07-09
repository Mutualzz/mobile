import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { ProfileMarkdownContent } from "@components/Profile/shared/ProfileMarkdownContent";
import { ProfileWidgetGrid } from "@components/Profile/widgets/ProfileWidgetGrid";
import { ProfileWidgetsEmptyViewer } from "@components/Profile/widgets/ProfileWidgetsEmptyViewer";
import { ReportContentSheet } from "@components/Report/ReportContentSheet";
import { ChangeOnlineStatusModal } from "@components/User/ChangeOnlineStatusModal";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useUserRelationshipActions } from "@hooks/useUserRelationshipActions";
import { useModal } from "@hooks/useModal";
import { useAppStore } from "@hooks/useStores";
import type { AccountStore } from "@stores/Account.store";
import type { SpaceMember } from "@stores/objects/SpaceMember";
import type { User } from "@stores/objects/User";
import type { ProfileHeaderBlock } from "@mutualzz/types";
import {
  Box,
  Divider,
  IconButton,
  Typography,
  useTheme,
} from "@mutualzz/ui-native";
import {
  PROFILE_SHEET_HEIGHT_RATIO,
  useModalSheetMaxHeight,
} from "@utils/modalSheet";
import { useScaledProfileMetrics } from "@utils/accessibilityLayout";
import { useQuery } from "@tanstack/react-query";
import type { Href } from "expo-router";
import {
  ChatCircleIcon,
  FlagIcon,
  GearIcon,
  PencilSimpleIcon,
  XIcon,
} from "phosphor-react-native";
import { ProfileBlockImage } from "@components/Profile/shared/ProfileBlockImage";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  user: User | AccountStore;
  member?: SpaceMember;
  modalId: string;
  accountMenu?: boolean;
  onClose?: () => void;
}

const DEFAULT_BANNER_HEIGHT_PERCENT = 58;

function formatPresenceStatus(status: string) {
  switch (status) {
    case "online":
      return "Online";
    case "idle":
      return "Idle";
    case "dnd":
      return "Do Not Disturb";
    case "invisible":
      return "Invisible";
    default:
      return null;
  }
}

export const UserProfileSheet = observer(
  ({ user, member, modalId, accountMenu = false, onClose }: Props) => {
    const app = useAppStore();
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const sheetHeight = useModalSheetMaxHeight(PROFILE_SHEET_HEIGHT_RATIO);
    const profileMetrics = useScaledProfileMetrics();
    const avatarOverlap = profileMetrics.avatarSize / 2;
    const { closeModal, openModal } = useModal();
    const { navigate } = useAppNavigation();
    const [statusModalOpen, setStatusModalOpen] = useState(false);

    useEffect(() => {
      app.gateway.subscribeUser(user.id);
      return () => app.gateway.unsubscribeUser(user.id);
    }, [app.gateway, user.id]);

    const { data: fetchedProfile, isLoading } = useQuery({
      queryKey: ["profile-popout", user.id],
      queryFn: () => app.profiles.resolve(user.id),
    });

    const profile = app.profiles.get(user.id) ?? fetchedProfile;
    void profile?.updatedAt;

    const isSelf = app.account?.id === user.id;
    const isViewerStaff = app.account?.isStaff ?? false;
    const showAccountMenu = accountMenu && isSelf;

    useEffect(() => {
      if (!isSelf) void app.relationships.resolveAll();
    }, [app.relationships, isSelf]);

    const {
      isFriend,
      isIncomingRequest,
      isOutgoingRequest,
      iBlockedThem,
      relationshipPending,
      addFriend,
      acceptFriend,
      declineFriend,
      removeFriend,
      blockUser,
      unblockUser,
    } = useUserRelationshipActions(user.id);

    const bannerUrl = profile?.constructBannerUrl();
    const backgroundUrl = profile?.constructBackgroundUrl() ?? null;
    const resolvedBackgroundColor =
      profile?.backgroundColor ?? theme.colors.surface;
    const displayName = member?.displayName ?? user.displayName;
    const presence = app.presence.get(user.id);
    const customActivity = presence?.activities.find(
      (a) => a.type === "custom",
    );
    const customStatus = isSelf
      ? app.customStatus.effectiveText
      : customActivity?.state;
    const presenceLabel =
      customActivity?.state && !isSelf
        ? customActivity.state
        : presence?.status
          ? formatPresenceStatus(presence.status)
          : null;

    const headerBlock = profile?.blocks.find(
      (block): block is ProfileHeaderBlock => block.type === "header",
    );

    const bannerHeight = useMemo(() => {
      const bannerHeightPercent =
        headerBlock?.bannerHeight ?? DEFAULT_BANNER_HEIGHT_PERCENT;
      const rawHeight = Math.min(
        profileMetrics.maxBannerHeight,
        Math.max(
          profileMetrics.minBannerHeight,
          Math.round(
            (bannerHeightPercent / DEFAULT_BANNER_HEIGHT_PERCENT) *
              profileMetrics.baseBannerHeight,
          ),
        ),
      );
      return rawHeight;
    }, [headerBlock?.bannerHeight, profileMetrics]);

    const close = () => {
      if (onClose) {
        onClose();
        return;
      }

      closeModal(modalId);
    };

    const openDM = async () => {
      close();
      const channel = await app.relationships.openDMWith(user.id);
      navigate(`/@me/${channel.id}`);
    };

    const go = (href: Parameters<typeof navigate>[0]) => {
      close();
      navigate(href);
    };

    const openStaffPanel = () => {
      close();
      navigate(`/staff/users/${user.id}` as Href);
    };

    const openReport = () => {
      close();
      openModal(
        `report-user-${user.id}`,
        <ReportContentSheet
          targetType="user"
          targetId={user.id}
          contentLabel="this user"
          modalId={`report-user-${user.id}`}
        />,
      );
    };

    return (
      <Paper
        style={{
          width: "100%",
          height: sheetHeight,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          overflow: "hidden",
        }}
        elevation={app.settings?.preferEmbossed ? 3 : 1}
      >
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: resolvedBackgroundColor,
          }}
        />
        {backgroundUrl ? (
          <ProfileBlockImage
            uri={backgroundUrl}
            assetHash={profile?.backgroundImage}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            resizeMode="cover"
          />
        ) : null}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: Math.max(24, insets.bottom),
          }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ position: "relative", zIndex: 1 }}>
            <View style={{ marginBottom: avatarOverlap + 12 }}>
              <View
                style={{
                  height: bannerHeight,
                  backgroundColor: bannerUrl ? undefined : user.accentColor,
                }}
              >
                {bannerUrl ? (
                  <ProfileBlockImage
                    uri={bannerUrl}
                    assetHash={profile?.banner}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                ) : null}
              </View>

              <View
                style={{
                  position: "absolute",
                  top: insets.top - 32,
                  left: 12,
                  right: 12,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <IconButton
                  variant="solid"
                  color="neutral"
                  padding={4}
                  accessibilityLabel="Close profile"
                  onPress={close}
                  style={{ borderRadius: 9999 }}
                  size="sm"
                >
                  <XIcon size={18} weight="bold" />
                </IconButton>

                {showAccountMenu ? (
                  <IconButton
                    variant="solid"
                    color="neutral"
                    padding={4}
                    accessibilityLabel="Settings"
                    onPress={() => go("/settings")}
                    style={{ borderRadius: 9999 }}
                    size="sm"
                  >
                    <GearIcon weight="fill" size={18} />
                  </IconButton>
                ) : null}
              </View>

              <View
                style={{
                  position: "absolute",
                  left: 16,
                  right: 16,
                  bottom: -avatarOverlap,
                  flexDirection: "row",
                  alignItems: "flex-end",
                  gap: 12,
                }}
              >
                <Pressable
                  disabled={!showAccountMenu}
                  onPress={() => showAccountMenu && setStatusModalOpen(true)}
                >
                  <UserAvatar
                    user={user}
                    size={profileMetrics.avatarSize}
                    badge
                    showInvisible={showAccountMenu}
                  />
                </Pressable>

                {showAccountMenu ? (
                  <Pressable
                    onPress={() => setStatusModalOpen(true)}
                    style={{ flex: 1, minWidth: 0, marginBottom: 4 }}
                  >
                    <Box
                      style={{
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        backgroundColor: theme.colors.surface,
                      }}
                    >
                      <Typography
                        level="body-sm"
                        textColor={customStatus ? undefined : "muted"}
                        truncate="double"
                      >
                        {customStatus || "Set a custom status..."}
                      </Typography>
                    </Box>
                  </Pressable>
                ) : null}
              </View>
            </View>

            <Box style={{ paddingHorizontal: 16, gap: 12 }}>
              {isLoading && !profile ? (
                <Box style={{ paddingVertical: 24, alignItems: "center" }}>
                  <ActivityIndicator color={theme.colors.primary} />
                </Box>
              ) : (
                <>
                  <Box style={{ gap: 4 }}>
                    <Typography level="title-lg" truncate="single">
                      {displayName}
                    </Typography>
                    <Typography
                      level="body-md"
                      textColor="muted"
                      truncate="single"
                    >
                      @{user.username}
                    </Typography>
                    {presenceLabel && !showAccountMenu ? (
                      <Typography level="body-sm" textColor="accent">
                        {presenceLabel}
                      </Typography>
                    ) : null}
                  </Box>

                  {profile?.bio ? (
                    <ProfileMarkdownContent value={profile.bio} />
                  ) : null}

                  <Box
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                  >
                    {isSelf ? (
                      <Button
                        size="sm"
                        color="neutral"
                        onPress={() => go("/settings/profile")}
                        startDecorator={
                          <PencilSimpleIcon size={16} weight="fill" />
                        }
                      >
                        Edit Profile
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        color="primary"
                        disabled={iBlockedThem}
                        onPress={() => openDM()}
                        startDecorator={
                          <ChatCircleIcon size={16} weight="fill" />
                        }
                      >
                        Message
                      </Button>
                    )}
                    {!isSelf &&
                    !isFriend &&
                    !isIncomingRequest &&
                    !isOutgoingRequest ? (
                      <Button
                        size="sm"
                        color="neutral"
                        variant="soft"
                        disabled={relationshipPending || iBlockedThem}
                        onPress={() => addFriend.mutate()}
                      >
                        Add Friend
                      </Button>
                    ) : null}
                    {!isSelf && isIncomingRequest ? (
                      <>
                        <Button
                          size="sm"
                          color="success"
                          disabled={relationshipPending || iBlockedThem}
                          onPress={() => acceptFriend.mutate()}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          color="neutral"
                          variant="soft"
                          disabled={relationshipPending || iBlockedThem}
                          onPress={() => declineFriend.mutate()}
                        >
                          Decline
                        </Button>
                      </>
                    ) : null}
                    {!isSelf && isOutgoingRequest ? (
                      <Button
                        size="sm"
                        color="neutral"
                        variant="soft"
                        disabled={relationshipPending}
                        onPress={() => declineFriend.mutate()}
                      >
                        Cancel Request
                      </Button>
                    ) : null}
                    {!isSelf && isFriend ? (
                      <Button
                        size="sm"
                        color="neutral"
                        variant="soft"
                        disabled={relationshipPending || iBlockedThem}
                        onPress={() => removeFriend.mutate()}
                      >
                        Remove Friend
                      </Button>
                    ) : null}
                    {!isSelf ? (
                      iBlockedThem ? (
                        <Button
                          size="sm"
                          color="neutral"
                          variant="soft"
                          disabled={relationshipPending}
                          onPress={() => unblockUser.mutate()}
                        >
                          Unblock
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          color="danger"
                          variant="soft"
                          disabled={relationshipPending}
                          onPress={() => blockUser.mutate()}
                        >
                          Block
                        </Button>
                      )
                    ) : null}
                    {!isSelf ? (
                      <Button
                        size="sm"
                        color="neutral"
                        variant="soft"
                        onPress={() => go(`/users/${user.username}`)}
                      >
                        View Profile
                      </Button>
                    ) : null}
                    {isViewerStaff && !isSelf ? (
                      <Button
                        size="sm"
                        color="danger"
                        variant="soft"
                        onPress={openStaffPanel}
                      >
                        Staff Panel
                      </Button>
                    ) : null}
                    {!isSelf ? (
                      <Button
                        size="sm"
                        color="danger"
                        variant="soft"
                        startDecorator={<FlagIcon size={16} weight="fill" />}
                        onPress={openReport}
                      >
                        Report
                      </Button>
                    ) : null}
                  </Box>

                  <Divider />

                  {profile ? (
                    profile.mobileBlocks.length > 0 ? (
                      <ProfileWidgetGrid profile={profile} user={user} />
                    ) : (
                      <ProfileWidgetsEmptyViewer />
                    )
                  ) : null}
                </>
              )}
            </Box>
          </View>
        </ScrollView>

        {showAccountMenu ? (
          <ChangeOnlineStatusModal
            visible={statusModalOpen}
            onClose={() => setStatusModalOpen(false)}
            onDone={() => setStatusModalOpen(false)}
          />
        ) : null}
      </Paper>
    );
  },
);
