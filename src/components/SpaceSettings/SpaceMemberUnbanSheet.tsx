import { Button } from "@components/Button";
import { useSheet } from "@hooks/useSheet";
import { useAppStore } from "@hooks/useStores";
import { Typography } from "@mutualzz/ui-native";
import type { SpaceBan } from "@stores/objects/SpaceBan";
import type { Space } from "@stores/objects/Space";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

interface Props {
  ban: SpaceBan;
  space: Space;
  sheetId?: string;
}

export const SpaceMemberUnbanSheet = observer(
  ({ ban, space, sheetId }: Props) => {
    const { t } = useTranslation("common");
    const { t: tSpace } = useTranslation("space");
    const app = useAppStore();
    const { closeSheet } = useSheet();
    const [pending, setPending] = useState(false);
    const id = sheetId ?? `space-ban-${ban.userId}`;

    const unban = async () => {
      setPending(true);
      try {
        await app.rest.delete(
          `/spaces/${space.id}/members/${ban.userId}/unban`,
        );
        space.removeBan(ban.userId);
        closeSheet(id);
      } finally {
        setPending(false);
      }
    };

    return (
      <View
                style={{
                    width: "100%",
                    padding: 16,
                    gap: 12,
                }}
            >
        <Typography level="body-md" weight={700}>
          {tSpace("bans.unbanTitle", {
            name: ban.user?.displayName ?? ban.userId,
          })}
        </Typography>
        {ban.reason && (
          <Typography level="body-sm" textColor="muted">
            {tSpace("bans.reason")}: {ban.reason}
          </Typography>
        )}
        <Button color="danger" disabled={pending} onPress={() => void unban()}>
          {pending
            ? tSpace("actions.unbanning")
            : tSpace("actions.unbanMember")}
        </Button>
        <Button
          variant="soft"
          color="neutral"
          disabled={pending}
          onPress={() => closeSheet(id)}
        >
          {t("cancel")}
        </Button>
      </View>
    );
  },
);
