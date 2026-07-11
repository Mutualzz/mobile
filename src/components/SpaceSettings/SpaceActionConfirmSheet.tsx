import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useModal } from "@hooks/useModal";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { useAppStore } from "@hooks/useStores";
import { Typography } from "@mutualzz/ui-native";
import type { Space } from "@stores/objects/Space";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  space: Space;
  action: "leave" | "delete";
  modalId?: string;
}

export const SpaceActionConfirmSheet = observer(
  ({ space, action, modalId = "space-action-confirm" }: Props) => {
    const { t } = useTranslation("space");
    const { t: tCommon } = useTranslation("common");
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
            ? t("confirm.deleteSpaceTitle", { name: space.name })
            : t("confirm.leaveSpaceTitle", { name: space.name })}
        </Typography>
        <Typography level="body-sm" textColor="muted">
          {t("confirm.cannotUndo")}
        </Typography>
        <Button
          color="danger"
          disabled={pending}
          onPress={() => void handleConfirm()}
        >
          {pending
            ? t("actions.working")
            : action === "delete"
              ? t("menu.deleteSpace")
              : t("menu.leaveSpace")}
        </Button>
        <Button
          variant="soft"
          color="neutral"
          disabled={pending}
          onPress={() => closeModal(modalId)}
        >
          {tCommon("cancel")}
        </Button>
      </Paper>
    );
  },
);
