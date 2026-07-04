import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useModal } from "@hooks/useModal";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import { Typography } from "@mutualzz/ui-native";
import type { Space } from "@stores/objects/Space";
import { observer } from "mobx-react-lite";
import { useState } from "react";

interface Props {
  space: Space;
  action: "leave" | "delete";
  modalId?: string;
}

export const SpaceActionConfirmSheet = observer(
  ({ space, action, modalId = "space-action-confirm" }: Props) => {
    const app = useAppStore();
    const { closeModal } = useModal();
    const { navigate } = useAppNavigation();
    const [pending, setPending] = useState(false);

    const handleConfirm = async () => {
      setPending(true);
      try {
        if (action === "delete") {
          await space.delete();
        } else {
          await space.leave();
        }
        closeModal(modalId);
        navigate("/spaces");
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
          {action === "delete"
            ? `Delete "${space.name}"?`
            : `Leave "${space.name}"?`}
        </Typography>
        <Typography level="body-sm" textColor="muted">
          This action cannot be undone.
        </Typography>
        <Button
          color="danger"
          disabled={pending}
          onPress={() => void handleConfirm()}
        >
          {pending
            ? "Working..."
            : action === "delete"
              ? "Delete space"
              : "Leave space"}
        </Button>
        <Button
          variant="soft"
          color="neutral"
          disabled={pending}
          onPress={() => closeModal(modalId)}
        >
          Cancel
        </Button>
      </Paper>
    );
  },
);
