import { Button } from "@components/Button";
import { useSheet } from "@hooks/useSheet";
import { useAppNavigation } from "@hooks/useAppNavigation";
import { Box, Typography } from "@mutualzz/ui-native";
import type { Space } from "@stores/objects/Space";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

interface Props {
  space: Space;
  action: "leave" | "delete";
  sheetId?: string;
}

export const SpaceActionConfirmSheet = observer(
  ({ space, action, sheetId = "space-action-confirm" }: Props) => {
    const { t } = useTranslation("space");
    const { t: tCommon } = useTranslation("common");
    const { closeSheet } = useSheet();
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
        closeSheet(sheetId);
        navigate("/spaces");
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
          {action === "delete"
            ? t("confirm.deleteSpaceTitle", { name: space.name })
            : t("confirm.leaveSpaceTitle", { name: space.name })}
        </Typography>
        <Typography level="body-sm" textColor="muted">
          {t("confirm.cannotUndo")}
        </Typography>
        <Box style={{ flexDirection: "row", gap: 8 }}>
          <Button
            variant="soft"
            expand
            disabled={pending}
            onPress={() => closeSheet(sheetId)}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            color="danger"
            disabled={pending}
            onPress={() => void handleConfirm()}
            expand
          >
            {pending
              ? t("actions.working")
              : action === "delete"
                ? t("menu.deleteSpace")
                : t("menu.leaveSpace")}
          </Button>
        </Box>
      </View>
    );
  },
);
