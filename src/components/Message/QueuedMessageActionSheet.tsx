import { Button } from "@components/Button";
import { Paper } from "@components/Paper";
import { useAppStore } from "@hooks/useStores";
import { Box, Modal } from "@mutualzz/ui-native";
import type { QueuedMessage } from "@stores/objects/QueuedMessage";
import { QueuedMessageStatus } from "@stores/objects/QueuedMessage";
import { ArrowClockwiseIcon, TrashIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  message: QueuedMessage;
  visible: boolean;
  onClose: () => void;
}

export const QueuedMessageActionSheet = observer(
  ({ message, visible, onClose }: Props) => {
    const { t } = useTranslation("common");
    const app = useAppStore();
    const insets = useSafeAreaInsets();

    const canRetry = message.status === QueuedMessageStatus.Failed;

    const handleRetry = () => {
      onClose();
      void message.retry();
    };

    const handleDelete = () => {
      onClose();
      message.delete();
    };

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
        <View
          pointerEvents="box-none"
          style={{
            flex: 1,
            justifyContent: "flex-end",
            width: "100%",
          }}
        >
          <View onStartShouldSetResponder={() => true}>
            <Box
              style={{
                marginHorizontal: 12,
                marginBottom: insets.bottom + 12,
                gap: 8,
              }}
            >
              <Paper
                elevation={app.settings?.preferEmbossed ? 4 : 2}
                style={{
                  borderRadius: 16,
                  padding: 4,
                }}
              >
                {canRetry && (
                  <Button
                    fullWidth
                    variant="plain"
                    padding={14}
                    startDecorator={<ArrowClockwiseIcon size={20} />}
                    onPress={handleRetry}
                  >
                    {t("retry")}
                  </Button>
                )}
                <Button
                  fullWidth
                  variant="plain"
                  color="danger"
                  padding={14}
                  startDecorator={<TrashIcon size={20} weight="fill" />}
                  onPress={handleDelete}
                >
                  {t("delete")}
                </Button>
              </Paper>

              <Paper
                elevation={app.settings?.preferEmbossed ? 4 : 2}
                style={{
                  borderRadius: 16,
                }}
              >
                <Button
                  fullWidth
                  variant="soft"
                  padding={14}
                  onPress={onClose}
                >
                  {t("cancel")}
                </Button>
              </Paper>
            </Box>
          </View>
        </View>
      </Modal>
    );
  },
);
