import { Button } from "@components/Button";
import { useAppStore } from "@hooks/useStores";
import { type HttpException } from "@mutualzz/types";
import { Box, InputDefault, Sheet, Typography } from "@mutualzz/ui-native";
import type { SpaceMember } from "@stores/objects/SpaceMember";
import type { Space } from "@stores/objects/Space";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  space: Space;
  member: SpaceMember;
}

export const MemberKickSheet = observer(
  ({ visible, onClose, space, member }: Props) => {
    const { t } = useTranslation("space");
    const { t: tCommon } = useTranslation("common");
    const app = useAppStore();
    const [reason, setReason] = useState("");
    const [error, setError] = useState<string | null>(null);

    const { mutate, isPending } = useMutation({
      mutationFn: () =>
        app.rest.post(`/spaces/${space.id}/members/${member.userId}/kick`, {
          reason: reason.trim() || t("bans.noReason")}),
      onSuccess: onClose,
      onError: (err: HttpException) => setError(err.message)});

    return (
      <Sheet
        open={visible}
        onClose={onClose}
        showCloseButton={false}
        enableDynamicSizing
      >
        <View
          style={{
            width: "100%",
            padding: 16,
            gap: 12}}
        >
          <Typography weight="bold">
            {t("moderation.kickTitle", {
              name: member.user?.displayName})}
          </Typography>
          <InputDefault
            fullWidth
            placeholder={t("moderation.reasonOptional")}
            accessibilityLabel={t("moderation.reasonOptional")}
            value={reason}
            onChangeText={setReason}
          />
          {error && (
            <Typography
              color="danger"
              level="body-sm"
              accessibilityLiveRegion="polite"
            >
              {error}
            </Typography>
          )}
          <Button
            color="danger"
            disabled={isPending}
            onPress={() => mutate()}
          >
            {t("actions.kick")}
          </Button>
          <Button variant="plain" onPress={onClose}>
            {tCommon("cancel")}
          </Button>
        </View>
      </Sheet>
    );
  },
);
