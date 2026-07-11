import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import {
  HttpException,
  HttpStatusCode,
  RelationshipType,
} from "@mutualzz/types";
import { Box, InputDefault, Typography } from "@mutualzz/ui-native";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "react-native";

export const AddFriendTab = observer(() => {
  const app = useAppStore();
  const { t } = useTranslation("chat");
  const [identifier, setIdentifier] = useState("");

  const trimmed = identifier.trim();

  const matchingRelationship = app.relationships.all.find(
    (relationship) =>
      relationship.otherUser?.username === trimmed ||
      relationship.otherUserId === trimmed,
  );

  const isBlocked = matchingRelationship?.type === RelationshipType.Blocked;
  const isFriend = matchingRelationship?.type === RelationshipType.Friend;
  const alreadySent =
    matchingRelationship?.type === RelationshipType.OutgoingRequest;

  const buttonLabel = isFriend
    ? t("friends.alreadyFriends")
    : alreadySent
      ? t("friends.alreadySent")
      : t("friends.sendRequest");

  const isDisabled = !trimmed || isBlocked || isFriend || alreadySent;

  const { mutate: sendFriendRequest, isPending } = useMutation({
    mutationFn: () => app.relationships.sendFriendRequest(trimmed),
    onSuccess: () => {
      setIdentifier("");
      void app.relationships.resolveAll(true);
    },
    onError: (err: HttpException) => {
      const status = err instanceof HttpException ? err.status : null;
      const message =
        status === HttpStatusCode.NotFound
          ? t("friends.unknownUsername")
          : err instanceof Error
            ? err.message
            : t("friends.unknownUsername");
      Alert.alert(t("friends.sendFailed"), message);
    },
  });

  return (
    <Box style={{ gap: 16, paddingVertical: 8 }}>
      <Paper
        style={{
          padding: 16,
          borderRadius: 12,
          gap: 8,
        }}
        elevation={app.settings?.preferEmbossed ? 2 : 0}
      >
        <Typography level="body-lg" weight={700}>
          {t("friends.addTitle")}
        </Typography>
        <Typography level="body-sm" textColor="muted">
          {t("friends.addDescription")}
        </Typography>
      </Paper>

      <Box style={{ gap: 12 }}>
        <InputDefault
          fullWidth
          value={identifier}
          onChangeText={setIdentifier}
          placeholder={t("friends.usernamePlaceholder")}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="send"
          onSubmitEditing={() => {
            if (!isDisabled && !isPending) sendFriendRequest();
          }}
        />
        <Button
          fullWidth
          disabled={isDisabled || isPending}
          onPress={() => sendFriendRequest()}
        >
          {isPending ? t("feed.share.sending") : buttonLabel}
        </Button>
        {isBlocked && (
          <Typography level="body-sm" color="danger">
            {t("friends.blockedBeforeRequest")}
          </Typography>
        )}
      </Box>
    </Box>
  );
});
