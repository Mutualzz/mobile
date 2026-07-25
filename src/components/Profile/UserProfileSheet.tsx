import { Button } from "@components/Button";
import { ProfileMarkdownContent } from "@components/Profile/shared/ProfileMarkdownContent";
import { ProfileScrim } from "@components/Profile/shared/ProfileScrim";
import { RecentActivitiesSection } from "@components/Profile/shared/RecentActivitiesSection";
import { UserPresenceCard } from "@components/Profile/UserPresenceCard";
import { ProfileWidgetGrid } from "@components/Profile/widgets/ProfileWidgetGrid";
import { ProfileWidgetsEmptyViewer } from "@components/Profile/widgets/ProfileWidgetsEmptyViewer";
import { CustomStatusDisplay } from "@components/CustomStatus/CustomStatusDisplay";
import { ChangeOnlineStatusSheet } from "@components/User/ChangeOnlineStatusSheet";
import { CustomStatusSheet } from "@components/User/CustomStatusSheet";
import { ActionMenu } from "@components/ActionMenu/ActionMenu";
import { UserActionMenu } from "@components/User/UserActionMenu";
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
import { IconButton } from "@components/IconButton";
import { Box, Divider, Typography, useTheme } from "@mutualzz/ui-native";
import { useScaledProfileMetrics } from "@utils/accessibilityLayout";
import {
  getNonCustomActivities,
  hasCustomStatusContent,
} from "@mutualzz/client";
import { formatRestError } from "@mutualzz/client";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ChatCircleIcon,
  DotsThreeIcon,
  GearIcon,
  PhoneIcon,
  PencilSimpleIcon,
  XIcon,
} from "phosphor-react-native";
import { ProfileBackgroundLayer } from "@components/Profile/shared/ProfileBackgroundLayer";
import { ProfileBlockImage } from "@components/Profile/shared/ProfileBlockImage";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo } from "react";
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
    const { closeSheet } = useSheet();
    const { openBottomSheet, closeBottomSheet } = useOpenBottomSheet();
    const { navigate } = useAppNavigation();

    const openOnlineStatusSheet = () => {
      openBottomSheet(
        "change-online-status",
        <ChangeOnlineStatusSheet
          embedded
          onClose={() => closeBottomSheet("change-online-status")}
          onDone={() => closeBottomSheet("change-online-status")}
        />,
      );
    };

    const openCustomStatusSheet = () => {
      openBottomSheet(
        "custom-status",
        <CustomStatusSheet
          embedded
          onClose={() => closeBottomSheet("custom-status")}
          onDone={() => closeBottomSheet("custom-status")}
        />,
      );
    };

    const isSelf =
      app.account?.id != null && String(app.account.id) === String(user.id);
    const showAccountMenu = accountMenu && isSelf;

    const { data: fetchedProfile, isFetched: profileFetchDone } = useQuery({
      queryKey: ["profile-popout", user.id, app.account?.id],
      enabled: !!user.id && (!isSelf || !!app.account),
      queryFn: () => app.profiles.resolve(user.id, true),
    });

    const profileRestricted =
      !isSelf && profileFetchDone && fetchedProfile === undefined;
    const displayProfile = profileRestricted
      ? undefined
      : (fetchedProfile ?? app.profiles.get(user.id));
    void displayProfile?.updatedAt;

    useEffect(() => {
      if (profileRestricted) return;
      app.gateway.subscribeUser(user.id);
      return () => app.gateway.unsubscribeUser(user.id);
    }, [app.gateway, user.id, profileRestricted]);

    useEffect(() => {
      if (!isSelf) void app.relationships.resolveAll();
    }, [app.relationships, isSelf]);

    useEffect(() => {
      if (isSelf) return;
      void app.users.resolve(user.id);
    }, [app.users, isSelf, user.id]);

    const { iBlockedThem } = useUserRelationshipActions(user.id);

    const relationship = app.relationships.getForMe(user.id);
    const theyBlockedMe =
      !!relationship?.isBlocked && relationship.userId !== app.account?.id;
    const denyMessaging =
      !!user.flags?.has("System") ||
      iBlockedThem ||
      ("viewerCanDm" in user && user.viewerCanDm === false);

    const close = () => {
      if (onClose) {
        onClose();
        return;
      }

      closeSheet(sheetId);
    };

    const { mutate: openMessage, isPending: openingMessage } = useMutation({
      mutationKey: ["profile-sheet-message", user.id],
      mutationFn: () => app.relationships.openDMWith(user.id),
      onSuccess: (channel) => {
        close();
        app.setDMDrawerOpen(false);
        navigate(`/@me/${channel.id}`);
      },
      onError: (err) => {
        Alert.alert(
          tChat("cannotMessagePerson"),
          formatRestError(err, tChat("cannotMessagePerson")),
        );
      },
    });

    const { mutate: startUserCall, isPending: startingCall } = useMutation({
      mutationKey: ["profile-sheet-call", user.id],
      mutationFn: async () => {
        if (theyBlockedMe) throw new Error(tChat("cannotMessagePerson"));
        const channel = await app.channels.openDM(user.id);
        await app.calls.startCall(channel.id, { silent: false });
        return channel;
      },
      onSuccess: (channel) => {
        close();
        app.setDMDrawerOpen(false);
        navigate(`/@me/${channel.id}`);
      },
      onError: (err) => {
        Alert.alert(
          tChat("call.start"),
          formatRestError(err, tChat("call.start")),
        );
      },
    });

    const bannerUrl = profileRestricted
      ? undefined
      : displayProfile?.constructBannerUrl();
    const displayName = member?.displayName ?? user.displayName;
    const presence = profileRestricted ? undefined : app.presence.get(user.id);
    const customActivity = presence?.activities.find(
      (a) => a.type === "custom",
    );
    const customStatusText = isSelf
      ? app.customStatus.effectiveText
      : (customActivity?.state ?? customActivity?.name ?? "");
    const customStatusEmoji = isSelf
      ? app.customStatus.effectiveEmoji
      : (customActivity?.emoji ?? null);
    const hasCustomStatus = hasCustomStatusContent(
      customStatusText,
      customStatusEmoji,
    );
    const presenceLabel =
      hasCustomStatus && !isSelf
        ? customStatusText
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

    const headerBlock = displayProfile?.blocks.find(
      (block): block is ProfileHeaderBlock => block.type === "header",
    );

    const hasActivityWidget =
      displayProfile?.mobileBlocks.some((block) => block.type === "activity") ??
      false;

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

    const messageDisabled = denyMessaging || openingMessage || startingCall;
    const callDisabled = denyMessaging || openingMessage || startingCall;

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
        {displayProfile && !profileRestricted ? (
          <ProfileBackgroundLayer profile={displayProfile} />
        ) : null}

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
                {bannerUrl && displayProfile && (
                  <ProfileBlockImage
                    uri={bannerUrl}
                    assetHash={displayProfile.banner}
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
                  onPress={() => showAccountMenu && openOnlineStatusSheet()}
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
                    onPress={openCustomStatusSheet}
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
                      {hasCustomStatus ? (
                        <CustomStatusDisplay
                          text={customStatusText}
                          emoji={customStatusEmoji}
                          truncate="double"
                          emojiSize={16}
                        />
                      ) : (
                        <Typography
                          level="body-sm"
                          textColor="muted"
                          truncate="double"
                        >
                          {t("customStatus.setShort")}
                        </Typography>
                      )}
                    </Box>
                  </Pressable>
                )}
              </View>
            </View>

            <Box style={{ paddingHorizontal: 16, gap: 12 }}>
              <ProfileScrim>
                <Box>
                  <Box
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                      flexWrap: "wrap",
                      minWidth: 0,
                    }}
                  >
                    <Typography level="title-lg" truncate="single">
                      {displayName}
                    </Typography>
                    {(user.pronouns ?? displayProfile?.pronouns) &&
                    !profileRestricted ? (
                      <>
                        <Typography level="body-sm" textColor="muted">
                          ·
                        </Typography>
                        <Typography
                          level="body-sm"
                          textColor="muted"
                          truncate="single"
                        >
                          {user.pronouns ?? displayProfile?.pronouns}
                        </Typography>
                      </>
                    ) : null}
                  </Box>
                  <Typography
                    level="body-md"
                    textColor="muted"
                    truncate="single"
                  >
                    @{user.username}
                  </Typography>
                  {profileRestricted ? null : presenceLabel &&
                    !showAccountMenu ? (
                    <Typography level="body-sm" textColor="accent">
                      {presenceLabel}
                    </Typography>
                  ) : null}
                </Box>
                {!profileRestricted && displayProfile?.bio ? (
                  <Box style={{ marginTop: 8 }}>
                    <ProfileMarkdownContent value={displayProfile.bio} />
                  </Box>
                ) : null}
              </ProfileScrim>

              {!profileRestricted && !hasActivityWidget && (
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

              {isSelf && (
                <Box style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
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
                </Box>
              )}

              {!isSelf && (
                <Box style={{ flexDirection: "row", gap: 8 }}>
                  <Button
                    color="primary"
                    disabled={messageDisabled}
                    onPress={() => openMessage()}
                    startDecorator={<ChatCircleIcon size={18} weight="fill" />}
                    expand
                  >
                    {tChat("contextMenu.message")}
                  </Button>
                  <Button
                    color="neutral"
                    disabled={callDisabled}
                    onPress={() => startUserCall()}
                    startDecorator={<PhoneIcon size={18} weight="fill" />}
                    expand
                  >
                    {tChat("call.start")}
                  </Button>
                </Box>
              )}

              <Divider />

              {!profileRestricted &&
                displayProfile &&
                (displayProfile.mobileBlocks.length > 0 ? (
                  <ProfileWidgetGrid profile={displayProfile} user={user} />
                ) : (
                  <ProfileWidgetsEmptyViewer />
                ))}
            </Box>
          </View>
        </ScrollView>

        <View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            top: 24,
            left: 16,
            right: 16,
            zIndex: 2,
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

          {showAccountMenu ? (
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
          ) : !isSelf ? (
            <ActionMenu
              align="end"
              renderTrigger={(open) => (
                <IconButton
                  variant="solid"
                  color="neutral"
                  padding={4}
                  accessibilityLabel={t("a11y.moreOptions")}
                  onPress={open}
                  style={{ borderRadius: 9999 }}
                  size="sm"
                >
                  <DotsThreeIcon size={18} weight="bold" />
                </IconButton>
              )}
            >
              {(closeMenu) => (
                <UserActionMenu
                  user={user as User}
                  hideMessage
                  onNavigate={close}
                  onClose={closeMenu}
                />
              )}
            </ActionMenu>
          ) : null}
        </View>
      </View>
    );
  },
);
