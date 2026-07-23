import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { SettingsScreen } from "@components/UserSettings/SettingsScreen";
import { SettingsScroll, SettingsSection, SettingsActionRow } from "@components/UserSettings/SettingsField";
import { ChangePasswordSheet } from "@components/UserSettings/ChangePasswordSheet";
import { DeleteAccountSheet } from "@components/UserSettings/DeleteAccountSheet";
import { EmailChangeSheet } from "@components/UserSettings/EmailChangeSheet";
import { EmailVerifySheet } from "@components/UserSettings/EmailVerifySheet";
import { UsernameChangeSheet } from "@components/UserSettings/UsernameChangeSheet";
import { UserAvatar } from "@components/User/UserAvatar";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useOpenBottomSheet } from "@hooks/useOpenBottomSheet";
import { useAppStore } from "@hooks/useStores";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import type { ColorLike } from "@mutualzz/ui-core";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";

import { maskEmail } from "@mutualzz/client";

const MyAccountSettings = () => {
  const { t } = useTranslation("settings");
  const app = useAppStore();
  const { theme } = useTheme();
  const { navigate } = useAppNavigation();
  const { openBottomSheet, closeBottomSheet } = useOpenBottomSheet();
  const account = app.account;
  const [hideEmail, setHideEmail] = useState(true);

  const { mutate: sendEmailVerification, isPending: sendingCode } = useMutation(
    {
      mutationKey: ["emailVerification", account?.id],
      mutationFn: () => app.rest.post("/@me/send-email-code"),
      onSuccess: () => {
        openBottomSheet(
          "email-verification",
          <EmailVerifySheet
            onClose={() => closeBottomSheet("email-verification")}
          />,
        );
      },
    },
  );

  const { mutate: sendConfirmEmail, isPending: confirmingEmail } = useMutation({
    mutationKey: ["confirmEmail", account?.id],
    mutationFn: () => {
      if (!account?.flags.has("Verified")) return Promise.resolve();
      return app.rest.post("/@me/confirm-email");
    },
    onSuccess: () => {
      openBottomSheet(
        "email-change",
        <EmailChangeSheet onClose={() => closeBottomSheet("email-change")} />,
      );
    },
  });

  if (!account) return null;

  const isVerified = account.flags.has("Verified");
  const elevation = app.settings?.preferEmbossed ? 4 : 2;

  return (
    <SettingsScreen title={t("pages.myAccount")} contentStyle={{ flex: 1 }}>
      <SettingsScroll>
      <Paper
        style={{
          borderRadius: 12,
          overflow: "hidden",
          gap: 0,
        }}
        elevation={elevation}
      >
        <Paper
          color={account.accentColor as ColorLike}
          style={{
            position: "relative",
            width: "100%",
            paddingTop: 36,
            paddingBottom: 20,
            borderRadius: 0,
          }}
          elevation={0}
        >
          <Box style={{ position: "absolute", top: 16, left: 12 }}>
            <UserAvatar user={account} size={72} badge />
          </Box>
        </Paper>

        <Box style={{ gap: 12, paddingHorizontal: 12, paddingBottom: 12 }}>
          <Box
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              paddingLeft: 84,
              minHeight: 40,
            }}
          >
            <Typography level="title-md" style={{ flex: 1 }} truncate="single">
              {account.displayName}
            </Typography>
            <Button
              size="sm"
              onPress={() => navigate("/settings/avatar-editor")}
            >
              {t("account.editAvatar")}
            </Button>
          </Box>

          <Paper
            style={{
              borderRadius: 10,
              padding: 12,
              gap: 16,
            }}
            elevation={app.settings?.preferEmbossed ? -2 : 0}
          >
            <SettingsActionRow
              title={t("account.displayName")}
              description={account.globalName ?? t("account.notSet")}
              actionLabel={t("account.edit")}
              onPress={() => navigate("/settings/profile")}
            />

            <SettingsActionRow
              title={t("account.username")}
              description={account.username}
              actionLabel={t("account.edit")}
              onPress={() =>
                openBottomSheet(
                  "change-username",
                  <UsernameChangeSheet
                    onClose={() => closeBottomSheet("change-username")}
                  />,
                )
              }
            />

            <SettingsActionRow
              title={t("account.email")}
              description={
                <Box style={{ gap: 4 }}>
                  {!isVerified && (
                    <Typography level="body-xs" color="danger">
                      {t("account.unverified")}
                    </Typography>
                  )}
                  <Box
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography level="body-xs" textColor="muted">
                      {hideEmail && isVerified
                        ? maskEmail(account.email ?? "")
                        : (account.email ?? t("account.notSet"))}
                    </Typography>
                    {isVerified ? (
                      <Pressable
                        onPress={() => setHideEmail((value) => !value)}
                        accessibilityRole="button"
                      >
                        <Typography level="body-xs" color="info">
                          {hideEmail ? t("account.show") : t("account.hide")}
                        </Typography>
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={() => sendEmailVerification()}
                        disabled={sendingCode}
                        accessibilityRole="button"
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 16,
                          backgroundColor: `${theme.colors.success}22`,
                        }}
                      >
                        <Typography level="body-xs" color="success" weight={600}>
                          {sendingCode ? t("account.sending") : t("account.verify")}
                        </Typography>
                      </Pressable>
                    )}
                  </Box>
                </Box>
              }
              actionLabel={t("account.edit")}
              actionDisabled={confirmingEmail}
              onPress={() => sendConfirmEmail()}
            />
          </Paper>
        </Box>
      </Paper>

      <SettingsSection title={t("account.password")}>
        <SettingsActionRow
          title={t("account.password")}
          actionLabel={t("account.changePassword")}
          onPress={() =>
            openBottomSheet(
              "change-password",
              <ChangePasswordSheet
                onClose={() => closeBottomSheet("change-password")}
              />,
            )
          }
        />
      </SettingsSection>

      <SettingsSection title={t("account.dangerZone")}>
        <Typography level="body-sm" textColor="muted">
          {t("account.dangerZoneDescription")}
        </Typography>
        <Button
          size="sm"
          color="danger"
          style={{ alignSelf: "flex-start" }}
          onPress={() =>
            openBottomSheet(
              "delete-account",
              <DeleteAccountSheet
                onClose={() => closeBottomSheet("delete-account")}
              />,
            )
          }
        >
          {t("account.deleteAccount")}
        </Button>
      </SettingsSection>
      </SettingsScroll>
    </SettingsScreen>
  );
};

export default observer(MyAccountSettings);
