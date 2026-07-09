import { useModal } from "@hooks/useModal";
import { Modal, useTheme } from "@mutualzz/ui-native";
import { observer } from "mobx-react-lite";

export const ModalRoot = observer(() => {
  const { theme } = useTheme();
  const { modals, closingIds, finalizeClose } = useModal();

  if (modals.length === 0) return null;

  return (
    <>
      {modals.map((modal, idx) => (
        <Modal
          {...modal.props}
          key={modal.key}
          open={!closingIds.has(modal.id)}
          onClose={() => finalizeClose(modal.id)}
          style={{
            zIndex: theme.zIndex.modal + idx,
            ...(modal.props?.style as any),
          }}
        >
          {modal.content}
        </Modal>
      ))}
    </>
  );
});
