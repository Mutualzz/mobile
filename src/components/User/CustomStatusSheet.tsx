import { BottomSheet } from "@components/Keyboard";
import { CustomStatusEditor } from "@components/User/CustomStatusEditor";
import { useAppStore } from "@hooks/useStores";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";

interface Props {
  visible?: boolean;
  onClose: () => void;
  onDone?: () => void;
  embedded?: boolean;
}

export const CustomStatusSheet = observer(
  ({ visible = true, onClose, onDone, embedded = false }: Props) => {
    const { t } = useTranslation("common");
    const app = useAppStore();
    const isActive = embedded || visible;

    const handleSaved = () => {
      onDone?.();
      onClose();
    };

    return (
      <BottomSheet
        embedded={embedded}
        open={visible}
        onClose={onClose}
        title={t("customStatus.title")}
        maxHeight="95%"
        keyboard="scroll"
        elevation={app.settings?.preferEmbossed ? 4 : 2}
      >
        <CustomStatusEditor active={isActive} onSaved={handleSaved} />
      </BottomSheet>
    );
  },
);
