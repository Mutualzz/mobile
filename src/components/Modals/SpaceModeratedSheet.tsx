import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useModal } from "@hooks/useModal";
import { useAppStore } from "@hooks/useStores";
import { Typography } from "@mutualzz/ui-native";

interface Props {
  type: "muted" | "deafened";
  modalId: string;
}

export const SpaceModeratedSheet = ({ type, modalId }: Props) => {
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
        Space {type === "muted" ? "muted" : "deafened"}
      </Typography>
      <Typography level="body-sm">
        This channel has special permissions. To{" "}
        {type === "muted" ? "speak in it" : "listen in it"}, you&apos;ll need
        someone like a space moderator or admin to{" "}
        {type === "muted" ? "unmute" : "undeafen"} you.
      </Typography>
      <Button onPress={() => closeModal(modalId)}>Got it</Button>
    </Paper>
  );
};
