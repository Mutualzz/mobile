import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useAppNavigation } from "@hooks/useAppNavigation";
import {
  Box,
  ButtonGroup,
  InputDefault,
  Typography,
} from "@mutualzz/ui-native";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@hooks/useStores";
import { useScaledSpaceJoinCardHeight } from "@utils/accessibilityLayout";

interface Props {
  setCreating: (creating: boolean) => void;
}

const exampleLink = "https://mutualzz.com/invite/fJ2XlEuD";

const regex =
  process.env.NODE_ENV === "development"
    ? /^(?:(?:https?:\/\/)?(?:www\.)?localhost:1420\/invite\/)?([A-Za-z0-9_-]{8,})$/
    : /^(?:(?:https?:\/\/)?(?:www\.)?mutualzz\.com\/invite\/)?([A-Za-z0-9_-]{8,})$/;

export const SpaceJoin = observer(({ setCreating }: Props) => {
  const app = useAppStore();
  const { t } = useTranslation("auth");
  const { navigate } = useAppNavigation();
  const [inviteLink, setInviteLink] = useState("");
  const cardHeight = useScaledSpaceJoinCardHeight();
  const [error, setError] = useState<string | null>(null);

  const { mutate: openInvite, isPending } = useMutation({
    mutationKey: ["open-invite", inviteLink],
    mutationFn: async () => {
      const match = inviteLink.match(regex);
      if (!match) throw new Error(t("onboarding.joinSpace.inviteLinkInvalid"));

      return match[1];
    },
    onSuccess: (code) => {
      navigate(`/invite/${code}`);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleJoin = () => {
    if (inviteLink.trim() === "") {
      setError(t("onboarding.joinSpace.inviteLinkEmpty"));
      return;
    }

    setError(null);
    openInvite();
  };

  const handleLink = (link: string) => {
    setError(null);
    setInviteLink(link);
  };

  return (
    <Paper
      elevation={app.settings?.preferEmbossed ? 2 : 0}
      style={{
        flexDirection: "column",
        justifyContent: "space-between",
        height: cardHeight,
        borderWidth: 0,
        paddingVertical: 8,
        paddingHorizontal: 16,
      }}
    >
      <Box
        style={{
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography level="h5" weight="bold">
          {t("onboarding.joinSpace.title")}
        </Typography>
        <Typography level="body-sm">
          {t("onboarding.joinSpace.description")}
        </Typography>
      </Box>

      <Box
        style={{
          flexDirection: "column",
          gap: 8,
          width: "100%",
        }}
      >
        <Typography weight={500} level="body-sm">
          {t("onboarding.joinSpace.inviteLink")}{" "}
          <Typography variant="plain" color="danger">
            *
          </Typography>
        </Typography>
        <InputDefault
          fullWidth
          value={inviteLink}
          onChangeText={handleLink}
          autoCorrect={false}
          autoCapitalize="none"
          autoComplete="off"
        />
        {error && (
          <Typography variant="plain" color="danger" level="body-sm">
            {error}
          </Typography>
        )}
      </Box>
      <Box
        style={{
          flexDirection: "column",
        }}
      >
        <Typography>{t("onboarding.joinSpace.examplesIntro")}</Typography>
        <Typography textColor="muted">fJ2XlEuD</Typography>
        <Typography>{t("onboarding.joinSpace.or")}</Typography>
        <Typography textColor="muted">{exampleLink}</Typography>
      </Box>
      <Box
        style={{
          paddingTop: 20,
          flexDirection: "row",
          justifyContent: "space-between",
          width: "100%",
          alignItems: "flex-end",
        }}
      >
        <ButtonGroup fullWidth spacing={2}>
          <Button
            disabled={isPending || inviteLink.trim() === ""}
            onPress={() => handleJoin()}
            variant="solid"
            color="success"
          >
            {t("onboarding.joinSpace.continue")}
          </Button>
        </ButtonGroup>
      </Box>
      <Box
        style={{
          alignItems: "center",

          flexDirection: "column",
          gap: 8,
        }}
      >
        <Typography>{t("onboarding.joinSpace.preferCreate")}</Typography>
        <Pressable onPress={() => setCreating(true)}>
          <Typography variant="plain" color="primary" disabled={isPending}>
            {t("onboarding.joinSpace.backToCreating")}
          </Typography>
        </Pressable>
      </Box>
    </Paper>
  );
});
