import { Button } from "@components/Button";
import { useSheet } from "@hooks/useSheet";
import { Typography } from "@mutualzz/ui-native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

interface Props {
  type: "muted" | "deafened";
  sheetId: string;
}

export const SpaceModeratedSheet = ({ type, sheetId }: Props) => {
  const { t } = useTranslation("chat");
  const { closeSheet } = useSheet();

  return (
    <View
      style={{
        width: "100%",
        padding: 20,
        gap: 16}}
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
      <Button onPress={() => closeSheet(sheetId)}>
        {t("voice.spaceModerated.dismissMobile")}
      </Button>
    </View>
  );
};
