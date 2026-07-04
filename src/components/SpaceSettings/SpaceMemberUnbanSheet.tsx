import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useModal } from "@hooks/useModal";
import { useAppStore } from "@hooks/useStores";
import { Typography } from "@mutualzz/ui-native";
import type { SpaceBan } from "@stores/objects/SpaceBan";
import type { Space } from "@stores/objects/Space";
import { observer } from "mobx-react-lite";
import { useState } from "react";

interface Props {
  ban: SpaceBan;
  space: Space;
  modalId?: string;
}

export const SpaceMemberUnbanSheet = observer(
  ({ ban, space, modalId }: Props) => {
    const app = useAppStore();
    const { closeModal } = useModal();
    const [pending, setPending] = useState(false);
    const id = modalId ?? `space-ban-${ban.userId}`;

    const unban = async () => {
      setPending(true);
      try {
        await app.rest.delete(
          `/spaces/${space.id}/members/${ban.userId}/unban`,
        );
        space.removeBan(ban.userId);
        closeModal(id);
      } finally {
        setPending(false);
      }
    };

    return (
      <Paper
        style={{
          width: 320,
          maxWidth: "100%",
          padding: 16,
          borderRadius: 12,
          gap: 12,
        }}
        elevation={app.settings?.preferEmbossed ? 4 : 2}
      >
        <Typography level="body-md" weight={700}>
          Unban {ban.user?.displayName ?? ban.userId}?
        </Typography>
        {ban.reason ? (
          <Typography level="body-sm" textColor="muted">
            Reason: {ban.reason}
          </Typography>
        ) : null}
        <Button color="danger" disabled={pending} onPress={() => void unban()}>
          {pending ? "Unbanning..." : "Unban member"}
        </Button>
        <Button
          variant="soft"
          color="neutral"
          disabled={pending}
          onPress={() => closeModal(id)}
        >
          Cancel
        </Button>
      </Paper>
    );
  },
);
