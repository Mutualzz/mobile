import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { HttpException } from "@mutualzz/types";
import { Box, InputDefault, Typography } from "@mutualzz/ui-native";
import type { SpaceMember } from "@stores/objects/SpaceMember";
import type { Space } from "@stores/objects/Space";
import { useMutation } from "@tanstack/react-query";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Modal } from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  space: Space;
  member: SpaceMember;
}

export const MemberKickSheet = observer(
  ({ visible, onClose, space, member }: Props) => {
    const app = useAppStore();
    const [reason, setReason] = useState("");
    const [error, setError] = useState<string | null>(null);

    const { mutate, isPending } = useMutation({
      mutationFn: () =>
        app.rest.post(`/spaces/${space.id}/members/${member.userId}/kick`, {
          reason: reason.trim() || "No reason provided",
        }),
      onSuccess: onClose,
      onError: (err: HttpException) => setError(err.message),
    });

    return (
      <Modal visible={visible} animationType="fade" transparent>
        <Box
          style={{
            flex: 1,
            justifyContent: "center",
            padding: 24,
            backgroundColor: "rgba(0,0,0,0.45)",
          }}
        >
          <Paper
            elevation={app.settings?.preferEmbossed ? 4 : 2}
            style={{ padding: 20, borderRadius: 12, gap: 12 }}
          >
            <Typography weight="bold">
              Kick {member.user?.displayName}?
            </Typography>
            <InputDefault
              fullWidth
              placeholder="Reason (optional)"
              value={reason}
              onChangeText={setReason}
            />
            {error && (
              <Typography color="danger" level="body-sm">
                {error}
              </Typography>
            )}
            <Button
              color="danger"
              disabled={isPending}
              onPress={() => mutate()}
            >
              Kick
            </Button>
            <Button variant="plain" onPress={onClose}>
              Cancel
            </Button>
          </Paper>
        </Box>
      </Modal>
    );
  },
);
