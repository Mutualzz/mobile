import { Paper } from "@components/Paper";
import { useAppNavigation } from "@hooks/useAppNavigation";
import {
  Box,
  Button,
  ButtonGroup,
  InputDefault,
  Typography,
} from "@mutualzz/ui-native";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Pressable } from "react-native";

interface Props {
  setCreating: (creating: boolean) => void;
}

const exampleLink = "https://mutualzz.com/invite/fJ2XlEuD";

const regex =
  process.env.NODE_ENV === "development"
    ? /^(?:(?:https?:\/\/)?(?:www\.)?localhost:1420\/invite\/)?([A-Za-z0-9_-]{8,})$/
    : /^(?:(?:https?:\/\/)?(?:www\.)?mutualzz\.com\/invite\/)?([A-Za-z0-9_-]{8,})$/;

export const SpaceJoin = observer(({ setCreating }: Props) => {
  const { navigate } = useAppNavigation();
  const [inviteLink, setInviteLink] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { mutate: openInvite, isPending } = useMutation({
    mutationKey: ["open-invite", inviteLink],
    mutationFn: async () => {
      const match = inviteLink.match(regex);
      if (!match) throw new Error("Invalid invite link format.");

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
      setError("Invite link cannot be empty.");
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
      elevation={2}
      style={{
        borderRadius: 12,
        flexDirection: "column",
        padding: 16,
      }}
    >
      <Box
        style={{
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 40,
        }}
      >
        <Typography level="h5" weight="bold">
          Join a space
        </Typography>
        <Typography level="body-sm">
          Enter an invite below to join an existing space
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
          Invite Link{" "}
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
          marginTop: 5,
        }}
      >
        <Typography>Invites should look like:</Typography>
        <Typography textColor="muted">fJ2XlEuD</Typography>
        <Typography>or</Typography>
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
            Continue
          </Button>
        </ButtonGroup>
      </Box>
      <Box
        style={{
          alignItems: "center",
          marginTop: 20,
          flexDirection: "row",
          gap: 8,
        }}
      >
        <Typography>You prefer to create your own space?</Typography>
        <Pressable onPress={() => setCreating(true)}>
          <Typography variant="plain" color="primary" disabled={isPending}>
            Back to creating
          </Typography>
        </Pressable>
      </Box>
    </Paper>
  );
});
