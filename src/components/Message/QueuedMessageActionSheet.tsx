import { Button } from "@components/Button";
import { Box, Sheet } from "@mutualzz/ui-native";
import type { QueuedMessage } from "@stores/objects/QueuedMessage";
import { QueuedMessageStatus } from "@stores/objects/QueuedMessage";
import { ArrowClockwiseIcon, TrashIcon } from "phosphor-react-native";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

interface Props {
  message: QueuedMessage;
  visible: boolean;
  onClose: () => void;
}

export const QueuedMessageActionSheet = observer(
  ({ message, visible, onClose }: Props) => {
    const { t } = useTranslation("common");

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
      <Sheet
        open={visible}
        onClose={onClose}
        showCloseButton={false}
      enableDynamicSizing
      >
        <View style={{ width: "100%" }}>
          <View onStartShouldSetResponder={() => true}>
            <Box
              style={{
                width: "100%",
                padding: 16,
                gap: 8}}
            >
              <Box style={{ gap: 4 }}>
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
              </Box>
            </Box>
          </View>
        </View>
      </Sheet>
    );
  },
);
