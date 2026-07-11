import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useModal } from "@hooks/useModal";
import { useAppStore } from "@hooks/useStores";
import { Typography } from "@mutualzz/ui-native";
import { useTranslation } from "react-i18next";

interface Props {
  type: "muted" | "deafened";
  modalId: string;
}

export const SpaceModeratedSheet = ({ type, modalId }: Props) => {
  const { t } = useTranslation("chat");
  const app = useAppStore();
  const { closeModal } = useModal();

  return (
    <Paper
      elevation={app.settings?.preferEmbossed ? 4 : 2}
      style={{
        width: 320,
        maxWidth: "100%",
        padding: 20,
        borderRadius: 12,
        gap: 16,
      }}
    >
      <Typography level="body-lg" weight={700}>
        {type === "muted"
          ? t("voice.spaceModerated.mutedTitle")
          : t("voice.spaceModerated.deafenedTitle")}
      </Typography>
      <Typography level="body-sm">
        {type === "muted"
          ? t("voice.spaceModerated.mutedBody")
          : t("voice.spaceModerated.deafenedBody")}
      </Typography>
      <Button onPress={() => closeModal(modalId)}>
        {t("voice.spaceModerated.dismissMobile")}
      </Button>
    </Paper>
  );
};
