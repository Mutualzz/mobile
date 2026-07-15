import { Button } from "@components/Button";
import { MarkdownInput } from "@components/Markdown/MarkdownInput/MarkdownInput";
import { ProfileMarkdownContent } from "@components/Profile/shared/ProfileMarkdownContent";
import { RecentActivitiesSection } from "@components/Profile/shared/RecentActivitiesSection";
import { UserPresenceCard } from "@components/Profile/UserPresenceCard";
import { ProfileWidgetGrid } from "@components/Profile/widgets/ProfileWidgetGrid";
import { ProfileWidgetsEmptyViewer } from "@components/Profile/widgets/ProfileWidgetsEmptyViewer";
import { ReportContentSheet } from "@components/Report/ReportContentSheet";
import { ChangeOnlineStatusSheet } from "@components/User/ChangeOnlineStatusSheet";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useUserRelationshipActions } from "@hooks/useUserRelationshipActions";
import { useSheet } from "@hooks/useSheet";
import { useOpenBottomSheet } from "@hooks/useOpenBottomSheet";
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
import { useScaledProfileMetrics } from "@utils/accessibilityLayout";
import { getNonCustomActivities } from "@utils/customStatus";
import { formatRestError } from "@utils/restError";
import Snowflake from "@utils/Snowflake";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  FlagIcon,
  GearIcon,
  PaperPlaneTiltIcon,
  PencilSimpleIcon,
  XIcon,
} from "phosphor-react-native";
import { ProfileBackgroundLayer } from "@components/Profile/shared/ProfileBackgroundLayer";
import { ProfileBlockImage } from "@components/Profile/shared/ProfileBlockImage";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, ScrollView, View } from "react-native";

interface Props {
  user: User | AccountStore;
  member?: SpaceMember;
  sheetId: string;
  accountMenu?: boolean;
  onClose?: () => void;
}

const DEFAULT_BANNER_HEIGHT_PERCENT = 58;

