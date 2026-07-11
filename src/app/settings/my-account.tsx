import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { SettingsScreen } from "@components/UserSettings/SettingsScreen";
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
import { type PropsWithChildren, type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable } from "react-native";

function maskEmail(email: string) {
  const atIndex = email.indexOf("@");
  if (atIndex === -1) return "****";

  const domain = email.slice(atIndex + 1);
  if (!domain) return "****";

  return `${"*".repeat(atIndex)}@${domain}`;
}

function AccountRow({
  label,
  labelSuffix,
  children,
  action,
}: PropsWithChildren<{
  label: string;
  labelSuffix?: ReactNode;
  action?: ReactNode;
}>) {
  return (
    <Box
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        minWidth: 0,
      }}
    >
      <Box style={{ flex: 1, gap: 4, minWidth: 0 }}>
        <Box style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Typography level="body-sm" weight={700}>
            {label}
          </Typography>
          {labelSuffix}
        </Box>
        {children}
      </Box>
      {action}
    </Box>
  );
}

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
    <SettingsScreen
      title={t("pages.myAccount")}
      contentStyle={{ padding: 16, gap: 20 }}
    >
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
            <AccountRow
              label={t("account.displayName")}
              action={
                <Button
                  size="sm"
                  variant="soft"
                  color="neutral"
                  onPress={() => navigate("/settings/profile")}
                >
                  {t("account.edit")}
                </Button>
              }
            >
              <Typography level="body-sm" textColor="muted">
                {account.globalName ?? t("account.notSet")}
              </Typography>
            </AccountRow>

            <AccountRow
              label={t("account.username")}
              action={
                <Button
                  size="sm"
                  variant="soft"
                  color="neutral"
                  onPress={() =>
                    openBottomSheet(
                      "change-username",
                      <UsernameChangeSheet
                        onClose={() => closeBottomSheet("change-username")}
                      />,
                    )
                  }
                >
                  {t("account.edit")}
                </Button>
              }
            >
              <Typography level="body-sm" textColor="muted">
                {account.username}
              </Typography>
            </AccountRow>

            <AccountRow
              label={t("account.email")}
              labelSuffix={
                !isVerified && (
                  <Typography level="body-xs" color="danger">
                    {t("account.unverified")}
                  </Typography>
                )
              }
              action={
                <Button
                  size="sm"
                  variant="soft"
                  color="neutral"
                  disabled={confirmingEmail}
                  onPress={() => sendConfirmEmail()}
                >
                  {t("account.edit")}
                </Button>
              }
            >
              <Box
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <Typography level="body-sm" textColor="muted">
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
            </AccountRow>
          </Paper>
        </Box>
      </Paper>

      <Box style={{ gap: 8 }}>
        <Typography level="body-sm" weight={700}>
          {t("account.password")}
        </Typography>
        <Button
          size="sm"
          style={{ alignSelf: "flex-start" }}
          onPress={() =>
            openBottomSheet(
              "change-password",
              <ChangePasswordSheet
                onClose={() => closeBottomSheet("change-password")}
              />,
            )
          }
        >
          {t("account.changePassword")}
        </Button>
      </Box>

      <Box style={{ gap: 8 }}>
        <Typography level="body-sm" weight={700} color="danger">
          {t("account.dangerZone")}
        </Typography>
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
      </Box>
    </SettingsScreen>
  );
};

export default observer(MyAccountSettings);
