import { Time } from "@components/Time/Time";
import styled from "@emotion/native";
import { Box, Typography, useTheme } from "@mutualzz/ui-native";
import { Message, type MessageLike } from "@stores/objects/Message";
import { useScaledMessageInfoWidth } from "@utils/accessibilityLayout";
import { getMessageLayoutStyles } from "@utils/messageLayout";
import { useAppStore } from "@hooks/useStores";
import { observer } from "mobx-react-lite";
import type { PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";
import type { ViewProps } from "react-native";

interface Props extends PropsWithChildren, ViewProps {
  header?: boolean;
  system?: boolean;
}

export const MessageBase = observer(function MessageBase({
  header,
  system,
  style,
  ...props
}: Props) {
  const app = useAppStore();
  const extended = app.settings?.extendedSettings;
  const layoutStyles = getMessageLayoutStyles(
    extended?.messageDisplay ?? "default",
    extended?.uiDensity ?? "default",
  );

  return (
    <Box
      style={[
        {
          flexDirection: system ? "row" : "column",
          paddingTop: layoutStyles.paddingYNative,
          paddingBottom: layoutStyles.paddingYNative,
          ...(header ? { marginTop: layoutStyles.headerMarginTopNative } : {}),
        },
        style,
      ]}
      {...props}
    />
  );
});

export const MessageRow = styled(Box)<{ header?: boolean }>(({ header }) => ({
  flexDirection: "row",
  ...(!header ? { alignItems: "center" } : {}),
}));

export function MessageInfo({
  children,
  style,
  ...props
}: PropsWithChildren<ViewProps>) {
  const infoWidth = useScaledMessageInfoWidth();

  return (
    <Box
      style={[
        {
          width: infoWidth,
          flexShrink: 0,
          paddingTop: 2,
          flexDirection: "row",
          justifyContent: "center",
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Box>
  );
}

export const MessageContent = styled(Box)(() => ({
  position: "relative",
  minWidth: 0,
  flex: 1,
  flexDirection: "column",
  justifyContent: "center",
  paddingRight: 48,
}));

export const ReplySection = styled(Box)(() => ({
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 8,
}));

export function ReplyConnectorArea({ children }: PropsWithChildren) {
  const infoWidth = useScaledMessageInfoWidth();

  return (
    <Box
      style={{
        width: infoWidth,
        flexShrink: 0,
        alignSelf: "stretch",
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "flex-end",
        paddingRight: 4,
      }}
    >
      {children}
    </Box>
  );
}

export function ReplyConnectorLine() {
  const { theme } = useTheme();

  return (
    <Box
      style={{
        width: 26,
        height: 14,
        borderLeftWidth: 2,
        borderTopWidth: 2,
        borderColor: theme.typography.colors.muted,
        borderTopLeftRadius: 6,
        opacity: 0.35,
      }}
    />
  );
}

export const ReplyContent = styled(Box)(() => ({
  flex: 1,
  minWidth: 0,
  flexDirection: "row",
  alignItems: "center",
  gap: 6,
  overflow: "hidden",
}));

export const ReplyAuthorName = styled(Box)(() => ({
  flexShrink: 0,
  flexDirection: "row",
  alignItems: "center",
}));

export const ReplyContentText = styled(Box)(() => ({
  flex: 1,
  minWidth: 0,
  overflow: "hidden",
}));

export const MessageContentText = styled(Box)<{
  sending?: boolean;
  failed?: boolean;
}>(({ theme, sending, failed }) => ({
  ...(sending && {
    opacity: 0.5,
  }),
  ...(failed && {
    color: theme.colors.danger,
  }),
  marginVertical: 2,
}));

export const DetailsBase = styled(Box)({
  flexShrink: 0,
  flexDirection: "row",
  alignItems: "center",
});

export const EditedIndicator = () => {
  const { t } = useTranslation("chat");
  return (
    <Typography
      level="body-xs"
      textColor="muted"
      style={{ marginLeft: 4, opacity: 0.75 }}
    >
      {t("message.edited")}
    </Typography>
  );
};

export const MessageDetails = observer(
  ({ message }: { message: MessageLike }) => {
    const app = useAppStore();
    const { t } = useTranslation("common");
    const isEdited = message instanceof Message && message.edited;
    const timestampFormat =
      app.settings?.extendedSettings.timestampFormat ?? "relative";

    return (
      <DetailsBase style={{ opacity: 0.6 }}>
        <Time
          value={message.createdAt}
          defaultMode={timestampFormat === "absolute" ? "absolute" : "relative"}
          toggleOnPress={timestampFormat === "relative"}
          toggleToMode="calendar"
          relativeStyle="short"
          refreshIntervalMs={30_000}
          typographyProps={{
            level: "body-xs",
            textColor: "muted",
          }}
          accessibilityLabelPrefix={t("a11y.sent")}
        />

        {isEdited && <EditedIndicator />}
      </DetailsBase>
    );
  },
);