export const UserProfileSheet = observer(
  ({ user, member, sheetId, accountMenu = false, onClose }: Props) => {
    const { t } = useTranslation("common");
    const { t: tChat } = useTranslation("chat");
    const app = useAppStore();
    const { theme } = useTheme();
    const profileMetrics = useScaledProfileMetrics();
    const avatarOverlap = profileMetrics.avatarSize / 2;
    const { closeSheet, openSheet } = useSheet();
    const { openBottomSheet, closeBottomSheet } = useOpenBottomSheet();
    const { navigate } = useAppNavigation();
    const [content, setContent] = useState("");
    const [selection, setSelection] = useState({ start: 0, end: 0 });

    const openStatusSheet = () => {
      openBottomSheet(
        "change-online-status",
        <ChangeOnlineStatusSheet
          embedded
          onClose={() => closeBottomSheet("change-online-status")}
          onDone={() => closeBottomSheet("change-online-status")}
        />,
      );
    };

    useEffect(() => {
      app.gateway.subscribeUser(user.id);
      return () => app.gateway.unsubscribeUser(user.id);
    }, [app.gateway, user.id]);

    const { data: fetchedProfile } = useQuery({
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

    const relationship = app.relationships.getForMe(user.id);
    const theyBlockedMe =
      !!relationship?.isBlocked && relationship.userId !== app.account?.id;
    const denyMessaging = !!user.flags?.has("System") || iBlockedThem;

    const close = () => {
      if (onClose) {
        onClose();
        return;
      }

      closeSheet(sheetId);
    };

    const { mutate: sendMessage, isPending: sending } = useMutation({
      mutationKey: ["profile-sheet-dm", user.id],
      mutationFn: async (messageContent: string) => {
        if (theyBlockedMe) throw new Error(tChat("cannotMessagePerson"));
        const channel = await app.channels.openDM(user.id);
        await channel.sendMessage({
          content: messageContent,
          nonce: Snowflake.generate(),
        });
        return channel;
      },
      onSuccess: (channel) => {
        setContent("");
        setSelection({ start: 0, end: 0 });
        close();
        navigate(`/@me/${channel.id}`);
      },
      onError: (err) => {
        Alert.alert(
          tChat("cannotMessagePerson"),
          formatRestError(err, tChat("cannotMessagePerson")),
        );
      },
    });

    const bannerUrl = profile?.constructBannerUrl();
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
        : (() => {
            switch (presence?.status) {
              case "online":
                return t("status.online");
              case "idle":
                return t("status.idle");
              case "dnd":
                return t("status.dnd");
              case "invisible":
                return t("status.invisible");
              default:
                return null;
            }
          })();

    const headerBlock = profile?.blocks.find(
      (block): block is ProfileHeaderBlock => block.type === "header",
    );

    const hasActivityWidget =
      profile?.mobileBlocks.some((block) => block.type === "activity") ?? false;

    const isPresenceActive =
      presence?.status === "online" ||
      presence?.status === "idle" ||
      presence?.status === "dnd";

    const liveActivities =
      isPresenceActive && presence ? getNonCustomActivities(presence) : [];

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

    const go = (href: Parameters<typeof navigate>[0]) => {
      close();
      navigate(href);
    };

    const openStaffPanel = () => {
      close();
      navigate(isSelf ? "/staff" : `/staff/users/${user.id}`);
    };

    const openReport = () => {
      close();
      openSheet(
        `report-user-${user.id}`,
        <ReportContentSheet
          targetType="user"
          targetId={user.id}
          contentLabel={tChat("contextMenu.reportAccount")}
          sheetId={`report-user-${user.id}`}
        />,
      );
    };

    const canSubmit = !!content.trim() && !denyMessaging && !sending;

    const handleSubmit = () => {
      if (!canSubmit) return;
      sendMessage(content.trim());
    };

    return (
      <View
        style={{
          flex: 1,
          width: "100%",
          minHeight: 0,
          overflow: "hidden",
          backgroundColor: theme.colors.surface,
        }}
      >
        {profile ? <ProfileBackgroundLayer profile={profile} /> : null}

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ position: "relative", zIndex: 1 }}>
            <View style={{ marginBottom: avatarOverlap + 12 }}>
              <View
                style={{
                  height: bannerHeight,
                  backgroundColor: bannerUrl ? undefined : user.accentColor,
                }}
              >
                {bannerUrl && (
                  <ProfileBlockImage
                    uri={bannerUrl}
                    assetHash={profile?.banner}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                )}
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    top: 8,
                    left: 0,
                    right: 0,
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: "rgba(255,255,255,0.7)",
                      shadowColor: "#000",
                      shadowOpacity: 0.35,
                      shadowRadius: 2,
                      shadowOffset: { width: 0, height: 1 },
                    }}
                  />
                </View>
              </View>

              <View
                style={{
                  position: "absolute",
                  top: 24,
                  left: 16,
                  right: 16,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <IconButton
                  variant="solid"
                  color="neutral"
                  padding={4}
                  accessibilityLabel={t("a11y.closeProfile")}
                  onPress={close}
                  style={{ borderRadius: 9999 }}
                  size="sm"
                >
                  <XIcon size={18} weight="bold" />
                </IconButton>

                {showAccountMenu && (
                  <IconButton
                    variant="solid"
                    color="neutral"
                    padding={4}
                    accessibilityLabel={t("a11y.settings")}
                    onPress={() => go("/settings")}
                    style={{ borderRadius: 9999 }}
                    size="sm"
                  >
                    <GearIcon weight="fill" size={18} />
                  </IconButton>
                )}
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
                  onPress={() => showAccountMenu && openStatusSheet()}
                >
                  <UserAvatar
                    user={user}
                    size={profileMetrics.avatarSize}
                    badge
                    showInvisible={showAccountMenu}
                  />
                </Pressable>

                {showAccountMenu && (
                  <Pressable
                    onPress={openStatusSheet}
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
                        {customStatus || t("customStatus.setShort")}
                      </Typography>
                    </Box>
                  </Pressable>
                )}
              </View>
            </View>

            <Box style={{ paddingHorizontal: 16, gap: 12 }}>
              <Box style={{ gap: 4 }}>
                <Typography level="title-lg" truncate="single">
                  {displayName}
                </Typography>
                <Typography level="body-md" textColor="muted" truncate="single">
                  @{user.username}
                </Typography>
                {presenceLabel && !showAccountMenu && (
                  <Typography level="body-sm" textColor="accent">
                    {presenceLabel}
                  </Typography>
                )}
              </Box>

              {profile?.bio && <ProfileMarkdownContent value={profile.bio} />}

              {!hasActivityWidget && (
                <>
                  {presence ? (
                    <UserPresenceCard presence={presence} isCompact />
                  ) : null}
                  <RecentActivitiesSection
                    userId={user.id}
                    liveActivities={liveActivities}
                    isCompact
                  />
                </>
              )}

              <Box style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {isSelf && (
                  <Button
                    size="sm"
                    color="neutral"
                    onPress={() => go("/settings/profile")}
                    startDecorator={
                      <PencilSimpleIcon size={16} weight="fill" />
                    }
                  >
                    {tChat("contextMenu.editProfile")}
                  </Button>
                )}
                {!isSelf &&
                  !isFriend &&
                  !isIncomingRequest &&
                  !isOutgoingRequest && (
                    <Button
                      size="sm"
                      color="neutral"
                      variant="soft"
                      disabled={relationshipPending || iBlockedThem}
                      onPress={() => addFriend.mutate()}
                    >
                      {tChat("contextMenu.addFriend")}
                    </Button>
                  )}
                {!isSelf && isIncomingRequest && (
                  <>
                    <Button
                      size="sm"
                      color="success"
                      disabled={relationshipPending || iBlockedThem}
                      onPress={() => acceptFriend.mutate()}
                    >
                      {t("accept")}
                    </Button>
                    <Button
                      size="sm"
                      color="neutral"
                      variant="soft"
                      disabled={relationshipPending || iBlockedThem}
                      onPress={() => declineFriend.mutate()}
                    >
                      {t("decline")}
                    </Button>
                  </>
                )}
                {!isSelf && isOutgoingRequest && (
                  <Button
                    size="sm"
                    color="neutral"
                    variant="soft"
                    disabled={relationshipPending}
                    onPress={() => declineFriend.mutate()}
                  >
                    {tChat("contextMenu.cancelFriendRequest")}
                  </Button>
                )}
                {!isSelf && isFriend && (
                  <Button
                    size="sm"
                    color="neutral"
                    variant="soft"
                    disabled={relationshipPending || iBlockedThem}
                    onPress={() => removeFriend.mutate()}
                  >
                    {tChat("contextMenu.removeFriend")}
                  </Button>
                )}
                {!isSelf &&
                  (iBlockedThem ? (
                    <Button
                      size="sm"
                      color="neutral"
                      variant="soft"
                      disabled={relationshipPending}
                      onPress={() => unblockUser.mutate()}
                    >
                      {tChat("contextMenu.unblock")}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      color="danger"
                      variant="soft"
                      disabled={relationshipPending}
                      onPress={() => blockUser.mutate()}
                    >
                      {tChat("contextMenu.block")}
                    </Button>
                  ))}
                {!isSelf && (
                  <Button
                    size="sm"
                    color="neutral"
                    variant="soft"
                    onPress={() => go(`/users/${user.username}`)}
                  >
                    {tChat("contextMenu.viewProfile")}
                  </Button>
                )}
                {isViewerStaff && !isSelf && (
                  <Button
                    size="sm"
                    color="danger"
                    variant="soft"
                    onPress={openStaffPanel}
                  >
                    {tChat("contextMenu.openInStaffPanel")}
                  </Button>
                )}
                {!isSelf && (
                  <Button
                    size="sm"
                    color="danger"
                    variant="soft"
                    startDecorator={<FlagIcon size={16} weight="fill" />}
                    onPress={openReport}
                  >
                    {t("report.action")}
                  </Button>
                )}
              </Box>

              {!isSelf && (
                <Box
                  style={{
                    flexDirection: "row",
                    gap: 8,
                    alignItems: "flex-end",
                  }}
                >
                  <Box style={{ flex: 1 }}>
                    <MarkdownInput
                      value={content}
                      onChange={setContent}
                      selection={selection}
                      onChangeSelection={setSelection}
                      enableMentions={false}
                      editable={!denyMessaging && !sending}
                      placeholder={
                        denyMessaging
                          ? tChat("composer.placeholder.blocked")
                          : tChat("composer.placeholder.dm", {
                              name: displayName,
                            })
                      }
                      style={{ minHeight: 44 }}
                    />
                  </Box>
                  <IconButton
                    variant="plain"
                    color="primary"
                    padding={8}
                    disabled={!canSubmit}
                    onPress={handleSubmit}
                    style={{ borderRadius: 999 }}
                    accessibilityLabel={tChat("contextMenu.message")}
                  >
                    <PaperPlaneTiltIcon size={20} weight="fill" />
                  </IconButton>
                </Box>
              )}

              <Divider />

              {profile &&
                (profile.mobileBlocks.length > 0 ? (
                  <ProfileWidgetGrid profile={profile} user={user} />
                ) : (
                  <ProfileWidgetsEmptyViewer />
                ))}
            </Box>
          </View>
        </ScrollView>
      </View>
    );
  },
);
