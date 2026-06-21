import { Time } from "@components/Time/Time";
import styled from "@emotion/native";
import { Box, Typography } from "@mutualzz/ui-native";
import { Message, type MessageLike } from "@stores/objects/Message";
import { observer } from "mobx-react-lite";
import type { PropsWithChildren } from "react";
import type { ViewProps } from "react-native";

interface Props extends PropsWithChildren, ViewProps {
  header?: boolean;
}

export const MessageBase = styled(Box)<Props>(({ header }) => ({
  flexDirection: "row",
  paddingTop: 2,
  paddingBottom: 2,

  ...(header ? { marginTop: 10 } : { alignItems: "center" }),
}));

export const MessageInfo = styled(Box)({
  width: 62,
  flexShrink: 0,
  paddingTop: 2,
  flexDirection: "row",
  justifyContent: "center",
});

export const MessageContent = styled(Box)(() => ({
  position: "relative",
  minWidth: 0,
  flex: 1,
  flexDirection: "column",
  justifyContent: "center",
  paddingRight: 48,
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
  paddingLeft: 4,
});

export const MessageDetails = observer(
  ({ message }: { message: MessageLike }) => {
    const isEdited = message instanceof Message && message.edited;

    return (
      <DetailsBase>
        <Time
          value={message.createdAt}
          defaultMode="relative"
          toggleOnPress
          toggleToMode="calendar"
          relativeStyle="long"
          refreshIntervalMs={30_000}
          typographyProps={{
            level: "body-xs",
          }}
          accessibilityLabelPrefix="Sent"
        />

        {isEdited && (
          <Typography textColor="muted" style={{ marginLeft: 4 }}>
            (edited)
          </Typography>
        )}
      </DetailsBase>
    );
  },
);
