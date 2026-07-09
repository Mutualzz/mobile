import { AppKeyboardAvoidingView } from "@components/Keyboard/AppKeyboardAvoidingView";
import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { HttpException } from "@mutualzz/types";
import { Box, InputDefault, Modal, Typography } from "@mutualzz/ui-native";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { View } from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const EmailChangeSheet = observer(({ visible, onClose }: Props) => {
  const app = useAppStore();
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const verified = app.account?.flags.has("Verified");

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      verified
        ? app.rest.post("/@me/change-email", { code, email })
        : app.rest.post("/@me/change-email-unverified", { email }),
    onSuccess: onClose,
    onError: (err: HttpException) => setError(err.message),
  });

  return (
    <Modal
      open={visible}
      onClose={onClose}
      layout="fullscreen"
      showCloseButton={false}
      style={{
        justifyContent: "flex-end",
        alignItems: "stretch",
        backgroundColor: "transparent",
        paddingVertical: 0,
      }}
    >
      <View pointerEvents="box-none" style={{ flex: 1, justifyContent: "flex-end", width: "100%" }}>
        <AppKeyboardAvoidingView>
          <Paper
            elevation={app.settings?.preferEmbossed ? 4 : 2}
            style={{
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 20,
              gap: 12,
            }}
          >
            <Typography level="body-lg" weight="bold">
              Change Email
            </Typography>
            {verified && (
              <InputDefault
                fullWidth
                placeholder="Verification code"
                accessibilityLabel="Verification code"
                keyboardType="number-pad"
                value={code}
                onChangeText={setCode}
              />
            )}
            <InputDefault
              fullWidth
              placeholder="New email"
              accessibilityLabel="New email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
            {error && (
              <Typography color="danger" level="body-sm" accessibilityLiveRegion="polite">
                {error}
              </Typography>
            )}
            <Button disabled={isPending} onPress={() => mutate()}>
              Save
            </Button>
            <Button variant="plain" onPress={onClose}>
              Cancel
            </Button>
          </Paper>
        </AppKeyboardAvoidingView>
      </View>
    </Modal>
  );
});
